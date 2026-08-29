I completed a broad static/end-to-end scan of the uploaded project, including the React frontend, Spring backend, security/authorization, DTO validation, database migrations, Docker/Nginx configuration, WebSocket flows, and frontend→backend API contracts.

I also attempted the actual builds/tests. The archive has reproducibility issues that prevent a clean runtime test in this environment, so the findings below distinguish **confirmed source bugs** from **environment/build issues**.

## Overall assessment

The project is **not production-safe yet**.

The biggest problems are not UI polish issues. They are:

* authorization/IDOR vulnerabilities
* trade/escrow state manipulation
* incomplete location propagation
* frontend/backend contract mismatches
* fake/local fallbacks that hide backend failures
* weak password/security configuration
* database schema mismatch that can prevent PostgreSQL startup
* several financial/price-calculation correctness problems
* major features implemented only locally rather than connected to the backend

---

# P0 / Critical — fix before any real deployment

### 1. Escrow accepts an arbitrary deposit amount

**File:** `kisanlink-backend/src/main/java/com/kisanlink/service/EscrowService.java`

`depositFunds()` accepts `request.amount()` and immediately changes escrow to:

```text
FUNDS_HELD_IN_ESCROW
```

There is no check that:

```text
depositAmount == totalAmount
```

or even that the amount is positive.

So a ₹50,000 deal can be marked as fully escrow-funded with ₹1.

The notification then says:

> "Payment Guaranteed in Escrow"

This is a serious financial-integrity bug.

---

### 2. Negative/zero escrow deposits are possible

**File:** `EscrowDepositRequest.java`

```java
@NotNull BigDecimal amount
```

There is no `@Positive`.

Therefore `0`, negative values, etc. can reach the service.

---

### 3. Any trade party can release escrow

**File:** `EscrowService.java`

`releaseFunds()` uses:

```java
ownershipService.checkTradeDealAccess(deal, userEmail);
```

That means **farmer OR buyer** can release funds.

There is no requirement for:

* buyer confirmation
* delivery confirmation
* admin settlement
* completed delivery
* a particular actor role

A farmer can therefore potentially release escrow to the farmer.

---

### 4. Escrow can be released from DISPUTED state

The code explicitly allows:

```java
FUNDS_HELD_IN_ESCROW
DISPUTED
```

to proceed to:

```text
RELEASED_TO_FARMER
```

So a dispute does not actually freeze the money.

That directly contradicts the notification text saying funds remain frozen until resolution.

---

### 5. Escrow is not tied to an accepted trade

`getOrCreateEscrow()` creates an escrow record for whatever trade exists.

It does not require:

```text
trade.status == ACCEPTED
```

A proposed/negotiating trade can therefore receive an escrow account before the contract is actually accepted.

---

### 6. Trade status transitions are not actually enforced

**File:** `TradeDealService.java`

The code calls:

```java
validateStatusTransition(...)
```

but the validation only protects terminal states/same-state situations.

The comments imply a controlled state machine, but the implementation does not enforce a legal sequence.

A caller can therefore potentially move:

```text
PROPOSED → COMPLETED
PROPOSED → DELIVERED
NEGOTIATING → IN_TRANSIT
```

without following the intended workflow.

This is a major state-integrity problem.

---

### 7. Client can create a trade as already COMPLETED/ACCEPTED/etc.

**File:** `TradeDealRequest.java`

The request contains:

```java
TradeStatus status
```

and `TradeDealService.createDeal()` directly does:

```java
deal.setStatus(request.status() != null ? request.status() : TradeStatus.PROPOSED);
```

So the client controls the initial lifecycle state.

A client can submit a newly created trade with:

```text
COMPLETED
```

for example.

This bypasses the negotiation process entirely.

---

### 8. Trade relationships are not validated

**File:** `TradeDealService.java`

The service separately loads:

* farmer
* buyer
* produce
* requirement
* crop

but does **not** verify that they belong together.

For example, a user can submit:

```text
farmerId = Farmer A
produceId = Produce B
buyerId = Buyer C
requirementId = Requirement D
cropId = Crop E
```

with inconsistent relationships.

It should verify:

```text
produce.farmer == farmer
requirement.buyer == buyer
produce.crop == requirement.crop
produce.crop == crop
```

where applicable.

This is one of the most important data-integrity gaps.

---

### 9. Trade quantity is not constrained by available produce

A trade can request more quantity than the farmer's listing contains.

There is no server-side check such as:

```text
trade.quantity <= produce.quantity
```

---

### 10. Trade quantity is not constrained by buyer requirement

Likewise there is no check that:

```text
trade.quantity <= requirement.requiredQuantity
```

So the trade can exceed the buyer's requested amount.

---

### 11. Trade price is not tied to the buyer requirement

The agreed price is independently supplied by the client.

There is no verification that it is:

* the current offered price
* within the buyer's allowed price
* connected to the requirement selected

This permits arbitrary pricing against an otherwise unrelated requirement.

---

### 12. Negative transport cost is possible

`TradeDealRequest.transportCost` has no validation.

The service accepts:

```java
request.transportCost()
```

directly.

A negative transport cost increases:

```text
netFarmerReturn
```

because:

```text
net = total - transportCost
```

Therefore:

```text
transportCost = -100000
```

artificially increases the farmer's return.

---

### 13. SMS webhook can modify trades without authenticating the sender

**Files:**

* `SecurityConfig.java`
* `SmsWhatsAppController.java`
* `SmsWhatsAppService.java`

The webhook is publicly permitted:

```text
/api/notifications/sms-whatsapp/webhook
```

and `handleInboundWebhook()` accepts messages such as:

```text
ACCEPT <tradeId>
```

but does **not** verify that the sender phone number actually belongs to the buyer associated with that trade.

The code can change the trade to:

```text
ACCEPTED
```

based only on the supplied trade ID and message.

---

### 14. Webhook authentication is effectively optional

The controller's secret is:

```java
@Value("${kisanlink.webhook.secret:}")
```

The default is blank.

Therefore if the secret is not explicitly configured, the webhook check can effectively become:

```text
no secret configured → accept request
```

Combined with the public route and sender-verification problem, this is critical.

---

### 15. Public SMS log endpoint can expose other users' logs

**SecurityConfig.java**

This is permitted publicly:

```text
GET /api/notifications/sms-whatsapp/**
```

`SmsWhatsAppController.getLogs()` can therefore execute without an authenticated principal.

More importantly, `SmsWhatsAppService.getRecentLogs(null)` falls back to:

```text
findTop20ByOrderBySentAtDesc()
```

So an unauthenticated request can receive the most recent global SMS/WhatsApp logs.

---

### 16. SMS log access has an incorrect fallback even for authenticated users

The service also falls back to global logs when the requested user does not have matching logs.

So:

```text
user has zero personal logs
```

can become:

```text
return somebody else's latest logs
```

This is an authorization/data-isolation bug.

---

### 17. Production JWT secret has a hardcoded fallback

**Files:**

* `application.properties`
* `docker-compose.yml`

Example:

```properties
jwt.secret=${JWT_SECRET:change-this-development-secret-to-a-long-random-value}
```

and Docker supplies another hardcoded default.

If deployment forgets to provide `JWT_SECRET`, all installations using that fallback use a known signing key.

That makes JWT forgery possible.

A production configuration should **fail startup** when the secret is absent rather than silently use a known default.

---

### 18. Production database password defaults to `postgres`

`docker-compose.yml` contains:

```text
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
```

This is unsafe for any deployment where PostgreSQL is reachable beyond an isolated container network.

---

# P1 / High — serious application/security bugs

### 19. Diagnostic report IDOR

**File:** `DiagnosticController.java`

These endpoints lack ownership checks:

```text
GET /api/diagnostics/farmer/{farmerId}
GET /api/diagnostics/{id}
POST /api/diagnostics/{id}/escalate
```

