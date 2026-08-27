# KisanLink (????? ????) — Agricultural Commerce & Direct Market Linkage Platform

> **Direct Farmer-to-Buyer Marketplace & Real-Time Price Discovery Platform**  
> *Smart India Hackathon (SIH26132) — Transforming Rural Agricultural Trade with Dynamic Matching, Digital Escrow, AI Price Intelligence, and Offline SMS Gateway.*

---

## ?? Platform Overview

KisanLink bridges the gap between rural farmers and commercial buyers (wholesalers, processors, exporters, and retailers) by eliminating exploitative middlemen, offering transparent mandi price discovery, predictive statistical forecasting, GPS-enabled freight routing, digital escrow with simulated UPI settlement, and an offline SMS/WhatsApp field dispatch gateway.

`
                    +------------------------+
                    ¦      Rural Farmer      ¦
                    ¦  (Web / Field SMS/WA)  ¦
                    +------------------------+
                                ¦
                                ?
 +--------------------------------------------------------------+
 ¦                    KisanLink Core Engine                     ¦
 ¦  +--------------------------------------------------------+  ¦
 ¦  ¦ Price Discovery ¦ Multi-Factor Match¦ Statistical AI   ¦  ¦
 ¦  ¦ & Mandi Radar   ¦ Engine (Net Return¦ Price Forecast   ¦  ¦
 ¦  +--------------------------------------------------------+  ¦
 ¦  +--------------------------------------------------------+  ¦
 ¦  ¦ Digital Escrow  ¦ Agro-Climatic     ¦ Real-Time STOMP  ¦  ¦
 ¦  ¦ & UPI Milestone ¦ Weather Advisory  ¦ WebSockets Push  ¦  ¦
 ¦  +--------------------------------------------------------+  ¦
 +--------------------------------------------------------------+
                                ¦
                                ?
                    +------------------------+
                    ¦    Verified Buyer      ¦
                    ¦ (Wholesaler/Processor) ¦
                    +------------------------+
`

---

## ??? Architecture & Tech Stack

| Tier | Technologies & Frameworks |
|---|---|
| **Backend** | Java 25, Spring Boot 4.1.1, Spring Data JPA, Hibernate 7, Spring Security (JWT + RBAC), Flyway DB Migrations, STOMP WebSockets |
| **Frontend** | React 19, Vite, Vanilla CSS Design System (DM Mono + Manrope typography, agronomic minimalist theme) |
| **Database** | PostgreSQL 16 (Production) / H2 in-memory (Local dev & automated tests) |
| **DevOps** | Multi-container Docker Compose staging stack (docker-compose.yml, Spring Boot Dockerfile, Nginx React SPA) |
| **Security** | BCrypt password hashing, stateless JWT authentication, Resource Ownership Service, HMAC Webhook validation |

---

## ?? Key Functional Modules

### 1. ?? Mandi Radar & Real-Time Price Discovery
- Live 7-day modal price discovery across 6 regional Jharkhand APMC mandis and wholesale centers (Ranchi, Jamshedpur, Dhanbad, Hazaribagh, Ramgarh, Bokaro).
- Interactive SVG Mandi Radar displaying geodesic distance rings (30km, 75km, 120km+), travel time estimation, and Google Maps direct routing.

### 2. ?? Statistical Price Forecasting (AI Time-Series)
- Linear regression trend analysis with volatility estimation.
- Labeled confidence intervals: 80% Core Band, 90% Likely Range, and 95% Conservative Boundary.
- 7-day forward price trajectories with market sentiment indicators (Bullish / Steady / Bearish).

### 3. ?? Multi-Factor Recommendation & Negotiation Engine
- Multi-parameter matching computing **True Net Return**:  
  \text{Net Return} = \text{Offered Price} - \text{Freight Deductions} - \text{Quality Adjustment}
- Configurable scoring weights: Net Margin (40%), Unit Price (25%), Geodesic Proximity (20%), Buyer Trust (15%).
- Interactive bilateral negotiation thread supporting real-time counter-offers and terms updates.

