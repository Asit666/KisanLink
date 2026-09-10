# KisanLink MCP Price Prediction

## Purpose

KisanLink uses Model Context Protocol (MCP) as a controlled bridge between the Python price-prediction service and market data owned by the Spring Boot backend.

MCP provides approved market-data tools. MCP does not predict prices and is not itself an AI model.

```text
React / Flutter
      |
      v
Spring Boot API
      |
      +--> MCP market-data tools
      |        |
      |        v
      |   H2/PostgreSQL market-price cache
      |
      +<-- Python AI service
               |
               v
        Price forecast model
```

## Current Implementation

### Spring Boot MCP server

Location:

```text
kisanlink-backend/src/main/java/com/kisanlink/controller/McpMarketDataController.java
```

Endpoint:

```text
POST http://localhost:8080/mcp
```

Available tools:

- `get_latest_market_price`
- `get_historical_prices`

The tools read through the existing repositories and return normalized `INR/kg` market data. They do not expose SQL or database credentials.

### Python MCP client

Location:

```text
kisanlink-ai/mcp_client.py
```

The client calls the Spring MCP endpoint using JSON-RPC-style `tools/call` messages. The Python service never connects directly to H2 or PostgreSQL.

### Python prediction endpoint

Endpoint:

```text
POST http://localhost:8000/price-prediction
```

Example request:

```json
{
  "crop": "Tomato",
  "horizon": 7
}
```

Example PowerShell test:

```powershell
$body = '{"crop":"Tomato","horizon":7}'

Invoke-RestMethod `
  -Uri http://localhost:8000/price-prediction `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body
```

The Python service:

1. Calls MCP `get_historical_prices`.
2. Sorts observations by date.
3. Extracts normalized modal prices.
4. Calculates a linear trend.
5. Applies damped future projections for the requested horizon.
6. Returns trend, confidence, observation count, source, model version, and data status.

Current model:

```text
Model version: price-model-mcp-v1.0
Method: deterministic linear regression with damped future trend
```

This is a statistical model, not ChatGPT, Gemini, or another large language model.

## Live Market Data

The Spring Boot MCP server attempts to refresh the database cache from the official data.gov.in AGMARKNET API before serving MCP data. Refresh is rate-limited by default to once every 15 minutes.

Configuration is read from environment variables:

```powershell
$env:AGMARKNET_API_KEY = "your-real-data-gov-in-api-key"
$env:AGMARKNET_DEFAULT_STATE = "Jharkhand"
$env:AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
$env:AGMARKNET_FALLBACK_RESOURCE_ID = "35985678-0d79-46b4-9ed6-6f13308a1d24"
$env:KISANLINK_MCP_LIVE_REFRESH_ENABLED = "true"
$env:KISANLINK_MCP_REFRESH_MINUTES = "15"
```

The API key must be set in the same PowerShell process that starts Spring Boot. Never commit it, place it in frontend code, or share it in chat.

## Data Status

MCP reports freshness explicitly.

```text
LIVE
```

The returned rows include `source: AGMARKNET_LIVE`. These are the rows that should be presented as live official market data.

```text
CACHED_DEVELOPMENT
```

The returned rows are development seed data. This is the current expected status when AGMARKNET has no matching rows for the selected crop/state.

```text
refresh_status: SUCCESS
```

The AGMARKNET request completed, but this does not necessarily mean the selected crop has live rows. Always inspect the row-level `source` and `data_status`.

Other refresh statuses include:

- `API_KEY_REQUIRED`: no API key was available to Spring Boot.
- `NO_RECORDS`: the configured resource/query returned no records.
- `HTTP_ERROR_*`: data.gov.in returned an HTTP error.
- `EXCEPTION`: the request failed locally or externally.

A successful refresh with `CACHED_DEVELOPMENT` still means the selected crop is using cached development data, not real-time data.

## Direct MCP Test

Request the tool directly from Spring Boot:

```powershell
$payload = @{
  jsonrpc = '2.0'
  id = 1
  method = 'tools/call'
  params = @{
    name = 'get_historical_prices'
    arguments = @{
      crop = 'Tomato'
      days = 3
    }
  }
} | ConvertTo-Json -Depth 8

Invoke-RestMethod `
  -Uri http://localhost:8080/mcp `
  -Method Post `
  -ContentType 'application/json' `
  -Body $payload
```

Inspect these fields in the returned text payload:

```text
data_status
refresh_status
last_refresh
source
modal_price
```

## Running the Services

### 1. Spring Boot backend

```powershell
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd spring-boot:run
```

The backend runs on port `8080`.

### 2. Python AI service

Use a second terminal. The AI service must not be started twice on port `8000`.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
& C:\dev_tool\GitHub\doc\kisanlink-ai\.venv\Scripts\Activate.ps1
cd C:\dev_tool\GitHub\doc\kisanlink-ai
python app.py
```

If port `8000` is already in use, check the existing service first:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

If it is healthy, reuse it. To restart it:

```powershell
$connection = Get-NetTCPConnection -State Listen -LocalPort 8000
Stop-Process -Id $connection.OwningProcess -Force
python app.py
```

### 3. React frontend

```powershell
cd C:\dev_tool\GitHub\doc\frontend
npm.cmd run dev -- --host 0.0.0.0 --port 5173
```

Open:

```text
http://localhost:5173
```

For a phone on the same Wi-Fi:

```text
http://<PC_LAN_IP>:5173
```

The Vite development proxy forwards:

```text
/api -> http://localhost:8080
/ai  -> http://localhost:8000
```

## Frontend Integration

The React forecast screen uses the MCP AI endpoint when this flag is enabled in `frontend/.env`:

```text
VITE_MCP_PREDICTION_ENABLED=true
```

The frontend calls:

```text
POST /ai/price-prediction
```

Vite forwards it to:

```text
POST http://localhost:8000/price-prediction
```

If MCP prediction fails, the frontend falls back to the existing Java endpoint:

```text
GET /api/predictions/{cropId}/forecast?days=7
```

## Troubleshooting

### `Prediction service returned HTTP undefined`

The frontend was treating a decoded MCP JSON object as a native `fetch` response. The current code normalizes the MCP result before rendering. Restart Vite with a forced cache rebuild if the old error remains:

```powershell
cd C:\dev_tool\GitHub\doc\frontend
npm.cmd run dev -- --host 0.0.0.0 --port 5173 --force
```

### Blank frontend screen

The usual cause is stale Vite HMR/module cache. Stop the process on port `5173`, restart with `--force`, and hard-refresh the browser with `Ctrl+Shift+R`.

### Port already in use

Check the process:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8000,8080,5173
```

Reuse a healthy service or stop only the process that owns the needed port.

### `API_KEY_REQUIRED` or `NO_RECORDS`

Check that the AGMARKNET key is set before Spring Boot starts. A valid key does not guarantee rows for every crop and state. Check `data_status` and row-level `source` before claiming that data is live.

### `CACHED_DEVELOPMENT`

The MCP process is working, but the selected crop has no matching `AGMARKNET_LIVE` rows. The prediction is using seeded development records and must be labeled as such.

## Security Rules

- Never expose `execute_sql` as an MCP tool.
- Never send PostgreSQL credentials to Python.
- Keep the MCP token in environment variables.
- Use HTTPS and service authentication in production.
- Validate crop, market, days, and horizon limits.
- Keep API keys out of Git, frontend bundles, logs, and documentation.
- Do not describe cached or estimated data as live data.
