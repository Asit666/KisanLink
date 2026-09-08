# KisanLink Production-Ready Master Checklist

## Goal

Treat KisanLink as a **production-hardening program**, not a
feature-development project.

"Perfect" software does not really exist. The practical target is
**production-ready, secure, auditable, observable, recoverable,
scalable, and trustworthy**.

------------------------------------------------------------------------

# 🔴 Phase 0 --- Stop-the-line issues

Do these before deploying KisanLink to real users, real money, or real
agricultural decision-making.

## 0.1 Escrow must become a real payment system

The current escrow implementation should not be treated as a real
payment system until it is backed by an actual payment provider and
verified server-side.

### Fix

-   [ ] Integrate an actual payment provider.
-   [ ] Create a `PaymentIntent`.
-   [ ] Never trust a client-provided payment reference as proof of
    payment.
-   [ ] Verify payment server-to-server.
-   [ ] Use provider webhooks.
-   [ ] Verify webhook signatures.
-   [ ] Add webhook replay protection.
-   [ ] Store provider transaction ID.
-   [ ] Store payment status.
-   [ ] Store payment timestamps.
-   [ ] Store settlement transaction ID.
-   [ ] Implement refunds.
-   [ ] Implement partial refunds if required.
-   [ ] Implement failed payments.
-   [ ] Implement payment retries.
-   [ ] Implement reconciliation.
-   [ ] Implement payment-provider outage handling.
-   [ ] Implement idempotency keys.
-   [ ] Never manufacture a "successful" UTR internally.
-   [ ] Never tell a farmer money was credited until the provider
    confirms it.

### Recommended model

``` text
Trade
  ↓
PaymentIntent
  ↓
Payment Provider
  ↓
Webhook
  ↓
Verified Payment
  ↓
Escrow Ledger
  ↓
Delivery
  ↓
Settlement
  ↓
Farmer Payout
```

Until this exists, label the existing feature **Simulated Escrow**, not
real escrow.

------------------------------------------------------------------------

# 🔴 1. Fix trade lifecycle and authorization

The trade lifecycle needs explicit actor permissions tied to each
business action.

## Replace generic status changes

Instead of:

``` text
PATCH /trades/{id}/status
```

use commands such as:

``` text
POST /trades/{id}/accept
POST /trades/{id}/counter-offer
POST /trades/{id}/cancel
POST /trades/{id}/dispatch
POST /trades/{id}/mark-in-transit
POST /trades/{id}/confirm-delivery
POST /trades/{id}/complete
POST /trades/{id}/dispute
```

### Define exactly who can do what

  Action                     Farmer           Buyer   Transporter              Admin
  ----------------- --------------- --------------- ------------- ------------------
  Create proposal                ✅              ✅            ❌         controlled
  Counter offer                  ✅              ✅            ❌                 ❌
  Accept               counterparty    counterparty            ❌         controlled
  Cancel              defined rules   defined rules            ❌     override/audit
  Dispatch                       ✅              ❌            ❌                 ❌
  Mark pickup                    ❌              ❌            ✅         controlled
  Mark delivered       confirmation    confirmation       request         controlled
  Release payment                ❌              ❌            ❌   settlement rules
  Dispute                        ✅              ✅         maybe            resolve

Do not let a participant simply choose an arbitrary valid-looking
status.

------------------------------------------------------------------------

# 🔴 2. Fix inventory concurrency

This is critical.

The current pattern of reading reserved quantity and then comparing it
before creating a deal can allow two concurrent requests to reserve more
produce than is available.

### Current conceptual problem

``` text
500 kg available

Request A → sees 0 reserved → reserves 400
Request B → sees 0 reserved → reserves 300

Result → 700 kg committed
```

### Fix

Introduce:

``` text
available_quantity
reserved_quantity
sold_quantity
```

and atomically reserve stock.

For example:

``` sql
UPDATE farmer_produce
SET reserved_quantity = reserved_quantity + :quantity
WHERE id = :produce_id
AND available_quantity - reserved_quantity >= :quantity;
```

Then require:

``` text
updated rows == 1
```

Otherwise:

``` text
409 INSUFFICIENT_AVAILABLE_QUANTITY
```

### Also implement

-   [ ] Reservation expiry.
-   [ ] Cancellation releases reservation.
-   [ ] Accepted trade consumes reservation.
-   [ ] Failed trade releases reservation.
-   [ ] Completed trade converts reservation to sold quantity.
-   [ ] Dispute freezes relevant quantity.
-   [ ] Inventory transaction history.
-   [ ] Concurrency tests.
-   [ ] Database constraints.

------------------------------------------------------------------------

# 🔴 3. Make AI diagnosis actually AI

The AI service should not silently fall back to deterministic image
heuristics and present the result as a reliable diagnosis.

### Fix

Production should have:

``` text
Image
 ↓
Quality check
 ↓
Crop detection
 ↓
Disease model
 ↓
Confidence calibration
 ↓
OOD detection
 ↓
Decision
```

Possible outputs:

``` text
DIAGNOSED
LOW_CONFIDENCE
UNKNOWN
INVALID_IMAGE
NEEDS_EXPERT_REVIEW
```

### Never do this in production

``` text
fallback heuristic
→ confidence 96%
→ disease treatment
```

If the model is unavailable:

``` text
503 AI_MODEL_UNAVAILABLE
```

or a clearly marked non-diagnostic response.

------------------------------------------------------------------------

# 🔴 4. Connect the backend to the AI service

The browser should not directly communicate with the internal AI
service.

Change:

``` text
React
 ├── Spring Boot
 └── FastAPI
```

to:

``` text
React
   ↓
Spring Boot
   ↓
FastAPI
   ↓
Model
```

### Benefits

-   Authentication.
-   Authorization.
-   Centralized rate limiting.
-   Logging.
-   Request IDs.
-   Audit trail.
-   Image validation.
-   Consistent error handling.
-   Model version tracking.

The AI service should ideally be private and reachable only by the
backend.

------------------------------------------------------------------------

# 🔴 5. Fix AI `/predict-url` SSRF

If the AI service accepts arbitrary URLs and downloads them server-side,
this must be hardened.

### Implement

-   [ ] HTTPS/HTTP allowlist.
-   [ ] Reject localhost.
-   [ ] Reject `127.0.0.0/8`.
-   [ ] Reject IPv6 loopback.
-   [ ] Reject private networks.
-   [ ] Reject link-local addresses.
-   [ ] Reject cloud metadata addresses.
-   [ ] DNS resolution validation.
-   [ ] Re-check every redirect.
-   [ ] Redirect limit.
-   [ ] Maximum download size.
-   [ ] Connection timeout.
-   [ ] Read timeout.
-   [ ] Image MIME validation.
-   [ ] Actual image decoding validation.
-   [ ] Outbound proxy if possible.