### 4. ?? Digital Escrow & UPI Milestone Tracking
- Simulated digital escrow flow ensuring payment security before harvest transit:
  Initiated &rarr; Buyer UPI Deposit & Lock &rarr; Held in Vault &rarr; In-Transit Verification &rarr; Payout Release to Farmer UPI.
- Automated settlement UTR generation (NPCI/UPI/KL/...) and dispute logging.

### 5. ?? Field Dispatch Gateway (SMS & WhatsApp Simulation)
- Offline field alerts for rural farmers without active 4G data connections.
- Headless inbound webhook (POST /api/notifications/sms-whatsapp/webhook): Farmers can confirm deals offline by simply replying ACCEPT <tradeId> via SMS.

### 6. ??? Agro-Climatic Weather & Spoilage Advisory
- GPS-localized microclimate metrics (temperature, humidity, precipitation, wind speed).
- Harvest timing window recommendations and perishable transit spoilage risk indices.

---

## ??? Security Hardening & Audit Resolutions

In response to the comprehensive security review, the following audit items have been resolved:

| Item | Problem Description | Resolution Implemented |
|---|---|---|
| **1. Frontend Bug** | loadMarketPrices() undefined call in WebSocket callback | Replaced with reactive loadPriceData(selectedPulseCropId) |
| **2. Notification Authorization** | Direct /user/{id} allowed ID snooping | Added GET /api/notifications/me and enforced strict owner/admin checks |
| **3. Webhook Authentication** | /webhook allowed unverified requests | Implemented configurable X-Webhook-Secret verification (kisanlink.webhook.secret) |
| **4. Frontend API URL** | Hardcoded http://localhost:8080 | Updated to import.meta.env.VITE_API_URL || 'http://localhost:8080' |
| **5. Simulation Clarity** | Escrow & SMS simulation presentation | UI clearly demarcates simulation gateways and NPCI mock settlement identifiers |

---

## ?? Testing & Verification

### Running Automated Integration Tests (Backend)
`powershell
cd kisanlink-backend
.\mvnw.cmd test -Dtest=KisanLinkIntegrationTests
`
**Test Results**: **18/18 tests passed (0 failures, 0 errors)**  
Covers: Auth, RBAC, Produce Listing, Buyer Requirements, Recommendations, Ownership Security, Price Prediction, Trade Deal Lifecycle, Counter-Offers, Analytics, Escrow Milestones, and Webhook dispatch.

### Building & Running the Frontend
`powershell
cd frontend
npm.cmd install
npm.cmd run build
npm.cmd run dev
`

### Running with Docker Compose (Full Staging Stack)
`ash
docker-compose up --build
`
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

---

## ??? Phased Production Roadmap

### Phase 1: Security & Core Reliability (Completed)
- [x] Fix WebSocket frontend callback bug
- [x] Secure Notification endpoints with authenticated user scoping (/me)
- [x] Implement Webhook secret validation
- [x] Configurable Vite environment variables for API routing

### Phase 2: Marketplace Completion (Next)
- [ ] Two-sided Buyer &rarr; Farmer search and direct discovery
- [ ] Farmer & Buyer Trust Scores with verified delivery histories
- [ ] Post-transaction star ratings and reviews

### Phase 3: Live Provider Integrations
- [ ] Integration with real SMS/WhatsApp providers (Twilio / Gupshup / MSG91 / Meta Cloud API)
- [ ] Integration with authorized Escrow / UPI payment gateway (Razorpay / Cashfree / ICICI EAZYPAY)
- [ ] GPS-based driver location and transit telematics

### Phase 4: AI & Farmer Experience
- [ ] AI "Sell Now vs Wait" decision engine accounting for storage cost and spoilage risk
- [ ] Regional language UI (Hindi, Santhali, Bengali)
- [ ] Voice input & IVR for hands-free crop listing
- [ ] Offline-first PWA caching for zero-connectivity mandi browsing
