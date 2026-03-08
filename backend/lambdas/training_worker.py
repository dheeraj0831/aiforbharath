"""
Lambda: training_worker
Triggered by EventBridge when sales data is uploaded.
Simulates ML model training (20s delay), then triggers email notification.
"""

import json
import time
import os

import boto3

dynamodb = boto3.resource("dynamodb")
lambda_client = boto3.client("lambda")

TABLE_NAME = os.environ.get("SHOP_USERS_TABLE", "ShopUsers")
EMAIL_FUNCTION = os.environ.get("EMAIL_FUNCTION_NAME", "aiforbharath-send-email-notification")


def handler(event, context):
    try:
        # Parse userId from EventBridge detail
        detail = event.get("detail", {})
        user_id = detail.get("userId", "")

        if not user_id:
            print("No userId in event detail")
            return {"statusCode": 400, "body": "Missing userId"}

        table = dynamodb.Table(TABLE_NAME)

        # Step 1: Set status to TRAINING
        table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET trainingStatus = :s",
            ExpressionAttributeValues={":s": "TRAINING"},
        )
        print(f"[{user_id}] Training started")

        # Step 2: Simulate training (20 seconds)
        time.sleep(20)

        # Step 3: Set status to READY
        table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET trainingStatus = :s",
            ExpressionAttributeValues={":s": "READY"},
        )
        print(f"[{user_id}] Training complete")

        # Step 4: Trigger email notification
        lambda_client.invoke(
            FunctionName=EMAIL_FUNCTION,
            InvocationType="Event",  # async
            Payload=json.dumps({"userId": user_id}),
        )
        print(f"[{user_id}] Email notification triggered")

        return {"statusCode": 200, "body": "Training complete"}

    except Exception as exc:
        print(f"Training worker error: {exc}")
        return {"statusCode": 500, "body": str(exc)}
