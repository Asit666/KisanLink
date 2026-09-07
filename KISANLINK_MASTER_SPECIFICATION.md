# KisanLink: Master Problem, Solution, Architecture & Technical Specification

---

## 1. Executive Summary & Core Problem Statement (SIH26132)

### 1.1 The Agricultural Market Challenge
Smallholder and commercial farmers across India face systemic structural disadvantages in agricultural marketing, pricing, logistics, and trade execution:

1. **Information Asymmetry**: Farmers often possess no visibility into spot prices beyond their immediate local village trader or nearest mandi.
2. **Hidden Logistics & Intermediary Deductions**: A buyer located in an urban market may offer a higher nominal price, but unexpected freight fees, loading charges, transit delays, and storage overhead can reduce the farmer's take-home profit below that of a local sale.
3. **Counterparty Default & Payment Delays**: Farmers frequently experience delayed settlements, non-payment, or arbitrary post-delivery price reductions when dealing with unverified buyers.
4. **Perishability & Post-Harvest Spoilage**: Highly perishable crops (tomatoes, leafy vegetables, fruits) suffer rapid value degradation when transportation is unavailable or delayed.
5. **Quality Grading & Quantity Disputes**: Disagreements over crop moisture, grade specifications, or scale weights at the destination often lead to unverified deductions without an audit trail.
6. **Smallholder Fragmentation**: Individual farmers producing small lots (50 kg to 200 kg) lack the scale to access institutional buyers directly.
7. **Role Conflation**: Existing platforms often mix farmer, buyer, and transporter functions, allowing unauthorized role switching, unverified carrier rates, and weak authorization boundaries.

### 1.2 The KisanLink Mission
KisanLink is an integrated agricultural market linkage, decision-support, and trade execution platform. It unifies:
- **Price Intelligence & Decision Support**: Combining mandi feeds, predictive trends, and localized net return calculations.
- **Smart Net Profit Optimization**: Calculating actual take-home revenue (`Net Return = Offer - Freight - Storage - Fees`) to pair the best buyer and transporter combination.
- **Private Trade Negotiation & Interactive Offer Cards**: Direct farmer-to-buyer negotiation with instant legally binding contract generation.
- **Role-Separated Logistics & Fleet Hub**: Dedicated transporter accounts, multi-vehicle fleet registries, transparent pricing (`base + km * rate`), crop perishability priority scoring, dynamic transit ETA, and favorite carrier bookmarking.
- **Proof-of-Action Escrow & Dispute Resolution**: 4-digit Proof of Pickup (POP) and Proof of Delivery (POD) codes, cargo discrepancy tracking, and formal escrow arbitration.
- **Agronomy & Crop Health AI**: Computer vision diagnostics for crop disease identification and localized treatment recommendations.

---

## 2. Platform Personas, Roles & Access Control

Role security is enforced at both backend API boundaries (Spring Security RBAC) and database foreign-key constraints. Role switching via normal profile editing is strictly prohibited.

```text
                               ┌─────────────────────────┐
                               │       USER ROOT         │
                               └────────────┬────────────┘
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           │                                │                                │
           ▼                                ▼                                ▼
  ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
  │  ROLE_FARMER    │              │   ROLE_BUYER    │              │ ROLE_TRANSPORTER│
  ├─────────────────┤              ├─────────────────┤              ├─────────────────┤
  │ - Produce Lots  │              │ - Requirements  │              │ - Fleet Registry│
  │ - Discovery     │              │ - Discovery     │              │ - Haul Requests │
  │ - Trade Chats   │              │ - Escrow Deposit│              │ - Active Trips  │
  │ - Book Carrier  │              │ - POD Code      │              │ - Verification  │
  │ - POP Code      │              │ - Carrier Rating│              │ - Earnings      │
  │ - Crop Doctor   │              │ - Dispute File  │              │ - Reliability   │
  └─────────────────┘              └─────────────────┘              └─────────────────┘
```