### Best option

Do not accept arbitrary remote URLs at all.

Have the backend accept an uploaded image and store it in controlled
object storage.

------------------------------------------------------------------------

# 🔴 6. Fix AI CORS

Do not use unrestricted CORS such as:

``` text
allow_origins=["*"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

Change to explicit production origins:

``` text
https://kisanlink.example
```

and only allow the required methods and headers.

Better still, after putting AI behind Spring Boot:

**remove public access to the AI service entirely.**

------------------------------------------------------------------------

# 🔴 7. Add upload protection

For every image endpoint:

-   [ ] Maximum request body.
-   [ ] Maximum file size.
-   [ ] Maximum pixel dimensions.
-   [ ] Allowed image types.
-   [ ] Reject malformed images.
-   [ ] Reject decompression bombs.
-   [ ] Strip unnecessary metadata.
-   [ ] Malware scanning where appropriate.
-   [ ] Store images outside application filesystem.
-   [ ] Object-storage lifecycle policy.

Never blindly read entire user-controlled files into memory.

------------------------------------------------------------------------

# 🔴 8. Remove production secrets from Docker defaults

Do not ship production with default PostgreSQL credentials or a default
JWT secret.

### Production

``` yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?required}
JWT_SECRET: ${JWT_SECRET:?required}
```

No default.

Also:

-   [ ] Rotate existing secrets.
-   [ ] Check Git history for secrets.
-   [ ] Enable secret scanning.
-   [ ] Use cloud secret manager.
-   [ ] Separate dev/staging/prod secrets.
-   [ ] Document rotation procedure.

------------------------------------------------------------------------

# 🔴 9. Do not expose PostgreSQL publicly

Production should normally keep PostgreSQL on the private network.

``` text
Internet
   ↓
Load Balancer
   ↓
Frontend/API
   ↓
Private network
   ↓
PostgreSQL
```

No public database port.

------------------------------------------------------------------------

# 🔴 10. Authenticate notification webhooks

A notification webhook may be public only because an external provider
needs to call it.

Implement:

-   [ ] Signature validation.
-   [ ] Timestamp validation.
-   [ ] Replay protection.
-   [ ] Provider message ID.
-   [ ] Idempotent processing.
-   [ ] Payload schema validation.
-   [ ] Rate limiting.
-   [ ] Audit logging.

------------------------------------------------------------------------

# 🟠 Phase 1 --- Security hardening

## 11. Authentication

-   [ ] Strong password policy.
-   [ ] Password reset.
-   [ ] Email/phone verification.
-   [ ] Login rate limiting.
-   [ ] Brute-force protection.
-   [ ] Account lockout/risk controls.
-   [ ] Session management.
-   [ ] Short-lived access tokens.
-   [ ] Refresh tokens.
-   [ ] Refresh-token rotation.
-   [ ] Token revocation.
-   [ ] Logout invalidation.
-   [ ] JWT `issuer` validation.
-   [ ] JWT `audience` validation.
-   [ ] JWT `jti`.
-   [ ] Key rotation.
-   [ ] Security audit logs.

------------------------------------------------------------------------

# 12. Authorization

Perform an endpoint-by-endpoint authorization audit.

For every endpoint, answer:

``` text
Who can call it?
Which resource can they access?
Which fields can they change?
Can they access another user's ID?
Can they perform this action in the current state?
```

Test:

``` text
Farmer A → Farmer B's produce
Farmer A → Buyer B's requirement
Buyer A → Buyer B's trade
Buyer A → Farmer B's escrow
Transporter A → Transporter B's booking
User A → User B's chat
User A → User B's notifications
```

All must fail.

------------------------------------------------------------------------

# 13. CORS

Configure one centralized CORS policy.

``` text
production origins only
required methods only
required headers only
credentials only when required
```

Do not use wildcard origins.

------------------------------------------------------------------------

# 14. CSRF

If the application uses stateless bearer authentication, disabling CSRF
can be appropriate.

If cookie-based refresh tokens are introduced, reassess CSRF protection
for those endpoints.

------------------------------------------------------------------------

# 15. Security headers

Add:

-   [ ] CSP.
-   [ ] HSTS.
-   [ ] `X-Content-Type-Options`.
-   [ ] `Referrer-Policy`.
-   [ ] `Permissions-Policy`.
-   [ ] Clickjacking protection.
-   [ ] Secure cookie configuration if cookies are introduced.

------------------------------------------------------------------------

# 16. Rate limiting

Protect:

``` text
/login
/register
/password-reset
/diagnostics
/predictions
/recommendations
/chat
/payment
/webhooks
```

Use per-user + per-IP + endpoint-specific limits.

AI endpoints especially need aggressive protection because inference is
computationally expensive.

------------------------------------------------------------------------

# 17. Input validation

Every request DTO should validate:

``` text
quantity > 0
price > 0
distance >= 0
transport cost >= 0
deposit >= 0
payout >= 0
strings max length
phone format
email format
coordinates valid
dates valid
IDs valid
```

Do not rely exclusively on frontend validation.

------------------------------------------------------------------------

# 18. SQL/data validation

Move critical business invariants into PostgreSQL as well.

Examples:

``` text
quantity > 0
price >= 0
transport_cost >= 0
deposit >= 0
payout >= 0
```

and add unique constraints where needed.

------------------------------------------------------------------------

# 🟠 Phase 2 --- Make commerce mathematically correct

## 19. Create a proper order/trade aggregate

Recommended:

``` text
Trade
 ├── TradeTerms
 ├── Negotiations
 ├── InventoryReservation
 ├── TransportBooking
 ├── PaymentIntent
 ├── Escrow
 ├── Dispute
 ├── Delivery
 └── Settlement