Any authenticated user can access arbitrary reports by ID.

---

### 20. Diagnostic escalation has no ownership authorization

`escalateReport()` accepts `userEmail` but never uses it for authorization.

A user can escalate another user's diagnostic report and write expert notes.

---

### 21. Diagnostic scan accepts another farmer's ID

`runDiagnosticScan()` does:

```text
if farmer == null and request.farmerId != null
    load farmer by ID
```

There is no ownership validation.

An authenticated caller can attach a diagnostic report to somebody else's farmer profile.

---

### 22. Recommendation endpoint has an ownership/IDOR issue

**Files:**

* `RecommendationController.java`
* `RecommendationService.java`

The request contains:

```text
farmerId
produceId
```

but the service does not verify:

```text
produce.farmer == farmer
```

or that the authenticated principal owns the farmer.

So arbitrary farmer/produce combinations can be supplied.

---

### 23. Recommendation history has no ownership restriction

```text
GET /api/recommendations/farmer/{farmerId}
```

does not perform an ownership check.

---

### 24. Role is not strictly enforced for trade creation

`TradeDealController` effectively maps:

```text
ROLE_BUYER → BUYER
anything else → FARMER
```

So ADMIN or another future role can be interpreted as FARMER.

The endpoint itself is merely authenticated rather than explicitly restricted to:

```text
ROLE_FARMER or ROLE_BUYER
```

---

### 25. Counter-offer role can be inconsistent

`submitCounterOffer()` checks that the user is a trade party, but does not independently establish:

```text
authenticated role == actual party represented
```

The role is inferred from the caller's authority, while party membership and negotiation identity are separate concepts.

The negotiation state machine also does not enforce whose turn it is.

---

### 26. User profile data is exposed to same-role callers

`GET /api/farmers/{id}` and `GET /api/buyers/{id}` return entities directly.

The `User.password` is protected with `@JsonIgnore`, which is good, but the returned `User` still contains:

* email
* phone
* name
* role

So same-role authenticated users may be able to retrieve other users' contact information depending on the route/security setup.

A DTO with explicitly safe fields would be preferable.

---

# Location consistency problems

This is one of the areas you specifically asked me to inspect.

## 27. Location has multiple independent sources of truth

The frontend stores location in several different places:

```text
profile.latitude / longitude
profile.address / district / state

mapCoords.lat / lon / label

requirement.location

weather locationName
```

These are not one unified location model.

---

### 28. Saving profile does not load profile on login

I found `saveProfile()`, but no equivalent `loadProfile()` fetching:

```text
GET /api/farmers/{id}
GET /api/buyers/{id}
```

after login/session restoration.

The UI therefore starts with the hardcoded default:

```text
23.3441, 85.3096
Ranchi Center
```

rather than the stored server profile.

This is exactly the type of "location we give should be used everywhere" failure you were asking about.

---

### 29. Map/weather default to Ranchi even when user location is unknown

Frontend:

```text
mapCoords = Ranchi Center
```

Backend:

```text
originLat == null ? 23.3441
originLon == null ? 85.3096
```

So an unspecified/missing location silently becomes Ranchi rather than producing:

```text
location required
```

This can produce incorrect market routing and weather information.

---

### 30. Updating profile location does not globally propagate location state

`saveProfile()` manually calls:

```text
handleLocationPreset(...)
```

after saving.

That updates the current map state, but this is event-driven UI state, not a shared location source.

Other fields/modules continue using their own location state.

---

### 31. Buyer requirement has a separate free-text location

Backend:

```text
BuyerRequirement.location
```

Frontend:

```text
requirement.location
```

Buyer profile also separately contains:

```text
address
district
state
latitude
longitude
```

These can disagree.

Example:

```text
Buyer profile coordinates = Ranchi
Requirement location = Kolkata Cold Storage
```

---

### 32. Recommendation matching ignores requirement.location

Recommendation distance is based on:

```text
farmer latitude/longitude
buyer latitude/longitude
```

not:

```text
buyer requirement.location
```

So the location a buyer enters with the procurement request may not be used for matching at all.

---

### 33. Delivery location comes from buyer profile, not necessarily the requirement location

Trade creation defaults delivery address to:

```java
buyer.getAddress()
```

That means the delivery destination can differ from the destination shown in the buyer requirement.

This is a direct cross-module location inconsistency.

---

### 34. `FarmerProduce` has no location of its own

The recommendation engine implicitly uses farmer profile coordinates rather than snapshotting the produce/listing origin.

If the farmer later changes their profile location, historical/listed produce effectively moves.

That can alter:

* recommendations
* transport cost
* distance
* route
* profitability

for an existing listing.

A listing should normally retain a location snapshot.

---

### 35. Latitude/longitude have no validation

`FarmerProfileRequest` and `BuyerProfileRequest` accept arbitrary doubles.

There are no constraints for:

```text
latitude ∈ [-90, 90]
longitude ∈ [-180, 180]
```

The frontend also converts values with `Number(...)`, so invalid user text can become `NaN`, which JSON serialization can turn into null.

---

### 36. Missing coordinates are interpreted as zero-distance in DistanceCalculator

`DistanceCalculator.between()` does:

```java
if (... == null) {
    return BigDecimal.ZERO;
}
```

That is dangerous.

Missing coordinates should not mean:

```text
0 km away
```

because proximity scoring can then make unknown locations look like perfectly colocated locations.

---

# Frontend ↔ backend connection bugs

## 37. Quick produce listing sends the wrong payload

**File:** `frontend/src/App.jsx`

`handleQuickProduceSubmit()` sends:

```text
cropId
quantity
expectedPrice
availableUntil
description
imageUrl
```

but backend `ProduceRequest` requires:

```text
quality
```

with:

```java
@NotBlank String quality
```

So the backend request should fail validation.

But the frontend only reacts to `res.ok` and then still displays:

> "Produce listing published"

This is a confirmed frontend correctness bug.

---

### 38. Quick requirement payload uses the wrong field name

Frontend sends:

```text
deliveryLocation
```

Backend expects:

```text
location
```

The backend also requires:

```text
qualityRequired
```

but the quick modal payload does not provide it.

Therefore the quick requirement submission is incompatible with the backend DTO.

---

### 39. Quick requirement UI ignores HTTP failure

The code calls `fetch()` but does not check:

```text
response.ok
```

It then says:

> "Procurement order published"

even if the backend returned 400/401/403/500.

---

### 40. Quick produce UI also claims success when API fails

Same issue.

A failed backend call can still produce a successful UI message.

This is especially damaging because it hides real bugs during testing.

---

### 41. Quick procurement of farm inputs is entirely local

`handleQuickProcureInputSubmit()` does not call any backend API.

It only calculates a price in JavaScript and updates a message.

So this "procurement" operation is not persisted.

---

### 42. Community posts are frontend-only

Community posts/replies/interactions are held in React state.

They are not connected to a backend persistence service.

Refreshing the page destroys the data.

Other users cannot see it.

---

### 43. Shop/order state is frontend-only

`userOrders`, `shopOffers`, and related order-progress data are maintained locally.

Accepting an offer creates a local trade-contract-like object but does not necessarily create the corresponding backend trade/escrow state.

This can produce:

```text
UI says trade exists
backend says no trade exists
```

---

### 44. Frontend notification read status is not persisted

The UI uses:

```javascript
setNotifications(...)
```

for marking notifications read.

It never calls:

```text
PATCH /api/notifications/{id}/read
```

Therefore the notification remains unread on the server.

---

### 45. Frontend does not initially load server notifications

The initial notification list is hardcoded:

```text
Tomato Market Price Jump
New Matching Requirement
Bullish AI Price Forecast
Freight Rate Update
```

The backend has:

```text
GET /api/notifications/me
```

but the frontend does not use it.

So actual persisted notification history is disconnected from the UI.