### 2.1 Role Capabilities & Security Rules
- **Farmer (`ROLE_FARMER`)**: Can create and manage crop listings, discover market prices, request buyer matches, initiate private trade chats, issue structured trade offers, select/book carriers, view 4-digit Proof of Pickup (POP) codes, rate carriers, and file trade disputes. Cannot access transporter dashboards or deposit buyer escrow.
- **Buyer (`ROLE_BUYER`)**: Can create purchase requirements, browse farmer lots, negotiate via chat, fund escrow accounts for accepted deals, view 4-digit Proof of Delivery (POD) codes, confirm delivered quantities, and file disputes. Cannot access transporter fleet settings or list farm produce.
- **Transporter (`ROLE_TRANSPORTER`)**: Dedicated account type. Can configure fleet vehicles, set base charges and per-km freight rates, manage availability, review incoming haul requests, accept/reject dispatches, execute POP verification at the farm, execute POD verification at delivery, and track lifetime earnings. Cannot list crops or place purchase offers.
- **Administrator (`ROLE_ADMIN`)**: Manages master crop lists, verifies transporter operators, monitors market feeds, and reviews arbitration disputes.

---

## 3. Core Subsystems & Technical Architecture

### 3.1 Smart Market Intelligence & Price Discovery
- **Data Ingestion**: Integrates authorized market datasets and official mandi APIs, tracking price per quintal/kg alongside data source provenance and timestamps.
- **Trend Forecasting**: Employs historical time-series analysis (seasonality, arrivals, historical volatility) to predict short-term directional price trends (upward, downward, stable).
- **Decision Support**: Predictions are explicitly labeled as advisory tools with confidence scores, historical ranges, and market uncertainty flags.

### 3.2 Smart Net Profit Optimizer & Best Deal Recommendation
The core differentiator of KisanLink is evaluating the entire transaction route rather than comparing nominal buyer bids in isolation.

$$\text{Net Return} = \text{Buyer Gross Price} - \text{Logistics Freight Cost} - \text{Storage Overhead} - \text{Platform Service Fee}$$

#### Decision Matrix Example:
- **Local Trader Offer**: ₹2,500/quintal. Distance: 5 km. Transport: ₹50. Net Return: **₹2,450/quintal**.
- **Distant Processor Offer**: ₹2,700/quintal. Distance: 120 km. Transport: ₹320. Net Return: **₹2,380/quintal**.
- **Recommendation Engine Output**: The platform highlights the local buyer because the net profit is ₹70/quintal higher despite the lower nominal bid.

### 3.3 Private Trade Negotiation & Interactive Offer Cards
- **Direct Real-Time Chat**: Web-based private chat between the farmer and buyer linked directly to the specific produce lot or requirement.
- **Structured Offer Cards**: Enables either party to generate interactive offer cards inside the chat with specified crop, quantity (kg), price per kg, and delivery terms.
- **One-Click Acceptance**: When the recipient accepts an offer card, the system automatically transitions the conversation into an official `TradeDeal` in `ACCEPTED` state, initializing the escrow account and unlocking transporter booking.

### 3.4 Financial Security & Escrow Protection Engine
- **Strict Deposit Validation**: Escrow deposits must strictly match the agreed trade total:
  $$\text{Deposit Amount} == \text{Trade Deal Total Amount}$$
  Negative deposits, zero deposits, and partial underpayments are rejected at the service layer.
- **Role-Garded Release**: Escrow release requires verified buyer delivery confirmation or successful completion of the Proof of Delivery (POD) verification workflow.
- **Dispute Locking**: If a dispute is raised, escrow funds transition to `DISPUTED` state and are strictly frozen from automated withdrawal until resolved by mutual consent or arbitration.
- **Transparent Fee Separation**: Landed purchase cost (produce + freight + platform fee) and fair transporter value are computed and displayed as separate, auditable line items.

### 3.5 Smart Logistics, Fleet Management & Route Optimization
- **Multi-Vehicle Fleet Registry**: Transporters can manage multiple fleet vehicles (Pickup, Tempo/LCV, Mini Truck, Full Truck, Refrigerated Van) with custom registration numbers, payload limits, base fees, and per-km rates.
- **Proximity & Capacity Matching**: When a trade is accepted, the system filters carriers stationed within operational radius whose payload capacity covers the required batch weight.
- **Proximity Categorization**:
  - `NEAR`: Stationed $\le 20\text{ km}$ from pickup farm.
  - `MODERATE`: Stationed $20\text{ km} - 50\text{ km}$ from farm.
  - `FAR`: Stationed $> 50\text{ km}$ from farm.