```

The trade becomes the central business object.

------------------------------------------------------------------------

# 20. Immutable accepted terms

During negotiation, price, quantity and totals can change.

After acceptance:

**freeze the commercial contract.**

Store:

``` text
accepted_price
accepted_quantity
accepted_transport_cost
accepted_platform_fee
accepted_total
accepted_net_return
accepted_at
accepted_by
terms_version
```

Any subsequent amendment should create a new version.

------------------------------------------------------------------------

# 21. Money calculations

Centralize all money calculations:

``` text
gross amount
transport
platform fee
tax
discount
farmer payout
buyer payable
```

Use `BigDecimal` everywhere.

Never use floating-point money.

Also establish:

``` text
currency = INR
scale = 2
rounding mode = HALF_UP
```

or the exact business policy you choose.

------------------------------------------------------------------------

# 22. Ledger

Do not treat an escrow row as the entire financial accounting system.

Add:

``` text
PaymentTransaction
LedgerAccount
LedgerEntry
Settlement
Refund
Adjustment
```

Every money movement should produce an immutable ledger event.

Example:

``` text
Buyer payment
      - ₹50,000

Escrow liability
      + ₹50,000

Escrow release
      - ₹50,000

Farmer payable
      + ₹49,500
```

Every rupee should be explainable.

------------------------------------------------------------------------

# 23. Idempotency

For all state-changing operations:

``` text
POST payment
POST payout
POST trade acceptance
POST booking
POST dispute
POST notification
POST webhook
```

support:

``` text
Idempotency-Key
```

Repeated requests must not duplicate the operation.

------------------------------------------------------------------------

# 24. Audit trail

Create immutable audit events:

``` text
USER_REGISTERED
TRADE_CREATED
OFFER_CREATED
TRADE_ACCEPTED
INVENTORY_RESERVED
PAYMENT_INITIATED
PAYMENT_VERIFIED
ESCROW_FUNDED
DISPATCHED
DELIVERED
DISPUTE_OPENED
DISPUTE_RESOLVED
PAYOUT_INITIATED
PAYOUT_COMPLETED
```

Each event should contain:

``` text
actor
timestamp
IP/device where appropriate
request ID
resource ID
before
after
```

------------------------------------------------------------------------

# 🟠 Phase 3 --- Fix inventory and logistics

## 25. Inventory lifecycle

Implement:

``` text
LISTED
RESERVED
CONFIRMED
DISPATCHED
DELIVERED
SOLD
CANCELLED
EXPIRED
```

Track quantities independently.

------------------------------------------------------------------------

# 26. Reservation expiration

Example:

``` text
buyer reserves 400kg
↓
doesn't pay
↓
reservation expires
↓
400kg becomes available again
```

Use scheduled jobs.

------------------------------------------------------------------------

# 27. Transport booking state machine

Define:

``` text
REQUESTED
ACCEPTED
DRIVER_ASSIGNED
VEHICLE_ASSIGNED
PICKUP_PENDING
PICKED_UP
IN_TRANSIT
DELIVERED
CANCELLED
FAILED
```

Each transition needs actor authorization.

------------------------------------------------------------------------

# 28. Transporter verification

Before a transporter can accept real jobs:

-   [ ] Identity verification.
-   [ ] Phone verification.
-   [ ] Vehicle verification.
-   [ ] Registration document.
-   [ ] Insurance where applicable.
-   [ ] License where applicable.
-   [ ] Capacity verification.
-   [ ] Service area.
-   [ ] Availability.
-   [ ] Account status.
-   [ ] Suspension mechanism.

------------------------------------------------------------------------

# 29. Route calculations

Do not select a transporter only based on capacity.

Consider:

``` text
pickup location
delivery location
vehicle capacity
vehicle type
availability
route distance
ETA
cost
service area
rating
```

------------------------------------------------------------------------

# 🟠 Phase 4 --- AI productionization

## 30. Model artifact management

Create a model manifest:

``` json
{
  "model": "crop-doctor",
  "version": "1.0.0",
  "sha256": "...",
  "classes_version": "...",
  "training_dataset": "...",
  "framework": "...",
  "created_at": "...",
  "status": "production"
}
```

------------------------------------------------------------------------

# 31. Reproducible training

Record:

-   [ ] Dataset version.
-   [ ] Dataset hash.
-   [ ] Train/validation/test split.
-   [ ] Random seed.
-   [ ] Python version.
-   [ ] PyTorch version.
-   [ ] torchvision version.
-   [ ] Preprocessing.
-   [ ] Augmentation.
-   [ ] Hyperparameters.
-   [ ] Checkpoint hash.

------------------------------------------------------------------------

# 32. Real-world evaluation

Build a separate field dataset containing:

``` text
real farmer photos
different phones
different lighting
different backgrounds
different disease stages
healthy leaves
multiple cultivars
different regions
blurred photos
partial leaves
non-leaf images
wrong crops
unknown diseases
```

Measure:

``` text
accuracy
macro F1
precision
recall
per-class recall
confusion matrix
AUROC where meaningful
calibration
OOD rejection
```

------------------------------------------------------------------------

# 33. Calibration

Confidence needs to be statistically calibrated.

Implement a validated calibration method such as temperature scaling
where appropriate.

Then verify that confidence values have the intended interpretation on a
held-out dataset.

------------------------------------------------------------------------

# 34. Unknown detection

The system needs:

``` text
"I don't know."
```

That is a feature, not a failure.

Implement:

``` text
known disease
known healthy
unknown
low quality
wrong crop
needs expert
```

------------------------------------------------------------------------

# 35. Crop mismatch protection

If a user says:

``` text
Rice
```

and the model sees a tomato disease class:

**do not rewrite the result as Rice.**

Instead:

``` text
crop mismatch → uncertain
```

Make crop validation an explicit layer.

------------------------------------------------------------------------

# 36. Treatment safety

Production requirements:

-   [ ] Verify recommendations against authoritative agricultural
    guidance.
-   [ ] Region-specific regulations.
-   [ ] Crop-specific label requirements.
-   [ ] Dosage validation.
-   [ ] Unit validation.
-   [ ] Pre-harvest interval information where applicable.
-   [ ] Safety warnings.
-   [ ] PPE guidance.
-   [ ] Never recommend prohibited products.
-   [ ] Do not present diagnosis as definitive.
-   [ ] Expert escalation.
-   [ ] Emergency/high-severity warning.

The model should assist---not independently make unsafe pesticide
decisions.

------------------------------------------------------------------------

# 🟠 Phase 5 --- Price prediction

## 37. Rename "confidence"

If the prediction service uses a heuristic reliability score rather than
a statistically calibrated probability, call it:

``` text
forecast reliability
```

unless statistical calibration has been established.

------------------------------------------------------------------------

# 38. Backtesting

For every crop/market:

``` text
train on historical period
predict future period
compare prediction with actual
```

Track:

``` text
MAE
RMSE
sMAPE
bias
interval coverage
```

------------------------------------------------------------------------

# 39. Baseline models

Compare against:

``` text
last value
seasonal naive
moving average
linear regression
ETS
ARIMA
ML model
```

Only deploy a complex model if it beats the baseline consistently.

------------------------------------------------------------------------

# 40. Data provenance

Every market price should have:

``` text
source
source timestamp
market
crop
grade
variety
min price
modal price
max price
unit
data collection timestamp
```

Never represent stale data as real-time.

------------------------------------------------------------------------

# 41. Price-data validation

Reject:

``` text
negative prices
impossible values
wrong units
duplicate records
future dates
invalid markets
unknown crops
```

Add database uniqueness for the intended market/crop/date granularity.

------------------------------------------------------------------------

# 🟠 Phase 6 --- Frontend architecture

The frontend should be decomposed into maintainable feature modules
rather than keeping a very large monolithic `App.jsx`.

## 42. Split `App.jsx`

Target:

``` text
App.jsx
< 300–500 lines
```

Move functionality into:

``` text
features/
  auth/
  marketplace/
  produce/
  buyer/
  trade/
  escrow/
  diagnostics/
  transport/
  chat/
  weather/
  analytics/
  notifications/