---

### 46. WebSocket production URL is wrong for the deployed architecture

Frontend builds:

```javascript
ws://<current-host>:8080/ws
```

or:

```text
wss://<current-host>:8080/ws
```

But the production frontend is served through Nginx on port 80, and the Nginx config only proxies:

```text
/api/
```

There is no:

```text
/ws/
```

reverse proxy.

So the deployed WebSocket architecture is internally inconsistent.

---

### 47. WebSocket authentication is not implemented

The client sends STOMP `CONNECT` without JWT.

The server accepts the WebSocket endpoint with:

```java
.setAllowedOriginPatterns("*")
```

and there is no user-authenticated WebSocket principal setup.

User-specific destinations are constructed from:

```text
userId
```

but the connection itself does not prove that the client owns that user ID.

This is a serious real-time authorization concern.

---

### 48. WebSocket CORS is completely open

```java
.setAllowedOriginPatterns("*")
```

Any origin can establish the WebSocket handshake.

Even if the REST API CORS policy is restricted, the WebSocket policy isn't.

---

# Authentication/password problems

## 49. Password policy is far too weak

`RegisterRequest` only has:

```java
@NotBlank String password
```

There is no server-side minimum length, complexity, breached/common-password protection, or maximum size.

So passwords such as:

```text
123
password
a
```

are structurally accepted as long as they are nonblank.

This directly addresses your password strictness concern.

---

### 50. Frontend password validation is also only `required`

The auth form does not enforce a useful minimum/strength requirement.

So both client and server are weak.

---

### 51. Registration has case-normalization bug

`AuthService.register()` does:

```text
existsByEmail(request.email())
```

before lowercasing.

Then it saves:

```text
request.email().toLowerCase()
```

So:

```text
user@example.com
User@Example.com
```

can produce an inconsistent duplicate-registration path and potentially a database constraint error instead of a clean validation response.

---

### 52. Registration doesn't consistently trim stored email

The frontend trims the email, but the backend itself doesn't normalize with:

```text
trim + lowercase
```

So backend callers can bypass the frontend normalization.

---

### 53. Phone numbers have essentially no validation

Registration and profile requests accept arbitrary strings for phone numbers.

The notification and SMS subsystems clearly depend on phone correctness.

This can produce malformed field-alert targets.

---

### 54. Authentication failure silently becomes a fake logged-in session

This is one of the largest frontend security/correctness problems.

In `handleAuth()`, any failed authentication is caught and replaced with:

```text
local-session-token-<timestamp>
```

and:

```text
setSession(fallbackUser)
```

So:

```text
server login fails
        ↓
frontend says login succeeded
        ↓
fake token stored in localStorage
        ↓
user appears authenticated
```

This hides backend failures and can create very confusing authorization behaviour.

---

### 55. Quick demo logins use fake JWTs

The app stores:

```text
demo-farmer-jwt
demo-buyer-jwt
```

as though they were authentication tokens.

The backend will not treat these as genuine signed JWTs.

So UI login state and actual API authentication are disconnected.

---

### 56. JWT stored in localStorage

Frontend stores the bearer token in:

```text
localStorage
```

Any XSS vulnerability can expose the token.

A stronger architecture would use secure HTTP-only cookies or otherwise tightly control token storage.

---

# Database / startup issues

## 57. Confirmed PostgreSQL/Flyway schema mismatch: `reason` vs `explanation`

**Migration:**

```text
V1__initial_schema.sql
```

creates:

```text
recommendations.explanation
```

**Entity:**

```text
Recommendation.java
```

defines:

```java
private String reason;
```

There is no explicit:

```java
@Column(name = "explanation")
```

Hibernate will therefore expect a `reason` column.

Because PostgreSQL profile uses:

```text
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.validate-on-migrate=true
```

this is a likely startup/schema-validation failure.

This is one of the clearest backend deployment bugs I found.

---

### 58. Generated/build artifacts are committed into the project

The archive contains:

```text
backend/target/
frontend/dist/
frontend/node_modules/
```

and also even a `.class` under source:

```text
src/main/java/.../ProfitCalculator.class
```

This causes:

* huge repository size
* platform-specific dependency problems
* stale generated artifacts
* reproducibility issues
* accidental shipping of build output

These should generally not be committed.

---

### 59. `node_modules` contains platform-specific native binaries

The supplied frontend dependency tree contains Windows-oriented native modules.

That makes the archived project fail to build/run on Linux without reinstalling dependencies.

This is why the scan environment hit the Rolldown native-binding error.

---

### 60. Maven wrapper is committed without executable permission

`mvnw` is mode:

```text
100644
```

not executable.

So:

```text
./mvnw test
```

fails immediately with `Permission denied`.

The Dockerfile works around this using:

```text
chmod +x mvnw
```

but normal project usage is broken.

---

### 61. Frontend Vite executable also has incorrect permission

The archived:

```text
frontend/node_modules/.bin/vite
```

is non-executable.

Another consequence of packaging `node_modules`.

---

# Price/market correctness

## 62. Price trend mixes different markets

`PriceService.trend()` gets:

```text
findByCropIdOrderByDateDesc(...)
```

and compares the first two entries.

That query is across **all markets**.

So:

```text
Ranchi today = ₹24
Bokaro yesterday = ₹30
```

could be interpreted as a market-price change for the crop.

The trend needs to be calculated per market or across a defined aggregation.

---

### 63. Price-alert percentage can compare different markets

Same problem in `PriceService.create()`.

The "previous price" is:

```text
latest price for crop across all markets
```

not the previous price for the same market.

A newly entered price in another mandi can therefore generate a false spike/drop alert.

---

### 64. No validation that min ≤ modal ≤ max

`MarketPriceRequest` only checks `@NotNull`.

The API allows inconsistent prices such as:

```text
min = 100
modal = 50
max = 20
```

---

### 65. Negative market prices are possible

Prices have no `@Positive` / `@PositiveOrZero`.

So negative price data can reach the database.

---

### 66. Benchmark price unit handling is inconsistent

`FarmerAnalyticsService` says:

```java
// Mandi modal price is per quintal (100kg)
divide by 100
```

But the seed data and frontend display prices like:

```text
Tomato = ₹24/kg
Potato = ₹18/kg
Mango = ₹78/kg
```

The project therefore has a serious unit ambiguity.

If database prices are already ₹/kg, analytics benchmark prices are 100× too low.

A single explicit unit convention is required.

---

### 67. Analytics counts proposed trades as revenue

`FarmerAnalyticsService` builds:

```text
activeDeals =
all deals except CANCELLED
```

That includes:

```text
PROPOSED
NEGOTIATING
ACCEPTED
IN_TRANSIT
DELIVERED
COMPLETED
```

Then it adds their value into:

```text
totalRevenue
```

So an unaccepted proposal can count as farmer revenue.

---

### 68. Analytics monthly data is partly fabricated

When there is only one month of actual data, the service deliberately generates:

```text
May 2026
Jun 2026
Jul 2026
Aug 2026
```

with hardcoded revenue/volume values.

This means the analytics screen can present synthetic history as though it were the farmer's real history.

---

# Recommendation/financial correctness

## 69. Recommendation may treat missing coordinates as perfect proximity

As noted above:

```text
null coordinates → 0 km
```

Since recommendation scoring uses distance, this can make incomplete profile data look like the best geographic match.

---

### 70. Recommendation does not enforce buyer quantity capacity

The matching code checks crop, quality, validity, and distance, but not a proper:

```text
produce quantity vs buyer required quantity
```

compatibility rule.

A "best buyer" may therefore not actually be able to absorb the whole listing.

---

### 71. Recommendation output can become stale after profile changes

Because recommendations are persisted with calculated:

* price
* transport cost
* gross revenue
* net return
* score

changing a farmer/buyer location later does not recalculate existing saved recommendations.

