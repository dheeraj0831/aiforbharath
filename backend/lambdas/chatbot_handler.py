"""
Lambda: chatbot_handler
POST /chat
Natural-language chatbot powered by Amazon Bedrock (Nova Lite).
Parses user intent and orchestrates actions (add SKU, forecast, training, etc.)
"""

import json
import os
import re
from datetime import datetime, timedelta

import boto3

# ── AWS clients ──────────────────────────────────────────────────────────
bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

# ── Config ───────────────────────────────────────────────────────────────
SERIES_BUCKET = os.environ.get("SERIES_BUCKET", "kirana-ai-hackathon")
SERIES_PREFIX = os.environ.get("SERIES_PREFIX", "data/series/")
SHOP_USERS_TABLE = os.environ.get("SHOP_USERS_TABLE", "ShopUsers")
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "amazon.nova-lite-v1:0")

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

# ── System prompt for Bedrock ────────────────────────────────────────────
SYSTEM_PROMPT_TEMPLATE = """You are KiranaIQ Assistant, an AI helper for Indian kirana (grocery) store owners.
You help them manage inventory, add new products (SKUs), check demand forecasts, and start AI training.

When the user sends a message, respond with a JSON object (and ONLY a JSON object, no markdown) with these fields:
{{
  "intent": "<one of: add_sku | get_forecast | start_training | check_status | list_skus | general>",
  "params": {{ ... extracted parameters ... }},
  "reply": "<friendly natural-language reply to show the user>"
}}

Intent details:
- add_sku: User wants to add a new product/SKU. Extract: sku_name (string), mrp (number).
  Example input: "Add SKU Amul Paneer 200g with MRP 95"
  Example output: {{"intent":"add_sku","params":{{"sku_name":"Amul Paneer 200g","mrp":95}},"reply":"Adding Amul Paneer 200g with MRP ₹95..."}}

- get_forecast: User wants demand forecast for a product. Extract: sku_name (string), optional series_id.
  Example input: "What's the forecast for Tata Salt?"
  Example output: {{"intent":"get_forecast","params":{{"sku_name":"Tata Salt"}},"reply":"Let me check the demand forecast for Tata Salt..."}}

- start_training: User wants to train/retrain the AI model. Extract: optional city, optional notes.
  Example input: "Train model for new kirana store in Hyderabad"
  Example output: {{"intent":"start_training","params":{{"city":"Hyderabad"}},"reply":"Got it! I'll start training the model for a Hyderabad store."}}

- check_status: User wants to check training or system status.
  Example output: {{"intent":"check_status","params":{{}},"reply":"Let me check the current status..."}}

- list_skus: User wants to see their products / SKU catalog.
  Example output: {{"intent":"list_skus","params":{{}},"reply":"Let me fetch your product catalog..."}}

- general: Any other question (greetings, help, about the system, etc.)
  Provide a helpful reply in the "reply" field.

{sku_context}

Always be friendly, use Indian English, mention rupee symbol ₹ for prices. Keep replies concise (1-3 sentences).
"""


def _list_user_skus():
    """List all SKU series from S3 with metadata."""
    skus = []
    try:
        resp = s3.list_objects_v2(Bucket=SERIES_BUCKET, Prefix=SERIES_PREFIX)
        for obj in resp.get("Contents", []):
            key = obj["Key"]
            match = re.search(r"series_(\d+)\.json", key)
            if not match:
                continue
            series_num = int(match.group(1))
            # Try to read metadata from the file
            try:
                file_resp = s3.get_object(Bucket=SERIES_BUCKET, Key=key)
                data = json.loads(file_resp["Body"].read())
                metadata = data.get("metadata", {})
                skus.append({
                    "series_id": f"series_{series_num}",
                    "sku_name": metadata.get("sku_name", f"SKU {series_num}"),
                    "mrp": metadata.get("mrp", 0),
                })
            except Exception:
                skus.append({
                    "series_id": f"series_{series_num}",
                    "sku_name": f"SKU {series_num}",
                    "mrp": 0,
                })
    except Exception:
        pass
    return skus