```

------------------------------------------------------------------------

# 43. Central API client

Create:

``` text
src/api/client.js
```

Handle centrally:

``` text
base URL
Authorization
refresh
timeouts
errors
request IDs
JSON parsing
```

------------------------------------------------------------------------

# 44. Remove hard-coded business data

Move demo data into:

``` text
src/demo/
```

and enable it only with:

``` text
VITE_DEMO_MODE=true
```

Never silently switch to fake data because an API failed.

------------------------------------------------------------------------

# 45. Remove direct AI calls

Frontend:

``` text
POST /api/diagnostics
```

Backend:

``` text
AI service
```

------------------------------------------------------------------------

# 46. Token storage

Move away from long-lived tokens in `localStorage`.

Prefer:

``` text
short-lived access token
+
secure refresh mechanism
```

and carefully handle XSS/CSRF depending on the chosen implementation.

------------------------------------------------------------------------

# 47. Error UX

Create standard errors:

``` json
{
  "code": "TRADE_ALREADY_ACCEPTED",
  "message": "This trade has already been accepted.",
  "requestId": "req_..."
}
```

Frontend maps codes to friendly messages.

------------------------------------------------------------------------

# 48. Accessibility

Test:

-   [ ] Keyboard navigation.
-   [ ] Screen reader.
-   [ ] Color contrast.
-   [ ] Touch targets.
-   [ ] Form labels.
-   [ ] Error announcements.
-   [ ] Focus management.
-   [ ] Mobile viewport.
-   [ ] Low-bandwidth behavior.

For KisanLink, mobile and low-connectivity accessibility are
particularly important.

------------------------------------------------------------------------

# 🟠 Phase 7 --- WebSocket/real-time system

## 49. Authentication

-   [ ] Authenticate WebSocket connections.
-   [ ] Validate user identity server-side.
-   [ ] Authorize subscriptions.
-   [ ] Do not allow arbitrary topic subscriptions.

## 50. Reliability

-   [ ] Heartbeat.
-   [ ] Exponential reconnect.
-   [ ] Jitter.
-   [ ] Duplicate message handling.
-   [ ] Message IDs.
-   [ ] Ordering where required.
-   [ ] Offline recovery.

## 51. Notification source of truth

Database:

``` text
authoritative
```

WebSocket:

``` text
delivery optimization
```

If a WebSocket message is missed, the user should still see it after
reconnecting.

------------------------------------------------------------------------

# 🟠 Phase 8 --- Chat

## 52. Chat authorization

For every message:

``` text
sender is participant
conversation exists
conversation is active
recipient is participant
```

Never trust a conversation ID supplied by the client.

------------------------------------------------------------------------

# 53. Chat security

-   [ ] Message length limits.
-   [ ] Rate limits.
-   [ ] Spam protection.
-   [ ] Block user.
-   [ ] Report user.
-   [ ] Abuse moderation.
-   [ ] Attachment validation.
-   [ ] Malware scanning.
-   [ ] PII protection.
-   [ ] Message retention policy.

------------------------------------------------------------------------

# 🟠 Phase 9 --- SMS / WhatsApp

## 54. Create provider abstraction

``` text
NotificationProvider
├── SmsProvider
├── WhatsAppProvider
└── MockNotificationProvider
```

## 55. Track real delivery states

``` text
QUEUED
SENT
DELIVERED
READ
FAILED
REJECTED
```

Do not mark a message `DELIVERED` just because the application generated
it.

------------------------------------------------------------------------

# 🟠 Phase 10 --- Database

## 56. Constraints

Add database-level constraints for:

``` text
positive quantity
valid prices
valid money
valid statuses
unique email
unique provider transaction ID
unique payment intent
unique idempotency key
```

------------------------------------------------------------------------

# 57. Indexes

Audit every:

``` text
WHERE
JOIN
ORDER BY
GROUP BY
```

and create indexes based on actual query patterns.

Especially:

``` text
trade(farmer_id, status)
trade(buyer_id, status)
produce(farmer_id, status)
prices(crop_id, market_id, date)
notifications(user_id, created_at)
chat_messages(conversation_id, created_at)
payments(trade_id)
```

------------------------------------------------------------------------

# 58. Pagination

Every large collection must paginate:

``` text
trades
messages
notifications
price history
recommendations
transactions
produce
```

Do not load entire histories into memory.

------------------------------------------------------------------------

# 59. Database transactions

Review every multi-step operation.

For example:

``` text
accept trade
+ reserve inventory
+ create escrow
+ notification
```

must have clearly defined transactional boundaries.

Do not send external SMS, payment, WebSocket, or similar operations
inside the same DB transaction and assume rollback will undo them.

Use an outbox/event pattern.

------------------------------------------------------------------------

# 🟠 Phase 11 --- Events and reliability

## 60. Transactional outbox

Instead of:

``` text
DB save
↓
send SMS
↓
send WebSocket
```

use:

``` text
DB transaction
 ├── business change
 └── outbox event

background worker
 ↓