Historical recommendations can therefore display numbers that no longer correspond to current locations.

---

# AI/diagnostic correctness

## 72. "AI diagnosis" is actually keyword-based rule matching

`DiagnosticService.inferPathology()` uses conditions like:

```text
powder
mildew
rust
aphid
whitefly
```

and returns hardcoded diagnoses.

It is not an actual image model or AI diagnostic engine.

---

### 73. Diagnostic confidence values are hardcoded

Examples include:

```text
93.8
95.2
94.1
92.7
89.5
```

These are not statistically derived from model inference.

Showing them as diagnostic confidence percentages is misleading.

---

### 74. Frontend repeats the fake diagnosis independently

When the backend fails, the frontend invokes:

```text
inferClientSideDiagnosis(...)
```

and presents another diagnosis.

So there are two separate diagnostic engines with potentially different outputs.

This makes the displayed diagnosis non-authoritative.

---

### 75. Backend failure is hidden by diagnostic fallback

An API/server failure can result in:

```text
"Crop Doctor: <diagnosis>"
```

instead of clearly telling the user the diagnostic service failed.

That makes operational failures almost impossible to distinguish from real diagnoses.

---

# Notification / messaging correctness

## 76. SMS/WhatsApp provider delivery is simulated as delivered

`SmsWhatsAppService` generates synthetic provider IDs and reports successful delivery without an actual provider integration.

So:

```text
DELIVERED
```

does not necessarily mean an SMS/WhatsApp message was actually delivered.

---

### 77. Missing recipient phone silently becomes a hardcoded phone number

The service uses a fallback like:

```text
+91-9876543210
```

when no phone is available.

That is dangerous because a real notification can be routed to the wrong recipient.

---

### 78. Release/escrow messages claim actual money transfer

The system generates synthetic UTRs such as:

```text
UTR-NPCI-...
```

and then tells users the payout was transferred.

There is no actual payment gateway/UPI settlement verification in the code.

This must not be presented as real financial settlement in production.

---

# Web/API architecture issues

## 79. WebSocket user topic is based on URL-controlled user ID

Frontend subscribes to:

```text
/topic/notifications/user/{session.userId}
```

and:

```text
/topic/trades/user/{session.userId}
```

But the server doesn't authenticate the WebSocket connection and doesn't bind subscription authorization to the JWT identity.

---

### 80. CORS is localhost-only for API

`CorsConfig` permits:

```text
localhost:3000
localhost:5173
localhost:5174
localhost:5175
```

but not the actual deployed domain.

Nginx reverse proxy may avoid CORS in the intended setup, but direct frontend/backend hosting will fail cross-origin in production.

---

### 81. REST and WebSocket routing are configured inconsistently

REST:

```text
Nginx → /api/ → backend
```

WebSocket:

```text
browser → host:8080/ws
```

Those are two different deployment paths.

The production reverse proxy should consistently handle `/ws`.

---

# Data validation gaps

## 82. Buyer requirements allow zero/negative quantities

```java
@NotNull BigDecimal requiredQuantity
```

There is no `@Positive`.

Same issue for:

```text
offeredPrice
```

---

### 83. Produce quantity allows zero/negative quantities

`ProduceRequest.quantity` is only `@NotNull`.

It should at least be positive.

---

### 84. Produce price is not validated

`expectedPrice` is optional, but when present it can be negative.

---

### 85. Date relationships are not validated

There is nothing enforcing:

```text
availableUntil >= harvestDate
validUntil >= today
```

where appropriate.

---

### 86. Market coordinates have no range validation

As with farmer/buyer profiles, market latitude/longitude can be invalid.

---

# Frontend state/data correctness

## 87. Profile is initialized with Ranchi demo values for every user

The profile state starts with:

```text
23.3441
85.3096
```

This is especially dangerous because it looks like actual saved data after a session is restored.

---

### 88. Buyer/farmer sessions can share the same `profileId` in demo data

The quick-login demo buyer explicitly uses:

```text
profileId: 1
```

while the farmer demo also uses:

```text
profileId: 1
```

That makes UI behavior depend on role rather than truly separate identities and can create misleading API failures.

---

### 89. App silently ignores many non-OK API responses

There are numerous patterns like:

```javascript
if (res.ok) {
   ...
}
```

with no explicit error path.

This causes network/server failures to look like empty data instead of errors.

---

### 90. The frontend has too many independent fallback datasets

There are hardcoded datasets for:

* markets
* notifications
* shop products
* orders
* offers
* community posts
* diagnostic results
* weather-like UI
* quick login
* fallback auth

That makes it difficult to know whether a screen is displaying:

```text
database truth
API truth
demo truth
or fallback truth
```

This is a major architectural correctness problem.

---

# Build/test findings

I attempted the project commands rather than only reading source.

### Backend

`./mvnw test` initially fails because `mvnw` is not executable.

After correcting the permission in the scan copy, Maven Wrapper attempts to download Maven, but this environment cannot reach the Maven distribution host.

Also:

```text
Java 21.0.11
```

is installed while the project specifies:

```xml
<java.version>25</java.version>
```

So the local environment is also below the declared Java version.

### Frontend

`npm run build` initially fails because the bundled Vite executable lacks execute permission.

After correcting that, Vite fails because the checked-in `node_modules` contains the wrong platform-specific native Rolldown modules (Windows rather than Linux).

So I could not honestly claim the complete test suite/build passed.

There are also only **two Java test source files** in the project, which is nowhere near enough coverage for a system with authentication, escrow, trading, authorization, recommendations, notifications, and migrations.

---

# The biggest architectural "unconnected parts"

This is the condensed list of the things I would classify as unfinished integration rather than isolated bugs:

| Area                       | Frontend              | Backend                       | Result                           |
| -------------------------- | --------------------- | ----------------------------- | -------------------------------- |
| Profile loading            | No GET on login       | GET exists                    | **Disconnected**                 |
| Location                   | Multiple local states | Multiple DB locations         | **No single source of truth**    |
| Buyer requirement location | Free-text local field | `location` column             | **Not used consistently**        |
| Notifications              | Hardcoded/local       | Persistent API exists         | **Disconnected**                 |
| Notification read          | Local only            | PATCH API exists              | **Disconnected**                 |
| Community                  | Local React state     | No persistence                | **Frontend-only**                |
| Input procurement          | Local calculation     | No matching backend flow      | **Frontend-only**                |
| Shop/order                 | Local state           | Trade/escrow backend separate | **Two competing systems**        |
| Diagnostics                | Local fallback        | Rule-based backend            | **Two competing engines**        |
| WebSocket                  | Direct `:8080`        | Nginx doesn't proxy `/ws`     | **Deployment mismatch**          |
| SMS/WhatsApp               | UI present            | Simulated provider            | **Not real integration**         |
| Escrow                     | UI present            | Simulated settlement          | **Not real payment integration** |
| Auth                       | Fake fallback session | Real JWT backend              | **Two auth models**              |

---

# Priority repair order

I would fix the project in this order:

### Phase 1 — security and financial integrity

1. Remove frontend fake-auth fallback.
2. Disable demo login outside explicit development mode.
3. Remove default production JWT secret.
4. Lock down SMS webhook.
5. Authenticate webhook sender/trade ownership.
6. Fix all diagnostic/recommendation IDORs.
7. Enforce trade state machine.
8. Enforce trade relationship/quantity/crop validation.
9. Lock escrow to accepted trades.
10. Require exact/full deposit.
11. Restrict escrow release to the correct authorization workflow.
12. Prevent release from disputed state.
13. Remove fake UTR/payment success claims.

### Phase 2 — location/data model

14. Create one canonical `Location` model/source of truth.
15. Load profile from backend on session restore.
16. Propagate profile location into map/weather/matching.
17. Decide whether requirement location overrides profile location and implement that explicitly.
18. Snapshot listing location at listing creation.
19. Validate coordinate ranges.
20. Treat missing coordinates as unknown, not `0 km`.

