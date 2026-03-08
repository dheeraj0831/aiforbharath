"""
Lambda: create_user
POST /signup
Creates a new shop owner in DynamoDB ShopUsers table.
"""

import json
import uuid
import hashlib
import os
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("SHOP_USERS_TABLE", "ShopUsers")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))

        required = ["shopName", "ownerName", "email", "phone", "city", "password"]
        missing = [f for f in required if not body.get(f)]
        if missing:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": f"Missing fields: {', '.join(missing)}"}),
            }

        table = dynamodb.Table(TABLE_NAME)

        # Check if email already exists
        resp = table.scan(
            FilterExpression="email = :e",
            ExpressionAttributeValues={":e": body["email"]},
        )
        if resp.get("Items"):
            return {
                "statusCode": 409,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Email already registered"}),
            }

        user_id = str(uuid.uuid4())
        item = {
            "userId": user_id,
            "shopName": body["shopName"],
            "ownerName": body["ownerName"],
            "email": body["email"],
            "phone": body["phone"],
            "city": body["city"],
            "hashPass": hash_password(body["password"]),
            "trainingStatus": "NOT_STARTED",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

        table.put_item(Item=item)

        return {
            "statusCode": 201,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"userId": user_id, "message": "User created successfully"}),
        }

    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(exc)}),
        }
