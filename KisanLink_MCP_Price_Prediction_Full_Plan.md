# KisanLink MCP-Based AI Price Prediction Integration Plan

## Implementation Status

The first vertical slice is implemented:

- Spring Boot exposes `/mcp` JSON-RPC-compatible `tools/list` and `tools/call` operations.
- Available tools: `get_latest_market_price` and bounded `get_historical_prices`.
- Python contains `mcp_client.py` and exposes `POST /price-prediction`.
- The Python service requests market history through MCP and performs the existing linear-regression-style forecast.
- `KISANLINK_MCP_TOKEN` can protect the internal MCP endpoint.
- The existing Java `GET /api/predictions/{cropId}/forecast` endpoint remains the default frontend path until the UI cutover is completed.

Verified locally on 2026-09-10: Tomato MCP history returned HTTP 200 and the AI endpoint returned a seven-day forecast.

## 1. Purpose

This document provides the complete implementation plan for adding **Model Context Protocol (MCP)** to KisanLink's price-prediction pipeline.

The goal is **not to replace the existing architecture**. KisanLink keeps:

- Java + Spring Boot backend
- PostgreSQL
- AGMARKNET market-price ingestion
- Python/FastAPI AI microservice
- React + Vite frontend
- Flutter mobile/desktop frontends
- Spring Security + JWT
- Existing price-prediction model

MCP becomes a controlled bridge through which the AI can request approved market-data tools from the backend.

### Core architecture

```text
AGMARKNET / Market Data
        |
        v
Spring Boot + PostgreSQL
        |
        v
     MCP Server
        |
        | MCP
        v
Python AI Service / MCP Client
        |
        v
Price Prediction Model
        |
        v
Forecast + Trend + Confidence
        |
        v
Net Realization Engine
        |
        v
Selling Recommendation
```

---

# 2. Current KisanLink Architecture

KisanLink already contains:

```text
React + Vite
Flutter Mobile/Desktop
        |
        | REST API
        v
Java Spring Boot
        |
        +---- PostgreSQL
        |
        +---- AGMARKNET
        |
        +---- Marketplace
        |
        +---- Orders / Logistics
        |
        +---- Security / JWT
        |
        +---- Python AI Service
```

The MCP integration should be an **addition**, not a rewrite.

### Target architecture

```text
                    React / Flutter
                          |
                         REST
                          |
                          v
                +--------------------+
                |   Spring Boot      |
                |     Backend        |
                +---------+----------+
                          |
             +------------+------------+
             |                         |
             v                         v
       +-----------+             +-----------+
       | PostgreSQL|             | MCP Server|
       | Market DB |             | MCP Tools |
       +-----------+             +-----+-----+
                                       |
                                      MCP
                                       |
                                       v
                              +----------------+
                              | Python AI      |
                              | MCP Client     |
                              +-------+--------+
                                      |
                                      v
                              Price Prediction
```

---

# 3. What MCP Does

MCP stands for **Model Context Protocol**.

For KisanLink, MCP provides a standardized tool interface between the AI service and selected backend capabilities.

For example, the AI can request:

```text
get_latest_market_price()
get_historical_prices()
compare_markets()
get_market_context()
```

The backend executes those operations and returns controlled data.

### Important

MCP **does not predict the price**.

```text
MCP
 |
 | provides data/tools
 v
AI / ML Model
 |
 | performs prediction
 v
Forecast
```

---

# 4. Why KisanLink Should Use MCP

Without MCP:

```text
AI -> direct database/API dependency
```

With MCP:

```text
AI -> MCP -> approved backend tool -> database
```

Benefits:

1. Keeps AI separated from database implementation.
2. Prevents direct database access from the AI.
3. Allows strict input validation.
4. Makes AI tool access auditable.
5. Allows more AI features to reuse the same tools.
6. Keeps the Spring Boot backend as the owner of business/data rules.
7. Makes the architecture easier to extend later.

---

# 5. Recommended MCP Placement

## MCP Server

Put the MCP server in the **Spring Boot backend**.

Conceptually:

```text
kisanlink-backend
|
+-- controller/
+-- service/
+-- repository/
+-- security/
+-- model/
+-- mcp/
    |
    +-- MarketPriceMcpTools
    +-- HistoricalPriceMcpTool
    +-- MarketComparisonMcpTool
    +-- MarketContextMcpTool
```

The MCP tools should reuse the existing service/repository layer.