### Phase 3 — frontend/backend contracts

21. Fix quick produce payload.
22. Fix quick requirement payload.
23. Check every API response before showing success.
24. Connect notifications to `/api/notifications/me`.
25. Persist read status.
26. Connect community/order/input flows or clearly label them as demo-only.
27. Eliminate duplicate/fallback business logic.

### Phase 4 — financial/analytics correctness

28. Fix market-price units.
29. Make price trends market-specific.
30. Validate min/modal/max.
31. Only count completed/settled deals as actual revenue.
32. Remove fabricated monthly analytics.
33. Recalculate or version recommendation snapshots correctly.

### Phase 5 — deployment/reproducibility

34. Remove `node_modules`, `target`, `dist`, `.class` artifacts from source control.
35. Fix executable permissions.
36. Use clean dependency installation.
37. Make WebSocket work through Nginx.
38. Require production environment secrets.
39. Add real integration tests for authorization and trade/escrow lifecycle.

## Bottom line

The project has a decent amount of functionality, but it currently has **multiple independent implementations of the same concepts**—especially location, authentication, notifications, orders, diagnostics, and trades. That is the root cause behind many of the inconsistencies.

The three most dangerous combinations are:

**fake frontend authentication + permissive backend endpoints + weak webhook security**

and

**client-controlled trade states + weak trade relationship validation + unsafe escrow**

and

**multiple location sources + no profile reload + recommendation/weather/map using different locations**.

Those should be addressed before adding more features.



# KisanLink Project Scan — Partial Findings (Backend + Frontend)

I got deep into this before hitting my tool-call limit for this turn. Here's everything confirmed so far, in priority order. **This is not the complete picture yet** — I hadn't reached Escrow/TradeDeal internals, Prediction/Price services, Diagnostic service, DB migrations, or CORS/JWT storage on the frontend. Say "continue" and I'll keep going through those.

## 🔴 Critical security bugs

**1. Anyone can read everyone's SMS/WhatsApp logs, no login required.**
`SmsWhatsAppController.getLogs()` accepts a null principal (since that GET route is `permitAll()` in `SecurityConfig`). `SmsWhatsAppService.getRecentLogs(null)` then falls through to `logRepository.findTop20ByOrderBySentAtDesc()` — the 20 most recent messages **across every user**, phone numbers and all (deal confirmations, escrow payout receipts, etc.), served to anonymous requests.

**2. Personal notifications broadcast on public WebSocket topics with no auth.**
`NotificationWebSocketService` sends to `/topic/notifications/user/{id}` and `/topic/trades/user/{id}` — plain `/topic` broadcasts, not Spring's per-user `convertAndSendToUser`. The `/ws` STOMP endpoint is `permitAll()` with `setAllowedOriginPatterns("*")` and no channel interceptor checks who's subscribing. Anyone can connect and subscribe to `/topic/notifications/user/1`, `/2`, `/3`… and read every user's buyer-match alerts and trade status changes.

**3. SMS-based deal acceptance doesn't verify the sender's phone.**
In `SmsWhatsAppService.handleInboundWebhook`, texting `ACCEPT <dealId>` flips the trade to `ACCEPTED` after only checking the shared `X-Webhook-Secret` (which just authenticates the SMS gateway, not the end user). It never checks `req.fromPhone()` against the farmer's registered phone on that deal — anyone who can reach the webhook can accept any deal by ID.

## 🟠 Password strictness (exactly what you asked about)

**4. `RegisterRequest.password` has only `@NotBlank` — no length or complexity rule.** A one-character password like `"a"` is accepted. No `@Size(min=...)`, no pattern check, anywhere in the register/login path.

## 🟡 Location bugs (also exactly what you flagged)

This is the big one — location is handled **three different, inconsistent ways** across the app:

**5. Missing location silently becomes "0 km away."** `DistanceCalculator.between()` returns `BigDecimal.ZERO` when either party's lat/long is null — instead of erroring or excluding them. Since new Farmer/Buyer rows are created with no location at all at registration, this is easy to hit.

**6. That "0 km" bug then wins recommendations.** `ScoringService` computes `proximityScore = 1 − distance/maxDistance`. A distance of 0 → proximity score of 1.0 (max), and near-zero transport cost also inflates the net-margin score to near-max. A user with *no location set* looks like the single best, closest match — the opposite of the intended "net return over raw price, don't just chase the best-looking number" design principle in your own project.md.

**7. Missing coordinates elsewhere silently default to Ranchi (23.3441, 85.3096)** in `MarketService.findNearbyMarkets` and `WeatherAdvisoryService.getAdvisory` — a *different* fallback behavior than #5, with no signal to the caller that a default was substituted.

**8. The frontend pre-fills every profile form with Ranchi's coordinates as a live, editable value** (`latitude: '23.3441'`), not just a placeholder hint — and there is **no `navigator.geolocation` call anywhere in the frontend**. The "📍 Use My Profile GPS" button just reuses whatever's already typed in the form; it doesn't read real device GPS. A farmer in Mumbai who doesn't manually retype the coordinates will silently register as being in Ranchi.

**9. No validation on latitude/longitude anywhere** — not on `FarmerProfileRequest`/`BuyerProfileRequest` (no annotations at all), not in `FarmerService`/`BuyerService` (direct unchecked assignment), and `@Valid` isn't even applied on the two profile-update controller methods.

**10. Profile updates null out fields instead of patching them.** In both `FarmerService.updateProfile` and `BuyerService.updateProfile`, `address`/`district`/`state`/`latitude`/`longitude` (and `businessName`/`businessType` for buyers) are overwritten unconditionally, while `phone`/`alertEmail` are conditionally skipped if null. Any partial update that omits location fields **wipes out the previously saved location**.

**11. `BuyerRequirement.location` (free-text string, e.g. "Ranchi") is captured and stored but never read anywhere** — the actual recommendation engine uses `Buyer.latitude/longitude` instead. The location a buyer types when posting a requirement has zero effect on matching.

**12. Quantity is captured but never used for matching.** `requiredQuantity` on a buyer requirement is set once in `BuyerService.addRequirement` and never read again — no feasibility filter, no scoring weight, no explanation line — even though your own project.md lists "quantity requirement matches ✓" as a required explainability check.

**13. Quality matching is exact-string, case-insensitive only** (`equalsIgnoreCase`), but both `FarmerProduce.quality` and `BuyerRequirement.qualityRequired` are unrestricted free text. "Grade A" vs "GRADE_A" (used in your own dashboard mockup) would **not** match.

## 🟢 Correctness / robustness bugs

**14. Email-uniqueness check doesn't lowercase before comparing.** `AuthService.register` calls `userRepository.existsByEmail(request.email())` (original case) but then stores `request.email().toLowerCase()`. Registering "Test@x.com" then "TEST@x.com" bypasses the "already registered" check and instead hits the DB's unique constraint directly — which isn't specifically handled, so it surfaces as a generic 500 instead of a clean 400.

**15. Hardcoded fallback JWT secret** (`change-this-development-secret-to-a-long-random-value`) ships as the default in `application.properties`, live if `JWT_SECRET` env var isn't set.

**16. Any-farmer-reads-any-farmer's-full-profile.** `GET /api/farmers/{id}` and `GET /api/buyers/{id}` return the raw JPA entity (including nested `User` with email/phone and exact GPS) to *any* authenticated farmer/buyer, not just the profile owner — flagged in your own `ANTIGRAVITY_CONTEXT.md` as a known gap ("introduce response DTOs before production") but still present.

**17. Weather advisory is 100% fabricated math, not real weather** — a deterministic formula off lat/long offset from Ranchi, with no disclaimer in the API response that it's simulated.