SMS/WebSocket/provider
```

This prevents lost notifications.

------------------------------------------------------------------------

# 61. Background jobs

Create workers for:

``` text
expired reservations
payment reconciliation
notification delivery
weather refresh
price ingestion
prediction generation
stale trade cleanup
model monitoring
```

------------------------------------------------------------------------

# 62. Retry policy

Every external integration needs:

``` text
timeout
retry
backoff
jitter
maximum retries
dead-letter handling
```

Never retry infinitely.

------------------------------------------------------------------------

# 🟠 Phase 12 --- Observability

## 63. Structured logging

Every request:

``` text
request_id
trace_id
user_id where appropriate
endpoint
status
latency
error_code
```

Never log:

``` text
password
JWT
full UPI ID
payment credentials
private documents
sensitive PII
```

------------------------------------------------------------------------

# 64. Metrics

Track:

``` text
HTTP latency
5xx rate
4xx rate
DB latency
DB connections
AI latency
AI errors
AI confidence distribution
AI unknown rate
payment success rate
payment failure rate
trade conversion
trade cancellation
inventory conflicts
notification delivery
WebSocket connections
```

------------------------------------------------------------------------

# 65. Distributed tracing

Eventually:

``` text
Frontend
 ↓
Backend
 ↓
AI
 ↓
Database/external providers
```

should be traceable with one request/trace ID.

------------------------------------------------------------------------

# 66. Alerting

Create alerts for:

``` text
5xx spike
payment failure spike
AI failure
database unavailable
high latency
WebSocket failure
notification failure
inventory reservation conflict spike
```

------------------------------------------------------------------------

# 🟠 Phase 13 --- Health checks

Separate:

``` text
/liveness
/readiness
```

### Liveness

> Is the process alive?

### Readiness

> Can it actually serve requests?

Readiness can check:

``` text
database
required dependencies
```

Do not make liveness fail merely because PostgreSQL temporarily goes
down.

------------------------------------------------------------------------

# 🟠 Phase 14 --- Testing

Existing passing tests are encouraging, but they are not sufficient for
production confidence.

## 67. Unit tests

Target:

``` text
services
calculations
state machines
validators
scoring
prediction
```

------------------------------------------------------------------------

# 68. Authorization tests

This should be mandatory.

Create tests for:

``` text
A cannot access B's data
A cannot modify B's data
wrong role → 403
unauthenticated → 401
```

------------------------------------------------------------------------

# 69. Concurrency tests

Especially:

``` text
inventory
payment
trade acceptance
counter-offers
escrow release
webhooks
```

Run multiple requests simultaneously.

------------------------------------------------------------------------

# 70. Financial tests

Test:

``` text
₹0
negative
decimal
very large
rounding
transport > gross
partial payment
duplicate payment
duplicate webhook
duplicate payout
refund
```

------------------------------------------------------------------------

# 71. State-machine tests

Test **every valid and invalid transition**.

Example:

``` text
PROPOSED → ACCEPTED       valid
PROPOSED → COMPLETED      invalid
COMPLETED → ACCEPTED      invalid
CANCELLED → IN_TRANSIT    invalid
```

and actor permissions for each.

------------------------------------------------------------------------

# 72. AI tests

Test:

``` text
healthy image
known disease
wrong crop
unknown crop
blurred image
blank image
huge image
corrupt image
non-image
low confidence
model unavailable
```

------------------------------------------------------------------------

# 73. Integration tests

Use:

``` text
PostgreSQL
Redis if introduced
AI service
payment sandbox
SMS sandbox
```

rather than mocking everything.

------------------------------------------------------------------------

# 74. End-to-end tests

Automate the actual user journeys.

### Farmer

``` text
register
→ profile
→ list produce
→ receive buyer proposal
→ negotiate
→ accept
→ dispatch
→ delivery
→ receive payout
```

### Buyer

``` text
register
→ requirement
→ find produce
→ negotiate
→ accept
→ pay
→ track
→ confirm delivery
```

### Transporter

``` text
register
→ verification
→ vehicle
→ accept booking
→ pickup
→ transit
→ delivery
```

### Crop Doctor

``` text
upload
→ validate
→ AI inference
→ result
→ treatment
→ history
```

------------------------------------------------------------------------

# 🟡 Phase 15 --- API quality

## 75. OpenAPI

Document every API.

Include:

``` text
request
response
authentication
authorization
errors
examples
pagination
rate limits
```

------------------------------------------------------------------------

# 76. Version the API

Use:

``` text
/api/v1/...
```

rather than allowing the API to evolve without a compatibility strategy.

------------------------------------------------------------------------

# 77. Consistent errors

Use one format:

``` json
{
  "timestamp": "...",
  "status": 400,
  "code": "INVALID_QUANTITY",
  "message": "...",
  "requestId": "..."
}
```

------------------------------------------------------------------------

# 78. Never expose internal exceptions

Return:

``` text
Internal processing error.
Request ID: ...
```

while logging the actual exception internally.

------------------------------------------------------------------------

# 🟡 Phase 16 --- Privacy and data protection

KisanLink may handle:

``` text
names
phone numbers
addresses
UPI IDs
business information
farm information
images
agricultural data
transaction data
chat
```

Treat this as sensitive business/user data.

## 79. Data classification

Define:

``` text
PUBLIC
INTERNAL
CONFIDENTIAL
HIGHLY_SENSITIVE
```

------------------------------------------------------------------------

# 80. Minimize stored PII

Only store what is required.

Do not expose farmer phone/UPI information to buyers unless there is a
legitimate business reason.

------------------------------------------------------------------------

# 81. Encryption

-   [ ] HTTPS everywhere.
-   [ ] Database encryption at rest.
-   [ ] Encrypted object storage.
-   [ ] Secret manager.
-   [ ] Encrypted backups.
-   [ ] Key rotation.

------------------------------------------------------------------------

# 82. Data retention

Define retention for:

``` text
chat
diagnostic images
payment records
notifications
audit logs
account data
```

------------------------------------------------------------------------

# 83. Account deletion

Implement:

``` text
delete account
deactivate account
data export
data retention exceptions
```

Financial/audit records may need different retention treatment.

------------------------------------------------------------------------

# 🟡 Phase 17 --- Admin system

You need a real operational admin portal.

## 84. Admin dashboard

Show:

``` text
users
farmers
buyers
transporters
trades
payments
disputes
AI diagnostics
notifications
system health
```

------------------------------------------------------------------------

# 85. Admin actions

-   [ ] Suspend user.
-   [ ] Verify transporter.
-   [ ] Verify buyer.
-   [ ] Resolve dispute.
-   [ ] Refund payment.
-   [ ] Cancel trade.
-   [ ] Disable bad listing.
-   [ ] Investigate transaction.
-   [ ] Manage market data.
-   [ ] Manage crops.
-   [ ] Manage fees.

Every admin action must be audited.

------------------------------------------------------------------------

# 🟡 Phase 18 --- Marketplace

## 86. Produce listing

Add:

``` text
crop
variety
grade
quantity
unit
harvest date
expected availability
location
quality
images
price
minimum acceptable price
expiry
```

------------------------------------------------------------------------

# 87. Buyer requirements

Add:

``` text
quantity
crop
grade
delivery location
delivery deadline
budget
quality requirements
```

------------------------------------------------------------------------

# 88. Search

Production search should support:

``` text
crop
location
quantity
price
grade
date
buyer
distance
availability
```

Add database indexes/search engine when scale requires it.

------------------------------------------------------------------------

# 🟡 Phase 19 --- Recommendation engine

## 89. Make recommendation explainable

Instead of only:

``` text
Score: 89
```

show:

``` text
₹42,000 expected gross
- ₹3,000 transport
- ₹500 platform fee
--------------------
₹38,500 estimated farmer return