```text
MCP Tool
   |
   v
Existing MarketPriceService
   |
   v
Repository
   |
   v
PostgreSQL
```

Do **not** duplicate database logic inside the MCP layer.

## MCP Client

Add an MCP client to:

```text
kisanlink-ai
```

The Python AI service calls the MCP server when it needs market data.

---

# 6. MCP Tools

Start with only three essential tools.

## Tool 1 — get_latest_market_price

### Purpose

Returns the most recent normalized price.

### Input

```json
{
  "crop": "Tomato",
  "market": "Nashik"
}
```

### Output

```json
{
  "crop": "Tomato",
  "market": "Nashik",
  "modal_price": 28.0,
  "unit": "INR/kg",
  "min_price": 24.0,
  "max_price": 31.0,
  "arrival_quantity": 1200,
  "source": "AGMARKNET",
  "last_updated": "2026-09-10T08:30:00"
}
```

---

## Tool 2 — get_historical_prices

### Purpose

Returns historical observations for the forecasting model.

### Input

```json
{
  "crop": "Tomato",
  "market": "Nashik",
  "days": 365
}
```

### Output

```json
{
  "crop": "Tomato",
  "market": "Nashik",
  "unit": "INR/kg",
  "data": [
    {
      "date": "2026-09-01",
      "modal_price": 26.5,
      "arrival_quantity": 1100
    },
    {
      "date": "2026-09-02",
      "modal_price": 27.1,
      "arrival_quantity": 1180
    }
  ]
}
```

The exact response should be adapted to the existing Python model's input format.

---

# 7. Tool 3 — compare_markets

### Purpose

Compares prices in relevant markets.

### Input

```json
{
  "crop": "Tomato",
  "location": "Nashik",
  "limit": 10
}
```

### Output

```json
{
  "crop": "Tomato",
  "markets": [
    {
      "market": "Nashik",
      "price": 28.0
    },
    {
      "market": "Pune",
      "price": 31.0
    },
    {
      "market": "Mumbai",
      "price": 34.0
    }
  ]
}
```

This later supports KisanLink's market recommendation engine.

---

# 8. Optional Tool — get_market_context

After V1 works, add:

```text
get_market_context()
```

Possible information:

```text
crop
market
latest price
historical average
recent trend
arrival quantity
price volatility
last updated
data source
```

Example:

```json
{
  "crop": "Tomato",
  "market": "Nashik",
  "latest_price": 28.0,
  "historical_average": 25.4,
  "recent_trend": "UP",
  "arrival_quantity": 1200,
  "volatility": 0.12,
  "source": "AGMARKNET"
}
```

---

# 9. Complete Price Prediction Flow

```text
1. Farmer selects crop and market
             |
             v
2. Frontend sends prediction request
             |
             v
3. Spring Boot validates request
             |
             v
4. Spring Boot calls Python AI service
             |
             v
5. Python AI connects to MCP
             |
             v
6. AI calls get_historical_prices
             |
             v
7. MCP Server retrieves backend data
             |
             v
8. MCP returns normalized data
             |
             v
9. AI preprocesses data
             |
             v
10. Prediction model runs
             |
             v
11. Forecast + trend + confidence
             |
             v
12. AI returns result
             |
             v
13. Spring Boot returns result
             |
             v
14. Net Realization Engine calculates actual return
             |
             v
15. Farmer receives recommendation
```

---

# 10. Example End-to-End Request

Farmer selects:

```text
Crop: Tomato
Market: Nashik
Quantity: 500 kg
Horizon: 7 days
```

Frontend sends:

```http
POST /api/price-prediction
```

```json
{
  "crop": "Tomato",
  "market": "Nashik",
  "horizon": 7
}
```

Python AI requests:

```text
MCP:
get_historical_prices(
    crop="Tomato",
    market="Nashik",
    days=365
)
```

MCP obtains the data from the backend/database.

The prediction model then produces something like:

```text
Current price: ₹28/kg

Day 1: ₹28.7
Day 2: ₹29.2
Day 3: ₹30.1
Day 4: ₹30.5
Day 5: ₹31.0
Day 6: ₹30.8
Day 7: ₹31.4

Trend: Increasing
Confidence: 82%
```

The UI can display:

```text
Current Price     ₹28/kg
7-Day Forecast    ₹31.4/kg
Trend             ↑ Increasing
Confidence        82%
```