- **Crop Perishability Priority Scoring**:
  - High Perishability (`VEGETABLE`, `FRUIT`, `FLOWER`, `tomato`, `spinach`, `milk`, `berry`): Weights shortest ETA and driver reliability:
    $$\text{Score}_{\text{high}} = (0.35 \times \text{Prox}) + (0.35 \times \text{Rel}) + (0.20 \times \text{Price}) + (0.10 \times \text{Cap}) + \text{FavoriteBonus}$$
  - Low Perishability (`GRAIN`, `PULSE`, `OIL_SEED`): Prioritizes bulk transport economics:
    $$\text{Score}_{\text{low}} = (0.45 \times \text{Price}) + (0.20 \times \text{Cap}) + (0.20 \times \text{Prox}) + (0.15 \times \text{Rel}) + \text{FavoriteBonus}$$
- **Favorite Carriers Bookmark**: Farmers can bookmark trusted transporters, granting a 15% composite ranking boost and enabling 1-click repeat bookings.
- **Dynamic Transit ETA**: Real-time arrival and transit duration calculated from route distance and carrier speed profiles.

### 3.6 Proof of Pickup (POP) & Proof of Delivery (POD) Security
```text
[Farmer Farm]                                                         [Buyer Warehouse]
      │                                                                      │
      ├─ 1. Carrier arrives at farm                                         │
      ├─ 2. Farmer inspects vehicle & loads produce                          │
      ├─ 3. Farmer shares 4-digit POP Code (e.g. 4821)                      │
      ├─ 4. Driver enters POP Code + loaded kg in Transporter Hub            │
      │                                                                      │
      ▼                                                                      ▼
 [Status: IN_TRANSIT] ──────────────────────────────────────────────► [Status: DELIVERED]
                                                                             │
                                           5. Carrier arrives at destination ┤
                                           6. Buyer inspects & weighs cargo   ┤
                                           7. Buyer shares 4-digit POD Code  ┤
                                           8. Driver enters POD Code + kg     ┤
                                           9. System audits weight delta      ┤
                                          10. Escrow payout unlocked ─────────┘
```

### 3.7 Trade & Logistics Dispute Resolution
- **Categorized Dispute Filing**: Farmers and buyers can file formal disputes under categories:
  - `QUANTITY_DISCREPANCY`: Transit loss or scale mismatch.
  - `DAMAGED_CARGO`: Produce spoilage or rough transit damage.
  - `TRANSIT_DELAY`: Carrier no-show or severe delay.
  - `PAYMENT_ISSUE`: Escrow calculation disagreement.
- **Arbitration Desk**: Captures claim amount (INR), photo/scale evidence, POP/POD audit logs, and freezes escrow release until formal resolution.

### 3.8 Transporter Reliability Scoring Engine
Transporter performance is tracked dynamically across completed trips:
- **Composite Score Formula**:
  $$\text{Reliability} = (0.40 \times \text{RatingNormalized}) + (0.40 \times \text{OnTimeRate}) + (0.20 \times \text{TripVolumeScore})$$
- **Tier Badges**:
  - `ELITE_CARRIER`: Reliability $\ge 95.0$, $\ge 20$ completed trips.
  - `TOP_CARRIER`: Reliability $90.0 - 94.9$.
  - `VERIFIED_CARRIER`: Verified operator in good standing.

### 3.9 Crop Doctor AI & Computer Vision Diagnostics
- **Client-Side WASM Image Preprocessing**: High-resolution camera photos are resized, compressed to WebP, and stripped of metadata directly in the browser to minimize mobile data usage.
- **Diagnostic Vision Pipeline**: Analyzes leaf lesions and crop symptoms using convolutional vision models to identify disease class, confidence percentage, organic remedies, and chemical treatment guidelines.

---

## 4. Comprehensive Audit of Fixed Vulnerabilities & Architectural Rules

