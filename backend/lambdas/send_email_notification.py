"""
Lambda: send_email_notification
Invoked by training_worker after training completes.
Sends a "training ready" email via Amazon SES.
"""

import json
import os

import boto3

dynamodb = boto3.resource("dynamodb")
ses = boto3.client("ses")

TABLE_NAME = os.environ.get("SHOP_USERS_TABLE", "ShopUsers")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@aiforbharath.com")


def handler(event, context):
    try:
        user_id = event.get("userId", "")

        if not user_id:
            print("No userId provided")
            return {"statusCode": 400, "body": "Missing userId"}

        # Fetch user details
        table = dynamodb.Table(TABLE_NAME)
        resp = table.get_item(Key={"userId": user_id})
        user = resp.get("Item")

        if not user:
            print(f"User {user_id} not found")
            return {"statusCode": 404, "body": "User not found"}

        owner_name = user.get("ownerName", "Shop Owner")
        recipient_email = user.get("email", "")

        if not recipient_email:
            print(f"No email for user {user_id}")
            return {"statusCode": 400, "body": "No email address"}

        subject = "Your AI Sales Insights Are Ready"
        body_html = f"""
        <html>
        <body style="font-family: 'Inter', Arial, sans-serif; color: #1a1f36; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 16px; padding: 32px; color: #f1f5f9;">
                <h1 style="color: #5eead4; margin-top: 0;">🎉 Your AI Sales Insights Are Ready</h1>
                <p style="font-size: 16px; line-height: 1.6;">Hello <strong>{owner_name}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">
                    Your sales data has been processed successfully. You can now access:
                </p>
                <ul style="font-size: 15px; line-height: 1.8; color: #94a3b8;">
                    <li>📊 Demand forecasts</li>
                    <li>💰 Price optimization suggestions</li>
                    <li>📦 Product insights</li>
                </ul>
                <p style="font-size: 16px; line-height: 1.6;">
                    Login to your dashboard to explore your insights.
                </p>
                <div style="margin-top: 24px;">
                    <a href="https://aiforbharath.com/shop-dashboard"
                       style="background: #5eead4; color: #0f172a; padding: 12px 24px; border-radius: 12px;
                              text-decoration: none; font-weight: 600; display: inline-block;">
                        Open Dashboard →
                    </a>
                </div>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">
                AI for Bharath — Empowering local businesses with AI
            </p>
        </body>
        </html>
        """

        body_text = f"""Hello {owner_name},

Your sales data has been processed successfully.

You can now access:
- Demand forecasts
- Price optimization suggestions
- Product insights

Login to your dashboard to explore your insights.

AI for Bharath - Empowering local businesses with AI
"""

        ses.send_email(
            Source=SENDER_EMAIL,
            Destination={"ToAddresses": [recipient_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": body_text, "Charset": "UTF-8"},
                    "Html": {"Data": body_html, "Charset": "UTF-8"},
                },
            },
        )

        print(f"Email sent to {recipient_email}")
        return {"statusCode": 200, "body": "Email sent"}

    except Exception as exc:
        print(f"Email error: {exc}")
        return {"statusCode": 500, "body": str(exc)}