def _next_series_id():
    """Find the next available series_XX.json number in S3."""
    try:
        resp = s3.list_objects_v2(Bucket=SERIES_BUCKET, Prefix=SERIES_PREFIX)
        existing = []
        for obj in resp.get("Contents", []):
            match = re.search(r"series_(\d+)\.json", obj["Key"])
            if match:
                existing.append(int(match.group(1)))
        return max(existing) + 1 if existing else 0
    except Exception:
        return 20  # safe fallback


def _generate_series_json(sku_name, mrp):
    """Generate a DeepAR-compatible series JSON for a new SKU."""
    today = datetime.utcnow()
    start_date = today - timedelta(days=365)
    # 365 days of synthetic zero demand (new SKU placeholder)
    target = [0.0] * 365
    return {
        "start": start_date.strftime("%Y-%m-%d 00:00:00"),
        "target": target,
        "cat": [0],
        "metadata": {
            "sku_name": sku_name,
            "mrp": mrp,
            "created_at": today.isoformat(),
        },
    }


def _add_sku(params):
    """Create a new series JSON in S3 for the given SKU."""
    sku_name = params.get("sku_name", "Unknown SKU")
    mrp = params.get("mrp", 0)
    series_id = _next_series_id()
    series_key = f"{SERIES_PREFIX}series_{series_id}.json"

    series_data = _generate_series_json(sku_name, mrp)
    s3.put_object(
        Bucket=SERIES_BUCKET,
        Key=series_key,
        Body=json.dumps(series_data),
        ContentType="application/json",
    )
    return {
        "success": True,
        "series_id": f"series_{series_id}",
        "s3_key": f"s3://{SERIES_BUCKET}/{series_key}",
        "reply": f"✅ SKU \"{sku_name}\" (MRP ₹{mrp}) added successfully! Use series_id **series_{series_id}** for forecasting.",
    }


def _check_status(params, user_id):
    """Check training status from DynamoDB."""
    if not user_id:
        return {"reply": "Please log in first so I can check your training status."}
    try:
        table = dynamodb.Table(SHOP_USERS_TABLE)
        resp = table.get_item(Key={"userId": user_id})
        item = resp.get("Item", {})
        status = item.get("trainingStatus", "NOT_STARTED")
        status_messages = {
            "NOT_STARTED": "Training hasn't started yet. Upload your sales data to begin!",
            "UPLOADED": "Your data has been uploaded. Training will begin shortly.",
            "TRAINING": "🔄 Your AI model is currently training. I'll let you know when it's ready!",
            "READY": "🎉 Your AI model is ready! Head to the Dashboard to see forecasts.",
        }
        return {"reply": status_messages.get(status, f"Current status: {status}"), "training_status": status}
    except Exception as e:
        return {"reply": f"I couldn't check the status right now. Error: {str(e)}"}


def _build_sku_context(skus):
    """Build SKU context string for the system prompt."""
    if not skus:
        return "The user has no SKUs registered yet."
    lines = ["The user's current SKU catalog:"]
    for sku in skus[:30]:  # limit to 30 to stay within token budget
        name = sku.get("sku_name", "Unknown")
        mrp = sku.get("mrp", 0)
        sid = sku.get("series_id", "")
        lines.append(f"  - {name} (MRP ₹{mrp}, {sid})")
    return "\n".join(lines)


def _generate_suggestions(intent, params, skus):
    """Generate contextual suggested replies based on intent and available SKUs."""
    suggestions = []

    if intent == "add_sku":
        suggestions = [
            "Show my SKU catalog",
            f"Forecast for {params.get('sku_name', 'this product')}",
            "Add another SKU",
        ]
    elif intent == "get_forecast":
        suggestions = [
            "Check training status",
            "Add a new SKU",
        ]
        # Suggest forecasts for other known SKUs
        sku_name = params.get("sku_name", "").lower()
        for sku in skus[:3]:
            if sku["sku_name"].lower() != sku_name:
                suggestions.append(f"Forecast for {sku['sku_name']}")
                if len(suggestions) >= 4:
                    break
    elif intent == "start_training":
        suggestions = [
            "Check training status",
            "Show my SKU catalog",
            "What can you do?",
        ]
    elif intent == "check_status":
        suggestions = [
            "Show my SKU catalog",
            "Add a new SKU",
        ]
        if skus:
            suggestions.append(f"Forecast for {skus[0]['sku_name']}")
    elif intent == "list_skus":
        suggestions = ["Add a new SKU"]
        for sku in skus[:2]:
            suggestions.append(f"Forecast for {sku['sku_name']}")
        suggestions.append("Train model for my store")
    else:  # general
        suggestions = [
            "Show my SKU catalog",
            "Add a new SKU",
            "Check training status",
        ]
        if skus:
            suggestions.append(f"Forecast for {skus[0]['sku_name']}")

    return suggestions[:4]  # max 4 suggestions