| Category | Problem Identified | Architectural Fix Implemented |
| :--- | :--- | :--- |
| **Escrow Security** | Arbitrary or negative deposits accepted (`amount <= 0` allowed). | Added `@Positive` validation; enforced `depositAmount == totalAmount`. |
| **Escrow Security** | Any party (farmer or buyer) could release escrow. | Restricted release authorization strictly to the verified buyer or completed POD workflow. |
| **Escrow Security** | Escrow funds could be released while in `DISPUTED` state. | Blocked release transition from `DISPUTED`; requires explicit resolution. |
| **Escrow Security** | Escrow account could be created for unaccepted trades. | Enforced `trade.status == ACCEPTED` precondition before escrow creation. |
| **State Machine** | Arbitrary trade status jumps allowed (e.g. `PROPOSED -> COMPLETED`). | Implemented strict state machine transition validation in `TradeDealService`. |
| **Logistics** | Negative transport costs accepted from clients. | Enforced `@Positive` on freight fees; verified calculated distance matrices. |
| **Data Integrity** | Trade quantity could exceed available lot or requirement quantity. | Added cross-entity validation checking `quantity <= availableQuantity`. |
| **Data Integrity** | Farmer/Buyer profile update erased null location coordinates. | Converted profile updates to merge non-null fields preserving coordinates. |
| **Authorization** | Diagnostic reports were accessible across different users (IDOR). | Added user ownership checks to report access and escalation endpoints. |
| **Role Separation** | Farmers/buyers could access transporter hub or change roles. | Enforced `hasRole('TRANSPORTER')` across all transporter endpoints; fixed roles. |
| **Fleet Management** | Transporter could only have a single vehicle. | Created `transporter_vehicles` table and multi-vehicle management APIs. |
| **Audit Trails** | No verification mechanism for cargo pickup or delivery. | Implemented 4-digit POP and POD security codes with discrepancy weight tracking. |

---

## 5. Master Pitch & Domain Problem-Solution Reference (40 Direct Answers)

1. **Core Problem**: Farmers lack transparent, real-time knowledge of where, when, and to whom they can sell their produce to achieve the highest actual net profit.
2. **Coexistence with Local Traders**: The platform does not seek to eliminate local traders; it provides transparent price, freight, and reliability data so farmers can make informed comparative choices.
3. **Mandi Data Provenance**: Integrates authorized government market datasets and mandi APIs, displaying exact source attribution and update timestamps.
4. **Data Authenticity**: Prices are regularly refreshed and validated against regional historical ranges; data anomalies are flagged rather than displayed as misleading signals.
5. **Prediction Reality**: Price predictions are advisory decision-support tools presented with confidence intervals and historical context, leaving the final decision to the farmer.
6. **Buyer Ranking Criteria**: Ranks buyers using a multi-factor composite of offered price, quality specifications, lot quantity, distance, freight cost, payment reliability history, and verification status.
7. **Net Return Calculation**: High nominal prices with high transport costs are deprioritized in favor of options yielding maximum net realization:
   $$\text{Net Return} = \text{Buyer Price} - \text{Transport Cost} - \text{Storage Cost} - \text{Transaction Fees}$$
