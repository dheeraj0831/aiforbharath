"""
Lambda: login_user
POST /login
Authenticates a shop owner by email + password.
"""

import json
import hashlib
import os

import boto3

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("SHOP_USERS_TABLE", "ShopUsers")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))

        email = body.get("email", "").strip()
        password = body.get("password", "")

        if not email or not password:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Email and password are required"}),
            }

        table = dynamodb.Table(TABLE_NAME)

        resp = table.scan(
            FilterExpression="email = :e",
            ExpressionAttributeValues={":e": email},
        )
        items = resp.get("Items", [])

        if not items:
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Invalid email or password"}),
            }

        user = items[0]

        if user["hashPass"] != hash_password(password):
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Invalid email or password"}),
            }

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "userId": user["userId"],
                "shopName": user["shopName"],
                "ownerName": user["ownerName"],
                "email": user["email"],
                "trainingStatus": user["trainingStatus"],
            }),
        }

    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(exc)}),
        }