def _call_bedrock(message, conversation_history, skus):
    """Call Bedrock Nova Lite to parse intent."""
    messages = []
    for msg in (conversation_history or []):
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": [{"text": msg.get("content", "")}]})
    messages.append({"role": "user", "content": [{"text": message}]})

    sku_context = _build_sku_context(skus)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(sku_context=sku_context)

    body = {
        "messages": messages,
        "system": [{"text": system_prompt}],
        "inferenceConfig": {
            "maxTokens": 512,
            "temperature": 0.3,
            "topP": 0.9,
        },
    }

    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body),
    )

    result = json.loads(response["body"].read())
    output_text = result["output"]["message"]["content"][0]["text"]

    # Parse the JSON from Bedrock's response
    try:
        # Try to extract JSON from the response (handle markdown wrapping)
        json_match = re.search(r'\{.*\}', output_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"intent": "general", "params": {}, "reply": output_text}
    except json.JSONDecodeError:
        return {"intent": "general", "params": {}, "reply": output_text}


def handler(event, context):
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    try:
        body = json.loads(event.get("body", "{}"))
        message = body.get("message", "").strip()
        user_id = body.get("userId", "")
        conversation_history = body.get("conversationHistory", [])

        if not message:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "message is required"}),
            }

        # Step 0: Fetch user's SKU catalog
        skus = _list_user_skus()

        # Step 1: Parse intent via Bedrock
        parsed = _call_bedrock(message, conversation_history, skus)
        intent = parsed.get("intent", "general")
        params = parsed.get("params", {})
        reply = parsed.get("reply", "I'm not sure how to help with that.")
        action_data = {}

        # Step 2: Execute the intent
        if intent == "add_sku":
            result = _add_sku(params)
            reply = result["reply"]
            action_data = {"series_id": result.get("series_id"), "s3_key": result.get("s3_key")}
            # Refresh SKU list after adding
            skus = _list_user_skus()

        elif intent == "check_status":
            result = _check_status(params, user_id)
            reply = result["reply"]
            action_data = {"training_status": result.get("training_status")}

        elif intent == "start_training":
            reply = ("Got it! To start training, please upload your sales CSV/Excel file "
                     "from the Shop Dashboard. I'll kick off the AI training automatically once it's uploaded. "
                     "Head to the Shop Dashboard → Upload Sales Data.")
            action_data = {"redirect": "/shop-dashboard"}

        elif intent == "get_forecast":
            sku_name = params.get("sku_name", "")
            reply = (f"To get a forecast for {sku_name}, head to the Dashboard and enter the SKU details. "
                     f"I'll show you 7-day demand predictions with signals like weather, festivals, and payday weeks!")
            action_data = {"redirect": "/dashboard", "sku_name": sku_name}

        elif intent == "list_skus":
            if skus:
                sku_lines = [f"• **{s['sku_name']}** — MRP ₹{s['mrp']} ({s['series_id']})" for s in skus[:20]]
                reply = f"📦 Here are your registered SKUs:\n\n" + "\n".join(sku_lines)
            else:
                reply = "You don't have any SKUs registered yet. Try saying \"Add SKU Amul Paneer 200g MRP 95\" to get started!"
            action_data = {"skus": skus[:20]}

        # Step 3: Generate suggested replies
        suggestions = _generate_suggestions(intent, params, skus)

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "reply": reply,
                "intent": intent,
                "data": action_data,
                "suggestedReplies": suggestions,
            }),
        }

    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(exc)}),
        }
