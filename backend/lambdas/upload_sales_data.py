"""
Lambda: upload_sales_data
POST /upload-sales
Receives base64 Excel file, stores in S3, updates DynamoDB status,
and triggers EventBridge training event.
"""

import json
import base64
import os

import boto3

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")
events = boto3.client("events")

TABLE_NAME = os.environ.get("SHOP_USERS_TABLE", "ShopUsers")
BUCKET_NAME = os.environ.get("SALES_DATA_BUCKET", "aiforbharath-sales-data")
EVENT_BUS = os.environ.get("EVENT_BUS_NAME", "default")


def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        user_id = body.get("userId", "")
        file_data = body.get("fileData", "")  # base64-encoded

        if not user_id or not file_data:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "userId and fileData are required"}),
            }

        # Decode and upload to S3
        file_bytes = base64.b64decode(file_data)
        s3_key = f"sales-data/{user_id}/sales_upload.xlsx"

        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_bytes,
            ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        # Update DynamoDB training status
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET trainingStatus = :s",
            ExpressionAttributeValues={":s": "UPLOADED"},
        )

        # Trigger EventBridge training event
        events.put_events(
            Entries=[
                {
                    "Source": "aiforbharath.onboarding",
                    "DetailType": "SalesDataUploaded",
                    "Detail": json.dumps({"userId": user_id}),
                    "EventBusName": EVENT_BUS,
                }
            ]
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "message": "File uploaded successfully",
                "s3Key": s3_key,
                "trainingStatus": "UPLOADED",
            }),
        }

    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(exc)}),
        }