These numbers are examples; the actual system must show real model output.

---

# 11. AI Responsibilities

The Python AI service remains responsible for:

```text
Data preprocessing
Missing-value handling
Outlier handling
Feature preparation
Model inference
Forecast generation
Trend calculation
Confidence calculation
```

MCP remains responsible for:

```text
Controlled tool access
Market-data retrieval
Standardized AI-to-backend communication
```

---

# 12. Data Preprocessing

Before model inference:

## Step 1 — Validate

```text
crop exists
market exists
date is valid
price >= 0
```

## Step 2 — Normalize

Keep KisanLink's normalized unit:

```text
INR/kg
```

## Step 3 — Sort

Sort observations chronologically.

## Step 4 — Missing values

Define a documented policy:

```text
small gaps -> controlled handling/interpolation
large gaps -> flag/exclude
insufficient history -> fallback
```

Never silently invent market data.

## Step 5 — Outliers

Flag or handle abnormal observations using documented rules.

---

# 13. Existing Prediction Model

For the first MCP integration, keep the current KisanLink prediction implementation.

```text
MCP market data
       |
       v
Existing preprocessing
       |
       v
Existing prediction model
       |
       v
Forecast
```

Do not simultaneously redesign the ML model and MCP architecture.

After MCP is stable, model improvements can be evaluated separately.

---

# 14. Prediction Output

Every prediction should contain:

```text
current price
forecast
trend
confidence
data source
data timestamp
model version
```

Example:

```json
{
  "current_price": 28.0,
  "forecast": [28.7, 29.2, 30.1, 30.5, 31.0, 30.8, 31.4],
  "trend": "UP",
  "confidence": 0.82,
  "source": "AGMARKNET",
  "data_timestamp": "2026-09-10T08:30:00",
  "model_version": "price-model-v1.0"
}
```

---

# 15. Prediction Safety

Never describe the output as a guaranteed future price.

Use:

> Estimated market price based on recent historical market data.

Not:

> Guaranteed price.

The UI should clearly show confidence and data freshness.

---

# 16. AGMARKNET Failure Handling

If AGMARKNET becomes unavailable:

```text
AGMARKNET
    X
    |
    v
Cached backend data
    |
    v
MCP
    |
    v
AI
```

Cached data must include:

```text
last_updated
source
data status
```

Example:

```text
Data status: Cached
Last updated: 8 hours ago
```

If the data is too old or insufficient:

```text
Prediction unavailable
```

is preferable to generating an unreliable prediction.

---

# 17. Security

The MCP endpoint must **not** become a database gateway.

### Required controls

- Authentication
- Authorization
- Input validation
- Tool allow-list
- Rate limiting
- Audit logging
- HTTPS in production
- Secret management

### Never expose:

```text
execute_sql(query)
```

Instead expose safe domain tools:

```text
get_historical_prices(...)
get_latest_market_price(...)
compare_markets(...)
```

The AI should not receive PostgreSQL credentials.

---

# 18. Tool Input Limits

Protect the database and MCP server.

Example:

```text
days <= 730
limit <= 50
```

Validate:

```text
crop
market
date range
record limits
```

Do not allow unbounded queries.

---

# 19. Authentication Architecture

Recommended:

```text
Python AI
     |
     | authenticated MCP connection
     v
Spring Security
     |
     v
MCP Server
     |
     v
MCP Tool
     |
     v
Service Layer
     |
     v
PostgreSQL
```

The exact authentication mechanism should match the existing internal service-security architecture.

---

# 20. Logging

Log enough information to trace a prediction:

```text
Request ID
Crop
Market
Prediction horizon
MCP tool called
Data timestamp
Observation count
Model version
Processing time
Prediction status
```

Do not log:

```text
passwords
JWTs
API secrets
database credentials
```

---

# 21. Model Versioning

Every prediction should identify the model version.

Example:

```text
price-model-v1.0
price-model-v1.1
price-model-v2.0
```

This makes model evaluation and rollback easier.

---

# 22. Suggested Backend Structure

Conceptually:

```text
kisanlink-backend/
└── src/main/java/.../
    ├── controller/
    ├── service/
    ├── repository/
    ├── model/
    ├── security/
    └── mcp/
        ├── MarketPriceMcpTools.java
        ├── HistoricalPriceMcpTool.java
        ├── MarketComparisonMcpTool.java
        └── MarketContextMcpTool.java
```