Why:
✓ higher net return
✓ nearby buyer
✓ reliable buyer
✓ matching quantity
```

------------------------------------------------------------------------

# 90. Version the scoring model

Store:

``` text
algorithm_version
weights_version
data_timestamp
```

with every recommendation.

------------------------------------------------------------------------

# 91. Never imply guaranteed price

Use distinct concepts:

``` text
estimated
```

for forecasts/recommendations,

``` text
committed
```

for quotes,

and:

``` text
contracted
```

for accepted trades.

Keep those concepts separate.

------------------------------------------------------------------------

# 🟡 Phase 20 --- Weather

## 92. Weather resilience

Implement:

``` text
API timeout
cache
fallback
stale-data indication
rate limit
provider monitoring
```

------------------------------------------------------------------------

# 93. Weather advisory provenance

Display:

``` text
Forecast source
Last updated
Forecast period
Confidence/limitations
```

Do not present generic weather data as a guaranteed agricultural
prediction.

------------------------------------------------------------------------

# 🟡 Phase 21 --- DevOps

## 94. CI pipeline

Every PR should run:

``` text
frontend install
frontend lint
frontend test
frontend build

backend compile
backend unit tests
backend integration tests

AI syntax/tests
AI model smoke test

security scan
secret scan
dependency scan
Docker build
```

------------------------------------------------------------------------

# 95. Branch protection

Require:

``` text
PR
review
CI green
no critical security findings
```

before merging into `main`.

------------------------------------------------------------------------

# 96. Environment separation

Create:

``` text
development
staging
production
```

Never use production credentials locally.

------------------------------------------------------------------------

# 97. Deployment strategy

Use:

``` text
staging
 ↓
automated tests
 ↓
approval
 ↓
production
```

Eventually:

``` text
blue/green
```

or:

``` text
canary deployment
```

for backend/AI.

------------------------------------------------------------------------

# 98. Rollbacks

Every deployment needs:

``` text
previous application image
database migration strategy
model rollback
configuration rollback
```

AI models especially need independent rollback.

------------------------------------------------------------------------

# 🟡 Phase 22 --- Docker/container security

For every container:

-   [ ] Non-root user.
-   [ ] Minimal base image.
-   [ ] Pinned versions.
-   [ ] Vulnerability scan.
-   [ ] Read-only filesystem where possible.
-   [ ] Dropped Linux capabilities.
-   [ ] `no-new-privileges`.
-   [ ] CPU limit.
-   [ ] Memory limit.
-   [ ] Healthcheck.
-   [ ] Graceful shutdown.

------------------------------------------------------------------------

# 🟡 Phase 23 --- Database reliability

## 99. Connection pool

Configure:

``` text
maximum pool
minimum idle
connection timeout
idle timeout
max lifetime
```

based on expected workload.

------------------------------------------------------------------------

# 100. Backups

Production:

``` text
daily full backup
continuous/WAL where appropriate
off-site copy
encrypted backup
retention policy
```

------------------------------------------------------------------------

# 101. Disaster recovery

Document:

``` text
RPO
RTO
restore process
database recovery
object storage recovery
secret recovery
DNS recovery
```

Actually test restoration.

A backup that has never been restored is not a proven backup.

------------------------------------------------------------------------

# 🟡 Phase 24 --- Performance

## 102. Backend

Profile:

``` text
DB queries
N+1 queries
serialization
large responses
external APIs
AI calls
```

------------------------------------------------------------------------

# 103. Frontend

Implement:

``` text
code splitting
lazy routes
image compression
responsive images
caching
request deduplication
loading states
error boundaries
```

------------------------------------------------------------------------

# 104. AI

Optimize:

``` text
model loading once
batching where useful
CPU/GPU selection
image preprocessing
request queue
timeouts
concurrency limits
```

Do not load the model for every request.

------------------------------------------------------------------------

# 🟡 Phase 25 --- Monitoring business correctness

Technical uptime is not enough.

Track:

``` text
farmer → listing conversion
listing → buyer match
match → trade
trade → accepted
accepted → paid
paid → dispatched
dispatched → delivered
delivered → settled
```

Also:

``` text
average farmer net return
average transport cost
payment success rate
dispute rate
cancellation rate
AI diagnosis acceptance rate
AI unknown rate
```

This is how you will know whether KisanLink actually works.

------------------------------------------------------------------------

# 🟡 Phase 26 --- AI monitoring after launch

Track:

``` text
prediction distribution
confidence distribution
unknown rate
crop distribution
disease distribution
model latency
error rate
drift
```

Create alerts if:

``` text
confidence suddenly increases
one class becomes dominant
unknown rate changes dramatically
input image distribution changes
```

That can indicate model/data problems.

------------------------------------------------------------------------

# 🟡 Phase 27 --- Legal/compliance

Before real launch, get professional review for:

-   [ ] Privacy policy.
-   [ ] Terms of service.
-   [ ] Marketplace terms.
-   [ ] Payment terms.
-   [ ] Refund policy.
-   [ ] Dispute policy.
-   [ ] Farmer consent.
-   [ ] Data processing.
-   [ ] AI disclaimer.
-   [ ] Agricultural advisory disclaimer.
-   [ ] Pesticide recommendation liability.
-   [ ] KYC requirements.
-   [ ] Payment-provider requirements.
-   [ ] Applicable Indian tax/GST obligations.
-   [ ] Applicable data-protection obligations.

Do not rely on application code alone for legal compliance.

------------------------------------------------------------------------

# 🟡 Phase 28 --- Documentation

Create:

``` text
README.md
docs/
├── architecture.md
├── setup.md
├── api.md
├── database.md
├── security.md
├── payments.md
├── escrow.md
├── ai.md
├── model-evaluation.md
├── notifications.md
├── deployment.md
├── monitoring.md
├── disaster-recovery.md
└── contributing.md
```

------------------------------------------------------------------------

# 🟡 Phase 29 --- Refactor frontend

Current frontend complexity should be reduced substantially.

Target:

``` text
App.jsx
< 300–500 lines
```

Move functionality into:

``` text
App
├── Auth
├── Farmer Dashboard
├── Buyer Dashboard
├── Transporter Dashboard
├── Marketplace
├── Produce
├── Requirements
├── Trades
├── Escrow
├── Diagnostics
├── Weather
├── Chat
├── Notifications
└── Admin
```

Each feature should own:

``` text
components
hooks
API calls
validation
tests
```

------------------------------------------------------------------------

# 🟡 Phase 30 --- Code quality

Add:

``` text
ESLint
Prettier
Java formatter
Checkstyle/Spotless
Python Ruff
Python formatting
Type checking
```

Enforce them in CI.

------------------------------------------------------------------------

# 🟡 Phase 31 --- Type safety

Frontend should eventually move from:

``` text
JavaScript
```

to:

``` text
TypeScript
```

especially because KisanLink has many API response shapes.

Generate TypeScript types from OpenAPI rather than maintaining them
manually.

------------------------------------------------------------------------

# 🟡 Phase 32 --- API contract testing

Ensure:

``` text
Frontend DTO
      =
