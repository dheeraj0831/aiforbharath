"""
Lambda: check_training_status
GET /training-status/{userId}
Returns the current trainingStatus for a user.
"""

import json
import os

import boto3

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("SHOP_USERS_TABLE", "ShopUsers")


def handler(event, context):
    try:
        user_id = event.get("pathParameters", {}).get("userId", "")

        if not user_id:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "userId is required"}),
            }

        table = dynamodb.Table(TABLE_NAME)
        resp = table.get_item(Key={"userId": user_id})
        item = resp.get("Item")

        if not item:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "User not found"}),
            }

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"trainingStatus": item["trainingStatus"]}),
        }

    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(exc)}),
        }