Adapt package names to the actual repository rather than copying this structure blindly.

---

# 23. Suggested AI Structure

Conceptually:

```text
kisanlink-ai/
├── app.py
├── models/
├── prediction/
├── preprocessing/
├── mcp/
│   └── client.py
└── tests/
```

Again, integrate with the existing structure instead of creating duplicate modules.

---

# 24. Implementation Phases

## Phase 0 — Audit Existing Repository

Before coding:

- Inspect Spring Boot market-price services.
- Inspect AGMARKNET ingestion.
- Inspect PostgreSQL market schema.
- Inspect current AI prediction endpoint.
- Inspect current AI preprocessing.
- Inspect Docker Compose.
- Inspect current tests.
- Identify existing authentication.

Deliverable:

```text
Exact MCP integration points
```

---

## Phase 1 — Define MCP Contract

Document:

```text
Tool names
Input schemas
Output schemas
Validation rules
Errors
Authentication
Limits
```

Start with:

```text
get_latest_market_price
get_historical_prices
compare_markets
```

---

## Phase 2 — Implement Spring Boot MCP Server

Steps:

1. Add a compatible MCP/Spring AI dependency.
2. Configure MCP server transport.
3. Register the market tools.
4. Reuse existing market services.
5. Add validation.
6. Add security.
7. Add logging.
8. Add tests.

Target:

```text
MCP Tool
   |
   v
Existing Service
   |
   v
Existing Repository
   |
   v
PostgreSQL
```

---

## Phase 3 — Test MCP Independently

Test:

```text
valid crop
valid market
invalid crop
invalid market
empty history
large date range
stale data
database unavailable
unauthorized request
```

---

## Phase 4 — Add Python MCP Client

In `kisanlink-ai`:

```text
AI
 |
 v
MCP Client
 |
 v
Spring Boot MCP Server
```

Configure the MCP server URL through environment variables.

Example:

```text
MCP_SERVER_URL=http://backend:8080/mcp
```

Do not hard-code production addresses.

---

## Phase 5 — Connect Existing Prediction Model

Change the data path to:

```text
AI
 |
 v
MCP Client
 |
 v
get_historical_prices
 |
 v
Preprocessing
 |
 v
Existing Prediction Model
 |
 v
Forecast
```

Keep the existing model logic unless testing shows it needs changes.

---

## Phase 6 — Add Market Comparison

Use:

```text
compare_markets
```

Then:

```text
Market prices
      |
      v
Price forecast
      |
      v
Transport / other costs
      |
      v
Net realization
      |
      v
Best market
```

---

## Phase 7 — Connect to Net Realization

KisanLink should not recommend a market based only on predicted selling price.

Example:

```text
Market A
Predicted price = ₹32/kg
Transport = ₹4/kg
Other costs = ₹2/kg

Net = ₹26/kg
```

```text
Market B
Predicted price = ₹29/kg
Transport = ₹1/kg
Other costs = ₹1/kg

Net = ₹27/kg
```

Recommendation:

```text
Market B
```

This demonstrates KisanLink's main idea:

> **Price is not the same as profit.**

---

# 25. Final Intelligence Pipeline

```text
MARKET DATA
    |
    v
MCP DATA TOOLS
    |
    v
AI PRICE FORECAST
    |
    v
PREDICTED PRICE
    |
    v
LOGISTICS + OTHER COSTS
    |
    v
TRUE NET REALIZATION
    |
    v
MARKET COMPARISON
    |
    v
BUYER MATCHING
    |
    v
SELLING RECOMMENDATION
```

---

# 26. Error Handling

Define standard errors:

```text
INVALID_CROP
INVALID_MARKET
INVALID_DATE_RANGE
INSUFFICIENT_DATA
STALE_DATA
DATA_SOURCE_UNAVAILABLE
DATABASE_UNAVAILABLE
UNAUTHORIZED
TOOL_TIMEOUT
```

If data is insufficient:

```text
Do not fabricate a prediction.
```

Return a clear fallback message.

---

# 27. Timeout and Retry

Use bounded requests:

```text
MCP request
   |
   +-- timeout
   |
   +-- limited retry
   |
   +-- fallback
```

Avoid unlimited retries.

A practical first policy is:

```text
1-2 retries maximum
bounded timeout
cached data only when freshness rules allow it
```

Tune exact values after performance testing.

---

# 28. Testing Plan

## Unit Tests