OpenAPI contract
      =
Backend DTO
```

Run contract tests in CI.

------------------------------------------------------------------------

# 🟡 Phase 33 --- Security testing

Before launch:

``` text
SAST
DAST
dependency scan
container scan
secret scan
API fuzzing
OWASP API testing
SSRF testing
authorization testing
rate-limit testing
```

Then perform an independent penetration test.

------------------------------------------------------------------------

# 🟡 Phase 34 --- Load testing

Test realistic scenarios:

``` text
100 concurrent farmers
500 concurrent users
1,000 active trades
100 simultaneous AI requests
payment webhook bursts
notification bursts
WebSocket reconnect storms
```

Measure:

``` text
p50
p95
p99
error rate
CPU
memory
DB connections
```

------------------------------------------------------------------------

# 🟡 Phase 35 --- Production configuration

Create a production configuration checklist:

``` text
[ ] HTTPS
[ ] domain
[ ] TLS certificate
[ ] secrets
[ ] database
[ ] backups
[ ] object storage
[ ] payment provider
[ ] SMS provider
[ ] WhatsApp provider
[ ] weather provider
[ ] monitoring
[ ] alerting
[ ] logging
[ ] email
[ ] DNS
[ ] CDN
[ ] firewall
[ ] WAF
```

------------------------------------------------------------------------

# 🟢 Phase 36 --- Product polish

After all technical P0/P1 issues are resolved:

-   [ ] Multilingual UI.
-   [ ] Indian regional languages.
-   [ ] Voice assistance.
-   [ ] Low-bandwidth mode.
-   [ ] Offline draft support.
-   [ ] WhatsApp-first workflows.
-   [ ] SMS fallback.
-   [ ] Farmer-friendly error messages.
-   [ ] Large touch targets.
-   [ ] Simple navigation.
-   [ ] Accessible forms.
-   [ ] Onboarding.
-   [ ] Educational help.
-   [ ] Transaction receipts.
-   [ ] Downloadable invoices.
-   [ ] Trade documents.

------------------------------------------------------------------------

# 🟢 Phase 37 --- Farmer trust

Every important decision should answer:

> **Why should I trust this?**

## Price

``` text
₹2,450/quintal

Source: Mandi X
Updated: 15 min ago
```

## Recommendation

``` text
Recommended because:
• ₹3,200 higher estimated net return
• 18 km closer
• buyer reliability 4.7/5
```

## AI

``` text
Possible Rice Blast
Confidence: 87%

Image quality: Good

⚠ This is an AI-assisted assessment.
Consult a local agricultural expert before applying treatment.
```

## Escrow

``` text
Payment verified ✓

Provider transaction:
XXXXXX

Escrow status:
FUNDED
```

Never make the UI more certain than the underlying system.

------------------------------------------------------------------------

# 🟢 Phase 38 --- Separate "Demo" from "Production"

This is one of the strongest recommendations.

Create:

``` text
DEMO
```

and:

``` text
PRODUCTION
```

as explicitly different modes.

## Demo can contain

``` text
fake payments
fake SMS
fake recommendations
placeholder AI
demo accounts
seed data
```

## Production cannot contain

``` text
fake payment confirmation
fake UTR
fake delivery
fake AI confidence
fake SMS delivery
default secrets
```

This makes the product easier to demonstrate and much safer to operate.

------------------------------------------------------------------------

# Final target architecture

``` text
                         INTERNET
                            │
                     CDN / WAF / TLS
                            │
                 ┌──────────┴──────────┐
                 │                     │
              Frontend               API
                 │                     │
                 │                Spring Boot
                 │                     │
                 │       ┌─────────────┼─────────────┐
                 │       │             │             │
                 │    PostgreSQL     Redis       Object Storage
                 │       │
                 │       ├── Users
                 │       ├── Produce
                 │       ├── Buyers
                 │       ├── Trades
                 │       ├── Logistics
                 │       ├── Payments
                 │       ├── Escrow
                 │       ├── Disputes
                 │       └── Audit
                 │
                 ├───────────────┐
                 │               │
              WebSocket        AI Gateway
                                 │
                                 ▼
                            FastAPI AI
                                 │
                                 ▼
                         Versioned Model
                                 │
                         ┌───────┴────────┐
                         │                │
                     Diagnosis         Confidence
                         │                │
                         └───────┬────────┘
                                 │
                            AI Result
                                 │
                       ┌─────────┴─────────┐
                       │                   │
                  Expert Review        Farmer
```

And externally:

``` text
Spring Boot
   │
   ├── Payment Provider
   ├── SMS Provider
   ├── WhatsApp Provider
   ├── Weather Provider
   └── Market Data Provider
