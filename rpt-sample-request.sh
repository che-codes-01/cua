#!/usr/bin/env bash
# SAP RPT-1.5 — Basic Inference Request

CLIENT_ID="<your-client-id>"
CLIENT_SECRET="<your-client-secret>"
AUTH_URL="<your-auth-url>"
AI_API="https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com/v2"
RESOURCE_GROUP="<your-resource-group>"
RPT_DEPLOYMENT_ID="<your-rpt-deployment-id>"

# Step 1: Get token
TOKEN=$(curl -s -X POST "$AUTH_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

# Step 2: Call RPT
curl -s -X POST "$AI_API/inference/deployments/$RPT_DEPLOYMENT_ID/invocations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "AI-Resource-Group: $RESOURCE_GROUP" \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "sap-rpt-1.5",
    "predictionConfig": {
      "targetColumns": [
        {
          "name": "category",
          "predictionPlaceholder": "[PREDICT]",
          "taskType": "classification"
        }
      ]
    },
    "columns": {
      "row_id":   [103],
      "product":  ["orange"],
      "category": ["[PREDICT]"]
    },
    "contextColumns": {
      "row_id":   [101, 102],
      "product":  ["apple", "beef"],
      "category": ["fruit", "meat"]
    }
  }'
