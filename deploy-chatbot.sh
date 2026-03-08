#!/bin/bash
set -euo pipefail

# ─── Deploy KiranaIQ Chatbot Lambda + API Gateway Route ─────────────────
# Prerequisites: AWS CLI configured, source ./aws-connect.sh first
# Usage: bash deploy-chatbot.sh

FUNCTION_NAME="aiforbharath-chatbot"
HANDLER="chatbot_handler.handler"
RUNTIME="python3.11"
ROLE_ARN="arn:aws:iam::382749986047:role/aiforbharath-lambda-role"
REGION="ap-south-1"
API_ID="2apndbzpbi"
LAMBDA_DIR="backend/lambdas"
ACCOUNT_ID="382749986047"

echo "📦 Packaging Lambda..."
cd "$LAMBDA_DIR"
zip -j /tmp/chatbot_handler.zip chatbot_handler.py
cd - > /dev/null

# ── Step 1: Add Bedrock permissions to the Lambda role ───────────────────
echo "🔐 Adding Bedrock permissions to Lambda role..."
BEDROCK_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/amazon.nova-lite-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::kirana-ai-hackathon",
        "arn:aws:s3:::kirana-ai-hackathon/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-1:382749986047:table/ShopUsers"
    }
  ]
}'

aws iam put-role-policy \
  --role-name aiforbharath-lambda-role \
  --policy-name chatbot-bedrock-s3-policy \
  --policy-document "$BEDROCK_POLICY" \
  --region "$REGION" 2>/dev/null && echo "  ✅ Policy attached" || echo "  ⚠️  Policy may already exist"

echo ""

# ── Step 2: Create or update the Lambda function ────────────────────────
echo "🚀 Creating/updating Lambda function..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null; then
  echo "  Function exists, updating code..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb:///tmp/chatbot_handler.zip \
    --region "$REGION"
else
  echo "  Creating new function..."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "$HANDLER" \
    --zip-file fileb:///tmp/chatbot_handler.zip \
    --timeout 30 \
    --memory-size 256 \
    --environment "Variables={SERIES_BUCKET=kirana-ai-hackathon,SERIES_PREFIX=data/series/,SHOP_USERS_TABLE=ShopUsers,BEDROCK_MODEL_ID=amazon.nova-lite-v1:0}" \
    --region "$REGION"
fi

echo ""

# ── Step 3: Add /chat route to HTTP API ──────────────────────────────────
echo "🌐 Setting up API Gateway integration..."

# Create Lambda integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type AWS_PROXY \
  --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}" \
  --payload-format-version "2.0" \
  --region "$REGION" \
  --query 'IntegrationId' \
  --output text 2>/dev/null) || true

if [ -n "$INTEGRATION_ID" ]; then
  echo "  ✅ Integration created: $INTEGRATION_ID"

  # Create POST /chat route
  aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "POST /chat" \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" 2>/dev/null && echo "  ✅ POST /chat route created" || echo "  ⚠️  Route may already exist"

  # Create OPTIONS /chat route for CORS
  aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "OPTIONS /chat" \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" 2>/dev/null && echo "  ✅ OPTIONS /chat route created" || echo "  ⚠️  OPTIONS route may already exist"
else
  echo "  ⚠️  Integration may already exist, skipping..."
fi

# ── Step 4: Grant API Gateway permission to invoke Lambda ────────────────
echo ""
echo "🔑 Adding Lambda invoke permission..."
aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id "apigateway-chat-invoke" \
  --action "lambda:InvokeFunction" \
  --principal "apigateway.amazonaws.com" \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*/chat" \
  --region "$REGION" 2>/dev/null && echo "  ✅ Permission granted" || echo "  ⚠️  Permission may already exist"

echo ""
echo "════════════════════════════════════════════"
echo "✅ Deployment complete!"
echo "Endpoint: https://${API_ID}.execute-api.${REGION}.amazonaws.com/chat"
echo "Test with:"
echo "  curl -X POST https://${API_ID}.execute-api.${REGION}.amazonaws.com/chat \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"message\": \"Hello\", \"userId\": \"test\", \"conversationHistory\": []}'"
echo "════════════════════════════════════════════"