8. **Buyer Verification**: Validates business registration, identity documents, contact verification, and transaction history, complemented by a dynamic reliability score.
9. **Payment Default Protection**: Transactions use legally binding digital terms and escrow protection, tracking payment stages and triggering alerts for delays.
10. **Quality Disagreement Prevention**: Quality parameters and lot photos are recorded before dispatch; post-delivery mismatches are reviewed through structured dispute workflows.
11. **Standardized Grading**: Uses crop-specific parameter guidelines executed by authorized graders, FPOs, collection hubs, or digital assessment tools.
12. **Quantity Discrepancy Prevention**: Locked quantities are verified at dispatch (POP) and delivery (POD), with weight differentials recorded automatically.
13. **In-Transit Damage Accountability**: Terms establish transit responsibility, while digital POP and POD inspection notes identify where loss occurred.
14. **Logistics Coordination**: Connects farmers with verified local transport operators based on payload capacity, base location proximity, and per-km pricing.
15. **Storage Viability**: Displays nearby verified storage facilities and costs; if storage is uneconomical, prioritizes immediate-delivery buyers.
16. **Smallholder Support**: Aggregates 50 kg to 100 kg smallholder harvests through FPOs and collection centers into commercial-grade lots.
17. **Farmer Income Realization**: Increases income by eliminating information asymmetry, providing competing buyer options, and optimizing net logistics costs.
18. **Distance vs. Return**: Models net realization after freight so farmers do not accept distant bids that erode actual profits.
19. **Immediate Cash Flow Needs**: Offers immediate-sale discovery alongside future-window recommendations, enabling farmers to prioritize rapid settlement when needed.
20. **Farmer Trust**: Built through transparency, verified buyer profiles, auditable escrow terms, and deployment through trusted local FPOs.
21. **Usability & Assisted Access**: Provides clean regional language interfaces, assisted access via FPO coordinators, and SMS/IVR fallback capabilities.
22. **Regional Language Support**: Core screens, trade cards, notifications, and dispute forms support regional Indian languages.
23. **Low-Connectivity Resilience**: Features client-side caching, SMS transactional updates, and asynchronous synchronization upon reconnection.
24. **AI Role**: AI identifies localized seasonal patterns and price trends, while standard rule-based logic handles deterministic calculations.
25. **AI Prediction Target**: Forecasts short-term directional trends (rising, falling, stable) to determine optimal sale windows.
26. **AI Training Inputs**: Historical mandi prices, arrival volumes, seasonal cycles, crop varieties, demand trends, and localized weather factors.
27. **AI Uncertainty Communication**: Evaluates models via historical MAE/RMSE and conveys confidence probability rather than guaranteed prices.
28. **Weather Shocks & Model Adaptation**: Dynamically updates as new arrivals occur, lowering prediction confidence and flagging high market uncertainty during extreme weather.
29. **FPO Role**: Serves as the local coordination layer: aggregating smallholder yields, validating quality, and negotiating bulk sales.
30. **Buyer Value Proposition**: Provides predictable access to structured crop volumes, verified seller groups, consistent quality grading, and transparent audit logs.
31. **Buyer Sourcing Efficiency**: Eliminates fragmented farm-by-farm outreach by matching buyers with aggregated lots meeting exact specifications.
32. **Capacity Mismatch Handling**: Pools compatible farm yields to fulfill large orders, displaying verified available volume without false commitments.
33. **Lot Aggregation Tracking**: FPO hubs record each farmer's individual weight and grade contribution while generating a unified commercial batch for the buyer.
34. **Transaction Audit Logging**: Stores lot parameters, counterparty profiles, agreed rates, timestamps, POP/POD records, escrow milestones, and dispute notes.
35. **Dispute Resolution**: Evidence-backed arbitration holding escrow funds until quantity/quality mismatches are resolved.
36. **Monetization Model**: Core discovery is accessible to farmers; revenue derives from transaction fees and enterprise procurement tools for buyers and logistics providers.
37. **Platform Economics**: Transaction-based fee on successful settlements plus optional premium services (logistics coordination, cold-chain analytics).
38. **On-Platform Retention**: Kept on-platform by verified counterparty protection, binding digital contracts, formal escrow security, and integrated transport.
39. **Market Differentiation**: Bridges the gap between price information and actual transaction execution by integrating intelligence, matching, logistics, and escrow.
40. **Implementation Roadmap**: Launch a regional pilot across 3-4 key crops with local FPOs, verified commercial buyers, and logistics fleets before scaling across states.

---

## 6. End-to-End Workflow Diagram