```

All external providers should sit behind interfaces/adapters.

------------------------------------------------------------------------

# Actual implementation order

Do not try to do all tasks simultaneously.

## Release 1 --- 🔴 Security & money

``` text
1. Remove secrets
2. Close public DB
3. Fix authentication
4. Fix authorization
5. Secure webhooks
6. Secure AI
7. Fix SSRF
8. Add upload limits
9. Disable fake production AI
10. Disable fake production payments
```

**Goal: nobody can compromise or fake the system.**

------------------------------------------------------------------------

## Release 2 --- 🔴 Transaction correctness

``` text
11. Inventory reservations
12. Trade state machine
13. Immutable accepted terms
14. Idempotency
15. Ledger
16. Payment intent
17. Payment verification
18. Refunds
19. Disputes
20. Settlement
```

**Goal: every trade and every rupee is correct.**

------------------------------------------------------------------------

## Release 3 --- 🟠 Real integrations

``` text
21. Payment provider
22. SMS
23. WhatsApp
24. Weather
25. Market price feeds
26. Object storage
27. Email
```

**Goal: remove simulations.**

------------------------------------------------------------------------

## Release 4 --- 🟠 AI

``` text
28. Production model
29. Model registry/versioning
30. Real-world dataset
31. Evaluation
32. Calibration
33. OOD detection
34. Unknown class
35. Expert escalation
36. Safe treatment recommendations
```

**Goal: AI is trustworthy rather than merely impressive.**

------------------------------------------------------------------------

## Release 5 --- 🟠 Architecture

``` text
37. Break App.jsx
38. API client
39. TypeScript
40. DTO boundaries
41. Repository optimization
42. Transactional outbox
43. Background workers
44. WebSocket hardening
```

**Goal: the codebase can grow without becoming unmaintainable.**

------------------------------------------------------------------------

## Release 6 --- 🟠 Testing

``` text
45. Unit tests
46. Authorization tests
47. Concurrency tests
48. Payment tests
49. State-machine tests
50. AI tests
51. Integration tests
52. E2E tests
53. Load tests
54. Security tests
```

**Goal: prove it works, rather than assuming it works.**

------------------------------------------------------------------------

## Release 7 --- 🟡 Production operations

``` text
55. CI/CD
56. Monitoring
57. Logging
58. Tracing
59. Alerts
60. Backups
61. Disaster recovery
62. Rollbacks
63. Incident response
64. Security response
```

**Goal: survive production.**

------------------------------------------------------------------------

## Release 8 --- 🟢 UX & scale

``` text
65. Mobile optimization
66. Accessibility
67. Regional languages
68. Low bandwidth
69. Offline support
70. Voice
71. Performance
72. Farmer trust UX
73. Admin tools
74. Analytics
```

**Goal: make it genuinely excellent.**

------------------------------------------------------------------------

# P0/P1/P2 master count

I'd roughly classify the work as:

### 🔴 P0 --- 10 major areas

These are blockers.

### 🟠 P1 --- \~45 areas

These are required for serious production quality.

### 🟡 P2 --- \~40 areas

These are important for robustness, maintainability and scale.

### 🟢 Post-launch excellence

UX, advanced analytics, optimization, additional integrations and
intelligence.

------------------------------------------------------------------------

# What not to do yet

Do not add more major features right now.

KisanLink already has a broad platform. The next development cycle
should focus on making the existing workflows reliable rather than
adding more features.

Avoid spending the next cycle on:

``` text
❌ another AI feature
❌ another marketplace feature
❌ another dashboard
❌ another recommendation algorithm
❌ another chatbot
```

Instead, make the existing path rock-solid:

``` text
Farmer
 ↓
Produce
 ↓
Buyer
 ↓
Recommendation
 ↓
Negotiation
 ↓
Trade
 ↓
Inventory reservation
 ↓
Payment
 ↓
Escrow
 ↓
Transport
 ↓
Delivery
 ↓
Settlement
 ↓
Audit
```

And separately:

``` text
Farmer
 ↓
Crop image
 ↓
AI
 ↓
Validated diagnosis
 ↓
Safe advisory
 ↓
Expert escalation
```

Those are the two core journeys KisanLink needs to make genuinely
production-grade.

------------------------------------------------------------------------

# Definition of DONE

Do not call KisanLink production-ready until all of these are true:

``` text
SECURITY
[ ] No default credentials
[ ] No exposed database
[ ] No unauthenticated sensitive endpoint
[ ] No SSRF
[ ] No unrestricted uploads
[ ] Authorization tests pass
[ ] Security audit passes

COMMERCE
[ ] Inventory cannot oversell
[ ] Trade transitions are actor-controlled
[ ] Accepted terms are immutable
[ ] Payments are real/verified
[ ] Escrow is real
[ ] Ledger reconciles
[ ] Payments are idempotent
[ ] Refunds work
[ ] Disputes work

AI
[ ] Production model exists
[ ] Model version is tracked
[ ] Class mapping is immutable
[ ] Real-world evaluation exists
[ ] Confidence is calibrated
[ ] Unknown detection works
[ ] Model failure is safe
[ ] Treatment guidance is reviewed

ENGINEERING
[ ] Frontend is modular
[ ] API is versioned
[ ] OpenAPI exists
[ ] Errors are standardized
[ ] Unit tests
[ ] Integration tests
[ ] E2E tests
[ ] Concurrency tests
[ ] Load tests
[ ] Security tests

OPERATIONS
[ ] CI/CD
[ ] Monitoring
[ ] Logs
[ ] Tracing
[ ] Alerts
[ ] Backups
[ ] Restore tested
[ ] Disaster recovery
[ ] Rollback tested

TRUST
[ ] Price provenance
[ ] Payment receipts
[ ] Trade receipts
[ ] Audit history
[ ] AI disclaimers
[ ] Data/privacy controls
[ ] Admin audit trail
```

------------------------------------------------------------------------

# Three most important architectural transformations

## 1. Turn KisanLink into a transactionally correct commerce platform

``` text
Trade + Inventory + Payment + Escrow + Logistics + Settlement
```

must behave as one reliable business workflow.

## 2. Turn Crop Doctor into a genuinely trustworthy AI system

``` text
Model → calibration → uncertainty → OOD → expert escalation
```

not:

``` text
Image → heuristic → 95% confidence
```

## 3. Separate production from demonstration

``` text
DEMO ≠ PRODUCTION
```

This makes the rest of the engineering much clearer and safer.

------------------------------------------------------------------------

# Bottom line

KisanLink has a useful foundation, but the path to production should be
**hardening first, features second**.

The immediate priority is to eliminate simulated/fake production
behavior, secure all boundaries, make trade/inventory/payment state
transitions transactionally correct, productionize the AI pipeline, and
establish testing/observability/disaster recovery.

The target is not simply "the app works."

The target is:

> **The app remains correct when users behave unexpectedly, requests
> arrive concurrently, external services fail, payments are duplicated,
> networks disconnect, models are uncertain, and production
> infrastructure has problems.**