I'll pick up with Escrow/TradeDeal, Prediction/Price, Diagnostics, DB migrations, and the remaining frontend/CORS/JWT-storage review whenever you're ready — just say so.

Yes. I continued the scan from the exact stopping point in your report and went deeper into the parts you had not yet covered. I also cross-checked the automated tests against the implementation, because some of the tests are actually encoding unsafe behavior as “expected” behavior.

Below are the **additional findings**, excluding the 17 items you already listed unless they need an important correction.

# Additional KisanLink findings

## 🔴 Critical

### 18. Production JWT secret has a second hardcoded fallback in Docker

You already caught the fallback in `application.properties`.

There is another one in:

`docker-compose.yml`

```text
JWT_SECRET=${JWT_SECRET:-kisanlink-production-secure-jwt-secret-key-at-least-256-bits-long}
```

So even if the properties file is fixed, Docker still silently supplies a known secret when the operator forgets to configure one.

**Impact:** someone who knows the repository can generate valid-looking JWTs for the deployment.

**Fix:** require `JWT_SECRET`; fail container startup when absent. Never provide a production default.

---

### 19. PostgreSQL container is exposed directly to the host

`docker-compose.yml`:

```text
5432:5432
```

combined with:

```text
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

means the database can be reached directly from the host/network.

For a production deployment, PostgreSQL should normally remain internal to the Docker network unless external database access is explicitly required and secured.

**Severity:** Critical when deployed on an exposed server.

---

### 20. Docker frontend/API deployment has a CORS mismatch

The frontend defaults to:

```text
http://localhost:8080
```

while production Nginx serves the frontend on port 80.

`CorsConfig` allows development origins like:

```text
localhost:3000
localhost:5173
...
```

but not the normal production frontend origin on port 80.

So a normal Docker deployment accessed as:

```text
http://localhost
```

can make browser API requests to:

```text
http://localhost:8080
```

which is cross-origin and **not in the allowed origin list**.

This can make the packaged Docker deployment fail despite both containers being healthy.

---

### 21. Escrow creates fake UPI/payment evidence

There is no payment provider verification.

The service generates:

```text
UPI/KL/...
UTR-NPCI-...
```

locally.

It then tells both parties that money was:

> “securely locked”

and:

> “successfully deposited to your UPI ID”

But no actual UPI transaction is checked.

This is more serious than just “simulation”: the API state is presented as a real financial event.

The test suite explicitly treats the generated UTR as a successful settlement.

---

### 22. Farmer UPI ID is fabricated from phone number

`getOrCreateEscrow()` does:

```text
farmerPhone + "@upi"
```

That is not a valid general rule for UPI IDs.

A phone number is not automatically a farmer's UPI VPA.

So the system may display/claim a payout destination that doesn't actually exist.

---

### 23. Buyer can provide an arbitrary UPI ID and arbitrary transaction reference

The deposit request accepts:

```text
buyerUpiId
upiTransactionRef
```

without verification.

There is no:

* payment-provider verification
* transaction lookup
* amount verification
* payer identity verification
* duplicate transaction detection

Thus the request is effectively:

> “Trust whatever payment reference the client typed.”

---

### 24. Duplicate payment references are possible

No database uniqueness constraint exists on `upi_ref`.

A client can submit the same transaction reference repeatedly for different escrow accounts.

Even though the current escrow status prevents repeated deposits into the same escrow, nothing establishes the reference as globally consumed.

---

### 25. Escrow deposit has a TOCTOU/concurrency vulnerability

The workflow is:

```text
read PENDING_DEPOSIT
↓
check status
↓
write FUNDS_HELD_IN_ESCROW
```

There is no:

```text
@Version
```

or database row lock.

Two concurrent deposit requests can both observe `PENDING_DEPOSIT`.

Only one real payment should ever be accepted for that escrow.

---

### 26. Trade status updates also lack optimistic locking

`TradeDeal` has no `@Version`.

Two simultaneous requests can both read an old status and update it.

This becomes particularly dangerous when combined with:

* negotiation
* acceptance
* delivery
* escrow release

A proper trade lifecycle should be concurrency-safe.

---

# 🟠 Trade/negotiation problems

### 27. Negotiation does not enforce whose turn it is

`submitCounterOffer()` checks:

```text
PROPOSED or NEGOTIATING
```

but not:

```text
last offer was sent by the other side
```

So the same participant can repeatedly submit:

```text
COUNTER → COUNTER → COUNTER → COUNTER
```

without the other party responding.

---

### 28. Negotiation permits changing quantity beyond the original deal constraints

The counter-offer accepts:

```text
proposedQuantity
```

with only `@Positive`.

It is not validated against:

* available produce
* buyer requirement
* original negotiated quantity
* remaining quantity

A counter-offer can therefore grow a 500 kg transaction into 50,000 kg.

---

### 29. Existing produce inventory isn't reserved

Suppose:

```text
Farmer listing = 500 kg
```

Two buyers create:

```text
Trade A = 500 kg
Trade B = 500 kg
```

There is no inventory reservation/decrement.

Both trades can proceed.

The database still believes the farmer has the same 500 kg available.

This is a fundamental marketplace consistency bug.

---

### 30. Cancelling a trade does not appear to restore/adjust inventory because inventory was never reserved

This is the second half of the previous problem.

There is no lifecycle around:

```text
available quantity
reserved quantity
sold quantity
released quantity
```

So the produce quantity is effectively descriptive rather than transactional inventory.

---

### 31. A produce listing can remain active after `availableUntil`

Recommendation filtering does not appear to consistently enforce the listing's expiration.

The presence of `availableUntil` therefore does not guarantee that expired produce disappears from matching.

The same issue exists for buyer `validUntil`.

---

### 32. Buyer requirement expiry is not a hard matching constraint everywhere

The recommendation flow should reject requirements where:

```text
validUntil < today
```

but the repository/service design does not centrally enforce expiry.

This means expired purchasing demand can remain eligible.

---

### 33. Trade delivery address is snapshotted inconsistently

New trades default to:

```text
buyer.getAddress()
```

but buyer requirements independently have:

```text
requirement.location
```

So after creation:

```text
requirement location != buyer address != trade delivery address
```

The system has no explicit rule determining which is authoritative.

---

### 34. Updating buyer profile can silently change future trade destinations but not existing trades

Because the trade stores a copied delivery address, changing:

```text
Buyer.address
```

does not update existing deals.

That can be correct if intentional, but the application provides no distinction between:

* current buyer profile location
* contractual delivery location

and the UI appears to treat them interchangeably.

---

# 🟠 Recommendation engine

### 35. Recommendation is not actually “best practical sale” when quantity differs

The score compares financial values but does not properly account for whether the buyer can absorb the entire listing.

For example:

```text
Farmer has 2,000 kg
Buyer A wants 100 kg at ₹40
Buyer B wants 2,000 kg at ₹35
```

The engine can prefer A based on price/score even though A cannot actually take the farmer's full shipment.

That conflicts with the project objective of practical market linkage.

---

### 36. Buyer trust is based only on a boolean `verified`

There is no reliability history such as:

* completed trades
* cancellation rate
* payment history
* dispute rate
* fulfillment rate

Yet the project describes this as a practical recommendation.

A buyer with one verification flag gets essentially the same trust treatment as a proven buyer.

---

### 37. Recommendation history stores stale calculated economics

`Recommendation` persists:

* selling price
* transport cost
* gross revenue
* net return
* score
* explanation

Those values won't automatically update when:

* market price changes
* buyer changes price
* farmer location changes
* buyer location changes
* transport pricing changes

So historical rows can appear current when they are actually stale snapshots.

A snapshot is fine, but the UI needs to identify it as historical.

---

### 38. Recommendation explanation can be internally inconsistent

The response explanation includes the best option's:

```text
net return
transport
distance
verified
```

but it does not document:

* quantity feasibility
* quality match
* requirement validity
* why other buyers lost

So the explanation can claim a high composite score without exposing all of the factors that supposedly drove that score.

---

# 🟠 Price prediction problems

### 39. Prediction ignores market identity

This is a major one.

`PredictionService.forecast()` loads:

```text
findByCropIdOrderByDateDesc(cropId)
```

not:

```text
crop + market
```

So if there are five markets:

```text
Ranchi ₹20
Bokaro ₹24
Jamshedpur ₹31
Dhanbad ₹18
...
```

the prediction treats all of these as one time series.

The endpoint even offers:

```text
/api/predictions/{cropId}/{marketId}
```

but the actual forecast calculation does not have a market parameter.

So the API surface suggests market-specific prediction while the core algorithm is crop-wide.

---

### 40. Forecast dates are based on application-server date, not data timeline

Forecast uses:

```java
LocalDate.now()
```

rather than anchoring predictions to the last observation date.

If price history is delayed or the latest data is old, the model still predicts from today.

---

### 41. Confidence score is a hand-crafted formula, not a statistical confidence metric

The code calculates:

```text
65 + data-size bonus - volatility penalty
```

and clamps it between:

```text
55% and 98%
```

This is a presentation score.

It is not derived from the statistical confidence interval in a conventional sense.

The API labels it as:

```text
confidenceScore
```

which is misleading.

---

### 42. Confidence intervals use regression assumptions that are not checked

The forecast calculates standard error and interval bounds without checking assumptions such as:

* enough observations
* meaningful independent observations
* residual behavior
* seasonality
* market-specific stationarity

For very small datasets, the system still returns polished “80% / 90% / 95%” ranges.

That gives a much stronger impression of statistical reliability than the data supports.

---

### 43. Future forecast is artificially damped by `0.92^(h-1)`

The trend is deliberately shrunk:

```text
beta * h * damping
```

This is a business heuristic, not a fitted forecasting model.

That's acceptable for a prototype only if clearly documented as heuristic.

---

### 44. Prediction history isn't clearly versioned per forecast run

The database stores `model_version`, which is good, but the current forecast calculation can produce different predictions over time while historical prediction rows aren't clearly tied to:

* training window
* source data date
* model run timestamp
* market
* forecast origin

This makes backtesting and auditing difficult.

---

# 🟡 Market price integrity

### 45. No check that the date is not in the future

The API permits a market price with:

```text
date = 2032-01-01
```

That future value immediately becomes the “latest” price because queries sort descending.

It can corrupt:

* current price
* trend
* prediction input
* alerts

---

### 46. No duplicate protection for `(market, crop, date)`

There should likely be a uniqueness rule such as:

```text
market_id + crop_id + date
```

or a clearly documented rule allowing multiple sources.

Currently several competing rows for the same market/crop/day can exist.

---

### 47. Market price source is free text and unverifiable

`source` has no controlled structure.

Nothing records:

* source organization
* retrieval time
* external reference
* whether the value is live, imported, or demo

This matters because the project claims current market-price discovery.

---

### 48. Price trend fallback fabricates ₹25 when there is no history

`PriceService.trend()` returns:

```text
STABLE
latestPrice = 25
change = 0
```

when no price exists.

So “no data” becomes a legitimate-looking market value.

This is especially dangerous in decision-support software.

It should return an explicit no-data state.

---

# 🟡 Diagnostic module

### 49. The image is not actually analyzed by the backend

`runDiagnosticScan()` accepts an `imageUrl`, but `inferPathology()` mainly uses:

```text
cropName
notes
```

The image URL is used primarily as returned/displayed data.

Thus:

```text
different image
same crop + same notes
```

can produce the same diagnosis.

This is not image diagnosis.

---

### 50. The frontend's “edge inference” is also color/keyword heuristics

The browser analyzes pixels using fixed thresholds:

```text
yellow ratio
dark ratio
rust-orange ratio
white mildew pixels
green healthy pixels
```

This is not a trained diagnostic model.

More importantly, both server and client can produce different diagnoses for the same image.

---

### 51. Diagnostic treatment advice includes pesticide dosages without agronomic context

The backend hardcodes chemical recommendations and concentrations.

There is no validation for:

* crop registration
* local legal availability
* product formulation differences
* resistance management
* pre-harvest interval
* worker safety
* weather suitability

For a prototype this should be explicitly marked as advisory/sample content rather than authoritative treatment prescription.

---

### 52. Diagnostic report allows an arbitrary image URL

There is no validation that:

```text
imageUrl
```

is a safe/valid image resource.

This enables:

* broken images
* non-image URLs
* enormous remote resources
* potentially tracking URLs

and makes the system dependent on external content it doesn't control.

---

# 🟡 Notification problems

### 53. `NotificationWebSocketService` appears to persist and broadcast separately

The application has both:

* database notifications
* WebSocket notifications
* frontend local notifications

These can drift.

A notification can be:

```text
WebSocket delivered
DB persisted
frontend duplicate
```

or the reverse.

There is no event ID/idempotency strategy visible.

---

### 54. Frontend receives duplicate notifications from several mechanisms

For example, after a trade action the frontend may:

1. update local state itself
2. receive WebSocket trade update
3. receive WebSocket user notification
4. reload HTTP trade state

There is no common notification ID/deduplication layer.

Users can therefore receive duplicate UI notifications.

---

### 55. Global price WebSocket topic is unauthenticated

This one isn't the same as the personal-user topic problem you already found.

The frontend intentionally subscribes to:

```text
/topic/prices/alerts
```

with no authorization.

That may be acceptable if prices are public, but it also means any internal metadata accidentally attached to the event becomes globally visible.

The event design should therefore contain only genuinely public market data.

---

# 🟡 API authorization gaps

### 56. Recommendation POST has no ownership check at all

This is worth separating from the `GET history` issue.

The endpoint accepts:

```json
{
  "farmerId": X,
  "produceId": Y
}
```

and there is no authenticated principal passed into `RecommendationController`.

The user can request recommendations against another farmer's listing.

---

### 57. Recommendation history has no authentication identity

Likewise:

```text
GET /api/recommendations/farmer/{farmerId}
```

doesn't receive/use the principal.

An authenticated user can query another farmer's recommendation history.

---

### 58. Trade creation can be initiated by a privileged non-farmer/non-buyer and be interpreted as FARMER

The controller uses:

```text
if authority contains ROLE_BUYER → BUYER
else → FARMER
```

So an admin or future third role reaching this endpoint can be interpreted as:

```text
initiatedBy = FARMER
```

rather than rejected.

---

### 59. Admin authorization is incomplete across the application

Admin is explicitly allowed to create:

```text
crops
markets
prices
```

but there is no coherent admin API for the operations promised in `project.md`, including:

* managing farmers
* managing buyers
* verifying buyers
* managing users
* monitoring recommendations

The role exists, but much of the promised admin surface is missing.

---

# 🟡 Profile / validation

### 60. Profile PUT requests are not `@Valid`

You already noticed the missing validation.

This means even if validation annotations were later added to the DTO, these endpoints would still bypass Bean Validation unless `@Valid` is added.

So the current code has two layers missing:

```text
DTO constraints
+
controller validation activation
```

---

### 61. Phone change is not normalized

The same person can provide:

```text
9876543210
+919876543210
+91 98765 43210
```

and be treated as different phone values.

That becomes important for SMS authorization once phone ownership is implemented.

---

### 62. Alert email has no email validation

`alertEmail` is treated as a raw string.

There is no `@Email`.

---

# 🟡 Database/model issues

### 63. Confirmed entity/migration column mismatch: `reason` vs `explanation`

This deserves elevated attention because you have:

SQL:

```text
recommendations.explanation
```

Entity:

```text
private String reason;
```

and no explicit `@Column(name = "explanation")`.

With:

```text
ddl-auto=validate
```

this is exactly the kind of mismatch that can stop the PostgreSQL application from starting.

---

### 64. Database has almost no business-level CHECK constraints

The DB accepts things such as:

```text
quantity <= 0
price < 0
transport_cost < 0
min_price > max_price
modal_price outside min/max
latitude outside valid range
longitude outside valid range
```

The application should validate these, but important invariants should also be protected at the DB boundary where practical.

---

### 65. `updated_at` is not automatically maintained by PostgreSQL

Several tables have:

```text
updated_at DEFAULT CURRENT_TIMESTAMP
```

but changing a row does not automatically update that database column.

Some JPA entities have `@PreUpdate`; others rely on application behavior.

So database-level timestamp semantics are inconsistent.

---

### 66. No explicit cascade/orphan policy for every domain relationship

Some deletes are handled with database `ON DELETE CASCADE`, while others rely on JPA relationship behavior.

This can create surprises when deleting:

* users
* farmers
* buyers
* produce
* requirements
* trades

especially once historical financial records exist.

---

# 🟡 Frontend disconnected behavior

### 67. Quick produce form can report success on a 400/401/403

This is stronger than merely “payload mismatch.”

The exact flow is:

```text
fetch()
if res.ok → update result
regardless of res.ok → "Produce listing published"
```

So a failed listing is explicitly reported as successful.

---

### 68. Quick requirement form does the same

It calls `fetch()` and completely ignores the HTTP response.

Then immediately says:

> Procurement order published

This means the UI can knowingly announce a failed backend transaction as completed.

---

### 69. Quick input procurement isn't a transaction at all

The button:

```text
Procurement confirmed
```

only computes:

```text
unitPrice × quantity
```

and closes the modal.

No order is persisted.

---

### 70. Community module isn't a marketplace-backed feature

Posts and replies are React state.

Therefore:

```text
User A posts
↓
refresh
↓
post disappears
```

and another browser doesn't receive it.

---

### 71. Shop orders are a second commerce system

The frontend maintains:

```text
userOrders
shopInventory
shopOffers
```

locally, while the backend has:

```text
TradeDeal
EscrowPayment
```

There isn't a clear relation between the two.

This is likely to become a serious architectural dead end because the UI has two definitions of “order/trade.”

---

### 72. Notification history begins from hardcoded sample notifications

The frontend initializes notifications with demo records before loading real server notifications.

So even a brand-new account can show notifications belonging to nobody.

---

### 73. Notification read state isn't saved

You already identified the local-only behavior, but the consequence is important:

A user can mark everything read, navigate away, reload, and the backend still considers them unread.

---

### 74. Profile values are not restored into the UI from backend state

The frontend has `GET` support indirectly, but the startup/session lifecycle does not establish:

```text authenticated user → canonical farmer/buyer profile → UI profile state → map state
```

That is the central reason your location bug propagates into multiple modules.

---

# 🟡 Deployment/reproducibility

### 75. README claims a passing build state that the supplied archive cannot reproduce

`README.md` says:

> Backend: 18/18 integration tests passing

and:

> Frontend: Vite build passing in 303ms with 0 errors

But the archive currently contains:

* platform-specific `node_modules`
* incorrect executable permissions
* Java version mismatch with the project declaration
* Maven wrapper needing unavailable network access

Also, I counted **20 `@Test` annotations**, not 18.

So the README is stale/inconsistent with the supplied project state.

---

### 76. Dependency artifacts should not be part of the project archive

The archive contains:

```text
frontend/node_modules
backend/target
frontend/dist
source .class
```

This is not just cleanliness.

It caused the scan environment to load incompatible native binaries and made the project less reproducible.

---

### 77. `.class` file exists inside Java source

Specifically:

```text
src/main/java/.../ProfitCalculator.class
```

That is generated output sitting inside the source tree.

It can be loaded/copied unexpectedly depending on tooling and should be removed.

---

# 🟢 Test-suite problems

This deserves its own category because the tests are currently **helping preserve some of the vulnerabilities**.

### 78. The SMS security test uses a phone number unrelated to the registered farmer

The test registers:

```text
SMS Farmer
```

but then accepts the deal with:

```text
+91-9876543210
```

instead of checking the farmer's actual stored phone.

That test therefore actively validates the insecure behavior.

---

### 79. Escrow tests don't test wrong-party release

The suite proves:

```text Buyer → release → succeeds
```

but doesn't prove:

```text Farmer → release → denied
```

or:

```text random authenticated user → release → denied
```

---

### 80. No partial-deposit test

There is no test asserting:

```text
deal total = ₹18,000
deposit = ₹1
```

must fail.

This would have caught the escrow bug immediately.

---

### 81. No dispute-freeze test

There is no test:

```text
raise dispute
↓
attempt release
↓
must fail
```

which is precisely how the current vulnerability survives.

---

### 82. No cross-account diagnostic test

The tests fetch a report using its rightful farmer.

There is no test:

```text
Farmer B requests Farmer A's report
→ 403
```

---

### 83. No cross-account recommendation test

No test verifies:

```text Farmer B cannot request Farmer A's produce recommendations
```

---

### 84. No cross-account WebSocket test

There is no STOMP authorization test proving:

```text User 1 cannot subscribe to User 2 topic
```

---

### 85. No malformed-coordinate test

There is no test for:

```text latitude = 500
longitude = -999
```

nor:

```text null coordinates
```

resulting in a safe "location unavailable" state.

---

### 86. No schema-validation startup test against PostgreSQL

The tests run against the test configuration, so the:

```text explanation ↔ reason
```

migration mismatch can escape the test suite.

A real PostgreSQL migration/startup test should be part of CI.

---

# One important correction to the earlier scan

After going through the code more closely, I would **upgrade the location issue from “several bugs” to an architectural issue**:

The project currently has no canonical concept of:

```text
User Location
```

Instead, it has:

```text
Farmer.latitude/longitude
Buyer.latitude/longitude
BuyerRequirement.location
TradeDeal.deliveryAddress
FarmerProduce → no location
mapCoords → frontend-only
weather query → frontend state
market origin → frontend state
```

That is why simply fixing the Ranchi default will **not** solve the problem.

A proper design needs a clear hierarchy, for example:

```text
Account/Profile Location
        ↓