Test:

```text
MCP input validation
price normalization
date filtering
market filtering
response mapping
error handling
```

## Integration Tests

Test:

```text
MCP -> Spring Service -> PostgreSQL
```

## AI Integration Tests

Test:

```text
AI -> MCP -> market data -> model
```

## End-to-End Test

Test:

```text
Frontend
   |
   v
Spring Boot
   |
   v
Python AI
   |
   v
MCP
   |
   v
PostgreSQL
   |
   v
Prediction
   |
   v
Frontend
```

---

# 29. Important AI Tests

### Normal dataset

```text
Valid historical market data
```

### Insufficient dataset

```text
Very little history
```

Expected:

```text
insufficient data / safe fallback
```

### Missing values

```text
price = null
```

### Stale data

Verify warning/fallback behavior.

### Invalid market

Verify clean error.

### AGMARKNET unavailable

Verify cached-data policy.

### Extreme price

Verify outlier handling.

---

# 30. Performance Testing

Measure:

```text
MCP response time
Database query time
AI inference time
Total prediction latency
```

The complete request should be measured:

```text
Frontend
 -> Backend
 -> AI
 -> MCP
 -> Database
 -> AI inference
 -> Backend
 -> Frontend
```

Optimize based on measured bottlenecks.

---

# 31. Docker Plan

Existing Docker services can remain:

```text
docker-compose
|
+-- frontend
+-- backend
+-- postgres
+-- kisanlink-ai
```

MCP does not necessarily require a new container.

Recommended:

```text
backend container
    |
    +-- REST API
    +-- MCP Server
```

AI remains:

```text
kisanlink-ai container
```

---

# 32. Environment Configuration

Use environment variables.

Example:

```text
MCP_SERVER_URL=http://backend:8080/mcp
```

Production:

```text
MCP_SERVER_URL=https://your-api-domain/mcp
```

Never commit secrets.

---

# 33. Rollout Strategy

If practical, introduce a feature flag:

```text
MCP_PRICE_PREDICTION_ENABLED=false
```

First run:

```text
Existing prediction
```

Then run:

```text
MCP prediction
```

Compare outputs.

Only make MCP the default after validation.

---

# 34. Backward Compatibility

React and Flutter clients do **not** need to speak MCP.

They continue using REST:

```text
React / Flutter
       |
      REST
       |
       v
Spring Boot
       |
       +---- MCP ----> AI
```

MCP should remain an internal AI/data integration layer.

---

# 35. Future MCP Tools

After V1, possible tools include:

```text
get_crop_information
get_market_arrivals
get_nearby_markets
get_transport_estimate
calculate_net_realization
find_matching_buyers
get_buyer_demand
get_weather_context
```

Only add tools that provide real project value.

---

# 36. What NOT to Do

Do not:

- Rewrite the Spring Boot backend.
- Move PostgreSQL into the AI service.
- Give the AI direct database credentials.
- Allow arbitrary SQL through MCP.
- Replace the ML model with MCP.
- Claim MCP performs price prediction.
- Expose every backend endpoint as an MCP tool.
- Expose unnecessary farmer personal data.
- Present forecasts as guaranteed prices.
- Claim simulated financial components are real production escrow infrastructure.

---

# 37. Recommended V1

Keep the first implementation small.

### Spring Boot MCP Server

```text
1. get_latest_market_price
2. get_historical_prices
3. compare_markets
```

### Python

```text
MCP Client
```

### AI

```text
Existing price-prediction model
```

### Data

```text
Existing PostgreSQL + AGMARKNET pipeline
```

### Frontends

```text
No major changes
```

This is the lowest-risk approach.

---

# 38. SIH / Judge Explanation

### Why MCP?

> We use MCP as a standardized and controlled bridge between our AI service and KisanLink's backend tools. The Spring Boot backend remains responsible for trusted market data and business logic, while the Python AI service remains responsible for prediction. MCP allows the AI to request approved tools such as historical prices, latest prices and market comparisons without directly accessing our database.

### Does MCP predict the price?

> No. MCP provides the required data and tools. The actual prediction is performed by our ML model.

### Why not directly access the database?

> Direct database access would tightly couple the AI to our database implementation and expose internal infrastructure. MCP gives us a controlled interface where inputs can be validated, access can be authorized, and tool usage can be audited.

### What if AGMARKNET is down?