```text
========================================================================================
                          KISANLINK END-TO-END TRANSACTION WORKFLOW
========================================================================================

  FARMER                                   BUYER                             TRANSPORTER
    │                                        │                                    │
 1. List Crop Produce                        │                                    │
    │                                        │                                    │
 2. View Market Intelligence                 │                                    │
    & Price Forecasts                        │                                    │
    │                                        │                                    │
    ├─────────────────── 3. Private Trade Chat & Negotiation ────────────────────┤
    │                                        │                                    │
 4. Issue / Receive Trade Offer Card         │                                    │
    │                                        │                                    │
 5. ACCEPT OFFER CARD ───────────────────────┤                                    │
    │                                        │                                    │
    ▼                                        ▼                                    │
 [TradeDeal: ACCEPTED]                  [Escrow Created]                          │
    │                                        │                                    │
    │                                    6. FUND ESCROW (Exact Amount)            │
    │                                        │                                    │
    ▼                                        ▼                                    │
 7. FIND TRANSPORTER                   [Escrow: FUNDED]                           │
    (Sorted by Perishability,                │                                    │
     Proximity, Reliability, ETA)            │                                    │
    │                                        │                                    │
 8. Book Carrier ────────────────────────────┼───────────────────────────────► 9. Transporter
    │                                        │                                    Accepts Haul
    │                                        │                                    │
10. Transporter Dispatched to Farm           │                                    ▼
    │                                        │                           [Booking: CONFIRMED]
    ▼                                        │                                    │
11. Produce Inspected & Loaded               │                                    │
12. Share 4-Digit POP Code ──────────────────┼──────────────────────────────► 13. Verify POP Code
    │                                        │                                    + Loaded Kg
    ▼                                        │                                    │
 [Status: IN_TRANSIT] ───────────────────────┼────────────────────────────────────┤
 (Live Milestones Tracker)                   │                                    │
    │                                        │                                    │
    ▼                                        ▼                                    ▼
14. Carrier Arrives at Buyer Destination ────┤                                    │
    │                                        │                                    │
    │                                    15. Inspect & Weigh Cargo                │
    │                                    16. Share 4-Digit POD Code ────────► 17. Verify POD Code
    │                                        │                                    + Delivered Kg
    │                                        ▼                                    │
    │                                   [Status: DELIVERED]                       │
    ▼                                        │                                    ▼
18. Rate Carrier Performance                 │                           19. Freight Payout Released
    │                                        │                                    │
    ▼                                        ▼                                    ▼
20. ESCROW RELEASED TO FARMER ───────────────┴────────────────────────────────────┤
    │                                                                             │
    ▼                                                                             ▼
 [Trade Deal: COMPLETED]                                                 [Trip Logged in History]
========================================================================================
```

---

## 7. Database Migration & Entity Map

```text
V1__schema.sql                     Core user, farmer, buyer tables
V2__regional_data.sql              States, districts, mandis master data
V3__seed_data.sql                  Initial baseline commodities and markets
V4__market_prices.sql              Historical & spot mandi pricing records
V5__produce_and_requirements.sql   FarmerProduce and BuyerRequirement tables
V6__trade_deals.sql                TradeDeal, TradeOffer, contracts
V7__escrow_payments.sql            EscrowPayment state machine & ledger
V8__diagnostic_reports.sql         Crop Doctor diagnostic reports & advice
V9__transporters.sql               Transporters & transport_bookings tables
V10__transport_pricing.sql         Per-km rates, base charges, route distances
V11__chat_system.sql               ChatConversation & ChatMessage tables
V12__proof_of_pickup_and_delivery.sql POP/POD codes, verified kg, discrepancy
V13__transporter_reliability.sql   Reliability score, on-time rate, tier badges
V14__favorite_transporters.sql     FarmerFavoriteTransporter bookmark table
V15__transporter_vehicles_and_disputes.sql Multi-vehicle fleet & TradeDispute tables
```

---

## 8. REST API Endpoint Specification

### 8.1 Authentication & Profile Management
- `POST /api/auth/register`: Register new user (`ROLE_FARMER`, `ROLE_BUYER`, `ROLE_TRANSPORTER`).
- `POST /api/auth/login`: Authenticate and receive JWT token.
- `GET /api/farmers/me`: Retrieve authenticated farmer profile.
- `PUT /api/farmers/me`: Update farmer profile and location coordinates.
- `GET /api/buyers/me`: Retrieve authenticated buyer profile.
- `PUT /api/buyers/me`: Update buyer profile and location coordinates.