Listing Origin Snapshot
        ↓
Requirement Delivery Location
        ↓
Trade Contract Delivery Location
```

with explicit rules for which location is used by:

```text
recommendation
transport
weather
market radar
map
delivery
analytics
```

---

# Highest-risk issues after the continuation

The ones I would put at the very top of the engineering backlog are:

**1. Escrow can be falsely funded with an arbitrary amount.**

**2. Escrow can be released by the wrong party and from DISPUTED state.**

**3. Fake UTR/UPI settlement is presented as real payment.**

**4. Trade state is client-controlled and insufficiently constrained.**

**5. Produce isn't reserved, so the same inventory can be sold repeatedly.**

**6. SMS acceptance isn't bound to the farmer/buyer phone identity.**

**7. WebSocket user channels aren't authenticated.**

**8. Recommendation APIs don't enforce farmer ownership.**

**9. Diagnostic reports have IDOR access.**

**10. Location is fragmented and missing locations are interpreted as valid locations.**

**11. Prediction combines prices from different markets into one series.**

**12. Frontend has a fake-auth fallback that hides actual authentication failures.**

**13. Frontend-only commerce/notification/community features are disconnected from the backend.**

**14. PostgreSQL schema contains the `reason`/`explanation` mismatch.**

**15. The Docker production configuration contains hardcoded secrets/passwords and a CORS/deployment mismatch.**

There are now enough findings that I would consider this a **full security/integrity audit pass**, rather than just a bug list. The next logical step is to turn these into a **severity-ranked master bug register with file + function + exact fix + dependency order**, so fixes don't introduce new inconsistencies.