> We use cached data when it is still within the defined freshness policy and show its timestamp. If data is too stale or insufficient, we do not present a false live prediction.

---

# 39. Final Architecture for the PPT

```text
          AGMARKNET
              |
              v
      Spring Boot Backend
              |
              v
       PostgreSQL Market Data
              |
              v
          MCP Server
              |
             MCP
              |
              v
       Python AI Service
              |
              v
       Price Prediction
              |
       +------+------+
       |             |
       v             v
   Forecast       Confidence
       |
       v
  Net Realization
       |
       v
 Market / Buyer Recommendation
```

### One-line architecture

```text
AGMARKNET
   -> Spring Boot/PostgreSQL
   -> MCP
   -> AI Model
   -> Forecast
   -> Net Realization
   -> Recommendation
```

---

# 40. Implementation Checklist

## Backend

- [ ] Audit existing market-price service
- [ ] Audit AGMARKNET ingestion
- [ ] Audit price normalization
- [ ] Add compatible MCP dependency
- [ ] Configure MCP server
- [ ] Implement latest-price tool
- [ ] Implement historical-price tool
- [ ] Implement market-comparison tool
- [ ] Add validation
- [ ] Add authentication
- [ ] Add authorization
- [ ] Add logging
- [ ] Add error handling
- [ ] Add tests

## AI

- [ ] Add Python MCP client
- [ ] Configure MCP server URL
- [ ] Implement tool calls
- [ ] Convert MCP response to model input
- [ ] Keep existing preprocessing
- [ ] Keep existing model
- [ ] Return forecast
- [ ] Return trend
- [ ] Return confidence
- [ ] Return model version
- [ ] Handle MCP failures
- [ ] Add tests

## Data

- [ ] Verify AGMARKNET data quality
- [ ] Verify INR/kg normalization
- [ ] Verify timestamps
- [ ] Verify missing-value strategy
- [ ] Verify cached-data freshness
- [ ] Verify historical coverage

## Integration

- [ ] Backend -> AI
- [ ] AI -> MCP
- [ ] MCP -> PostgreSQL
- [ ] Full prediction flow
- [ ] React display
- [ ] Flutter mobile display
- [ ] Flutter desktop display

## Security

- [ ] Secure MCP endpoint
- [ ] Validate all inputs
- [ ] No arbitrary SQL
- [ ] No database credentials in AI
- [ ] Rate limiting
- [ ] Audit logs
- [ ] HTTPS in production
- [ ] Secret management

## Deployment

- [ ] Update Docker configuration
- [ ] Add MCP environment variables
- [ ] Test local Docker deployment
- [ ] Test production-like deployment
- [ ] Verify health checks

---

# 41. Definition of Done

The MCP price-prediction integration is complete when:

```text
[✓] Spring Boot exposes approved MCP tools
[✓] MCP retrieves real KisanLink market data
[✓] Python AI connects through MCP
[✓] AI does not require direct database access
[✓] Existing prediction model still works
[✓] Forecast includes trend and confidence
[✓] Data source and timestamp are available
[✓] Stale/unavailable data is handled safely
[✓] Authentication/authorization is implemented
[✓] Unit + integration + E2E tests pass
[✓] Docker deployment works
[✓] React and Flutter clients continue working
```

---

# 42. Final KisanLink Intelligence Chain

```text
                REAL MARKET DATA
                       |
                       v
                    AGMARKNET
                       |
                       v
              SPRING BOOT BACKEND
                       |
                       v
                  POSTGRESQL
                       |
                       v
                   MCP SERVER
                       |
                       | controlled tools
                       v
                    PYTHON AI
                       |
                       v
             PRICE PREDICTION MODEL
                       |
                       v
          FORECAST + TREND + CONFIDENCE
                       |
                       v
             NET REALIZATION ENGINE
                       |
                       v
              MARKET COMPARISON
                       |
                       v
                BUYER MATCHING
                       |
                       v
              SELLING RECOMMENDATION
                       |
                       v
                FARMER DECISION
```

## Core KisanLink value

```text
PRICE
  ↓
PREDICTION
  ↓
COST
  ↓
TRUE NET REALIZATION
  ↓
BEST MARKET
  ↓
BUYER
  ↓
TRANSPORT
  ↓
SETTLEMENT
```

MCP strengthens the AI/data integration layer while preserving the existing Java Spring Boot, PostgreSQL, AGMARKNET, Python AI, React, and Flutter architecture.