### 8.2 Market Intelligence & Predictions
- `GET /api/crops`: List all supported crop commodities and categories.
- `GET /api/markets`: List mandis filtered by district/state.
- `GET /api/prices/spot`: Get real-time spot prices for a crop and mandi.
- `GET /api/prices/historical`: Get historical price time-series.
- `GET /api/predictions/trend`: Get AI directional trend and confidence score.

### 8.3 Produce & Requirement Listings
- `GET /api/farmers/produce`: List authenticated farmer's active produce lots.
- `POST /api/farmers/produce`: Publish a new produce lot.
- `GET /api/buyers/requirements`: List authenticated buyer's requirements.
- `POST /api/buyers/requirements`: Publish a new crop requirement.

### 8.4 Smart Recommendation & Trade Deals
- `POST /api/trades/recommendations`: Calculate net profit across buyer-transporter pairs.
- `GET /api/trades/deals`: List active and past trade deals for the user.
- `GET /api/trades/deals/{id}`: Retrieve full trade deal status and audit trail.
- `POST /api/trades/disputes`: File a trade/logistics dispute.
- `GET /api/trades/{dealId}/disputes`: List disputes associated with a trade deal.

### 8.5 Private Chat & Interactive Offers
- `GET /api/chat/conversations`: List active chat conversations.
- `GET /api/chat/conversations/{id}/messages`: Retrieve conversation message history.
- `POST /api/chat/conversations/{id}/messages`: Send text message or offer card.
- `POST /api/chat/conversations/{id}/accept-offer`: Accept structured trade offer.

### 8.6 Escrow Payments
- `GET /api/escrow/deal/{dealId}`: Retrieve escrow balance and milestone status.
- `POST /api/escrow/deposit`: Buyer deposits exact trade funding.
- `POST /api/escrow/release`: Buyer releases escrow upon verified delivery.

### 8.7 Transport & Fleet Management
- `GET /api/transport/suggestions`: Query carrier options filtered by proximity, capacity, and perishability.
- `POST /api/transport/bookings`: Farmer dispatches haul booking to carrier.
- `GET /api/transport/bookings/deal/{dealId}`: Retrieve booking status, POP/POD codes, and ETA.
- `POST /api/transport/bookings/{id}/confirm`: Transporter accepts haul request.
- `POST /api/transport/bookings/{id}/verify-pickup`: Transporter submits POP code and loaded kg.
- `POST /api/transport/bookings/{id}/verify-delivery`: Transporter submits POD code and delivered kg.
- `GET /api/transport/favorites`: List farmer's bookmarked favorite carriers.
- `POST /api/transport/favorites/{transporterId}`: Toggle favorite carrier bookmark.
- `POST /api/transport/transporters/{id}/rate`: Submit rating and review for carrier.
- `GET /api/transporters/me/vehicles`: Transporter lists fleet vehicles.
- `POST /api/transporters/me/vehicles`: Transporter registers new vehicle to fleet.
- `PUT /api/transporters/me/vehicles/{id}`: Update vehicle status or pricing rates.
- `DELETE /api/transporters/me/vehicles/{id}`: Remove vehicle from fleet.

### 8.8 Crop Doctor AI
- `POST /api/diagnostics/analyze`: Submit leaf image for disease diagnosis and treatment recommendations.
- `GET /api/diagnostics/history`: Retrieve past diagnostic reports for the farmer.

---

## 9. Technology Stack Summary

| Layer | Component | Technologies |
| :--- | :--- | :--- |
| **Frontend** | Single Page Web App | React 19, Vite, Vanilla CSS Design System, Lucide Icons, Canvas Charts |
| **Backend Core** | Enterprise REST & WebSocket | Java 21, Spring Boot 3.x, Spring Data JPA, Hibernate, Spring Security, JWT |
| **AI Microservice** | Computer Vision & Forecasting | Python 3.11+, PyTorch, FastAPI, OpenCV, Uvicorn |
| **Database** | Relational Database & Migrations | PostgreSQL / H2 Dev, Flyway Migrations (V1 to V15) |
| **Security** | Authorization & Cryptography | BCrypt, JWT Stateless Auth, Role-Based Access Control (RBAC) |
| **Real-Time** | Live Messaging & Event Broker | STOMP over WebSocket, SockJS |
