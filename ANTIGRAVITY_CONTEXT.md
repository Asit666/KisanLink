# KisanLink Project Handoff

## Instruction
Continue working in this existing project. Do not recreate the project, delete working code, or replace the current architecture. Inspect the current files before making changes and preserve existing user work.

## Project
KisanLink is a farmer market linkage and price discovery platform for SIH26132.

Workspace:
- Backend: `kisanlink-backend/`
- Frontend: `frontend/`
- Main requirements: `project.md`

## Current technology
- Backend: Java, Spring Boot 4.1.1, Spring Web MVC, Spring Data JPA, Hibernate ORM, Spring Security, JWT, Bean Validation, Maven.
- Frontend: React + Vite.
- Development database: H2 in-memory.
- Intended persistent database: PostgreSQL.
- Current machine compiler: Temurin Java 25.0.1. The Maven property is currently Java 25 because the available compiler does not support release 26.

## Completed backend work
- PostgreSQL, H2 dev, and H2 test configuration.
- Environment-based settings in `kisanlink-backend/src/main/resources/application.properties`.
- Explicit PostgreSQL profile in `application-postgres.properties`.
- Default dev profile using H2 in `application-dev.properties`.
- JWT dependencies in `pom.xml`.
- Entities for User, Farmer, Buyer, Crop, FarmerProduce, BuyerRequirement, Market, MarketPrice, Recommendation, PricePrediction, Notification.
- Role enum with FARMER, BUYER, ADMIN.
- Spring Security JWT authentication and role-based authorization.
- Registration and login APIs.
- Farmer produce and buyer requirement APIs.
- Farmer and buyer profile update APIs, including latitude and longitude.
- Market, market price, history, and trend APIs.
- Baseline price estimate API with an explicit estimate disclaimer.
- Notification read and mark-read APIs.
- Explainable recommendation engine using quality matching, quantity, distance, transport cost, gross revenue, net return, and score.
- CORS support for localhost ports 3000, 5173, 5174, and 5175.
- Development sample data: 10 crops across VEGETABLE, FRUIT, GRAIN, PULSE, OIL_SEED categories; Ranchi Main Mandi market; two Tomato modal prices.
- Root health endpoint: `GET /`.
- Password hashes excluded from JSON responses.
- Authentication response includes both `userId` and role-specific `profileId`.
- Secured Notification APIs: Added `GET /api/notifications/me` (authenticated principal scoping) and owner-verified `PATCH /api/notifications/{id}/read`.
- Hardened Inbound SMS/WhatsApp Webhook with configurable `X-Webhook-Secret` validation (`kisanlink.webhook.secret`).
- Fixed frontend WebSocket price-alert callback (replaced undefined `loadMarketPrices` with `loadPriceData(selectedPulseCropId)`).
- Frontend dynamic API configuration via `import.meta.env.VITE_API_URL` with fallback to `http://localhost:8080`.
- All 18 backend integration tests verified passing with 0 failures and 0 errors.

- `CropCategory` enum (VEGETABLE, FRUIT, GRAIN, PULSE, SEED, SPICE, OIL_SEED, FLOWER, OTHER) on the `Crop` entity.
- `GET /api/crops/categories` endpoint returns all valid category values for frontend dropdowns.
- `GET /api/crops?category=VEGETABLE` optional filter on the crops list endpoint.
- Flexible produce listing: farmers can set any custom product name and category (e.g. Fruits, Vegetables, Seeds), or select from existing crops.
- Produce image and description support: `FarmerProduce` and `ProduceRequest` support `imageUrl` and `description` when listing produce for selling.
- Dynamic crop resolution and auto-creation: both `FarmerService.addProduce` and `BuyerService.addRequirement` accept `cropId` or `cropName` + `category` with auto-creation of custom crop entities.
- Configurable transport rates (`base-charge`, `rate-per-km`, `max-distance-km`) and weighted multi-factor recommendation scoring (`RecommendationConfig`, `ScoringService`).
- Market Map and Nearby Mandis endpoint (`GET /api/markets/nearby`) with Haversine distance, freight calculation, travel duration estimation, compass direction, route summary, and Google Maps navigation URL.
- Statistical time-series price prediction with linear regression slope, residual volatility analysis, labeled confidence intervals (80% Core Band, 90% Likely Range, 95% Conservative Boundary), confidence score, volatility indicators, and 7-day future price trajectories (`PredictionService`, `PredictionController`).
- Complete Trade/Order flow and deal handshake lifecycle (`TradeDeal`, `TradeStatus`, `TradeDealRepository`, `TradeDealService`, `TradeDealController`) with formal statuses (`PROPOSED`, `NEGOTIATING`, `ACCEPTED`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`, `CANCELLED`), net return calculation, and ownership protection.
- Interactive Price Negotiation & Counter-Offer Engine (`TradeNegotiation`, `CounterOfferRequest`, `TradeNegotiationResponse`, `POST /api/trades/{tradeId}/negotiate`) with persistent back-and-forth negotiation thread history, live terms updates, and mutual accept/counter actions.
- Farmer Earnings & Realized Premium Analytics (`FarmerAnalyticsService`, `FarmerAnalyticsController`, `GET /api/analytics/farmer/{farmerId}`) computing lifetime take-home revenue, volume tonnage, average realized rate vs local mandi benchmark, KisanLink Premium Index (+X%), extra profit earned, and monthly progression breakdown.
- Formal Printable/Downloadable Trade Deal Contract Receipt & Invoice with QR verification hash, itemized rates, freight deductions, and `@media print` layout.
- Agro-Climatic & Weather Advisory Engine (`WeatherAdvisoryService`, `WeatherController`) providing GPS micro-climate forecasting (temperature, humidity, precipitation, wind), recommended harvest timing windows, produce spoilage risk indices, 5-day agro-weather forecasts, and tailored post-harvest guidelines.
- Network of 6 seeded regional markets across Jharkhand with varied market types (`MANDI`, `APMC`, `WHOLESALE`).
- SMS & WhatsApp Alert Notification & Webhook Engine (`SmsWhatsAppLog`, `MessageChannel`, `MessageStatus`, `SmsWhatsAppService`, `SmsWhatsAppController`, `POST /api/notifications/sms-whatsapp/**`) providing offline field SMS and official WhatsApp alerts for new buyer proposals, escrow vault guarantees, and instant payout UTR receipts, plus an inbound webhook enabling farmers to reply `ACCEPT <dealId>` via SMS to confirm deals headlessly.
- Digital Escrow & UPI Payment Milestone Tracking (`EscrowPayment`, `EscrowStatus`, `EscrowService`, `EscrowController`, `POST /api/escrow/**`) featuring simulated UPI gateway deposit & lock, verified funds held in escrow vault, 5-stage milestone tracking, and instant payout release with NPCI settlement UTR receipts.
- Live Real-Time WebSockets & Push Notifications via Spring Boot STOMP broker at `/ws` (`WebSocketConfig`, `NotificationWebSocketService`, `KisanLinkWebSocketClient`) broadcasting instant updates for trade lifecycle changes, matching buyer produce alerts, and mandi price movements.
- Production Database Migration Strategy using Flyway with standardized versioned scripts (`V1__initial_schema.sql`, `V2__seed_regional_data.sql`, `V3__trade_deals.sql`, `V4__escrow_payments.sql`, `V5__sms_whatsapp_logs.sql`) managing schema evolution, tables, constraints, and baseline regional seeding.
- Multi-container staging stack (`docker-compose.yml`) orchestrating local PostgreSQL 16 Alpine, containerized Spring Boot backend (`kisanlink-backend/Dockerfile`), and Nginx-powered React SPA frontend (`frontend/Dockerfile`, `frontend/nginx.conf`).
- Integration tests in `KisanLinkIntegrationTests` covering: registration, login, role-based authorization, farmer profile update, buyer profile update, farmer produce add/list/delete, custom produce with category and image URL, buyer requirement add/list/delete, recommendation engine end-to-end, recommendation history, ownership attack prevention (farmer & buyer), weighted scoring shape, nearby-market distance routing, statistical price predictions with labeled confidence intervals, full Trade Deal lifecycle with access protection, Agro-Climatic weather advisories, interactive counter-offer negotiation flows, farmer earnings analytics, real-time WebSocket triggers, digital escrow payment milestones, and SMS/WhatsApp alert dispatch with inbound webhook confirmation (19 tests total, all passing).

## Completed frontend work
- Built high-contrast agronomic design system (`frontend/src/styles.css`) using DM Mono & Manrope typography.
- Tabbed navigation bar with active indicators and real-time notification badges.
- 8 Modular Dedicated Views:
  1. `prices`: Live 7-day price discovery, crop category filter chips, interactive price bar chart, and full product catalogue.
  2. `predictions`: AI Price Forecasting dashboard with target prices, bullish/bearish trend indicators, certainty score meter, volatility rating, visual stacked 80%/90%/95% confidence intervals, and 7-day future price trajectory table.
  3. `weather`: Agro-Climatic Intelligence view with current condition card, 4-metric grid, harvest window recommendations, perishable transit spoilage risk indices, 5-day daily forecast strip, and agronomic guidelines.
  4. `matching`: Farmer produce selling workspace with photo preview, category selectors, instant weighted buyer recommendation, 1-click "Initiate Deal", interactive counter-offer negotiation threads, and complete "Active Trades & Orders" ledger with printable contract receipts.
  5. `analytics`: Farmer Earnings & Premium Analytics dashboard with net take-home revenue hero, KisanLink Premium Index (+18.4%), volume tonnage, extra profit earned, and monthly revenue/tonnage progression bar chart.
  6. `map`: Interactive SVG Mandi Radar map with user origin pin, distance rings (30km, 75km, 120km+), color-coded mandi nodes (APMC/Mandi/Wholesale), active route polyline, transit times, and instant directions.
  7. `notifications`: Real-time alerts feed for price spikes, matching buyer requirements, and market routes with unread counters.
  8. `profile`: Location & profile management with GPS coordinates and session sign in/out.
- Frontend API base URL is `http://localhost:8080`.

## Verified commands and results
Backend compile:
```powershell
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd -DskipTests compile
```
Result: BUILD SUCCESS.

Backend test:
```powershell
.\mvnw.cmd -Dtest=KisanlinkBackendApplicationTests test
```
Result: context test passed with H2.

Frontend build:
```powershell
cd C:\dev_tool\GitHub\doc\frontend
npm.cmd run build
```
Result: build passed.

Known PowerShell detail: `npm` may be blocked because it resolves to `npm.ps1`; use `npm.cmd`.

## Spring Boot 4.1.1 custom package paths
This project uses Spring Boot 4.1.1, which restructures some internal packages compared to Spring Boot 3.x.
These differences affect test code:
- `@AutoConfigureMockMvc` → `org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`
  (NOT `org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc`)
- `ObjectMapper` in test code → `tools.jackson.databind.ObjectMapper`
  (Jackson 3 replaces `com.fasterxml.jackson.databind.ObjectMapper`)
- Test dependency in `pom.xml`: use `spring-boot-starter-webmvc-test` and `spring-boot-starter-data-jpa-test`
  (NOT `spring-boot-starter-test`)

## Run in development mode
Terminal 1:
```powershell
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd spring-boot:run
```
The default profile falls back to `dev` and uses H2. Backend URL: `http://localhost:8080/`.

Terminal 2:
```powershell
cd C:\dev_tool\GitHub\doc\frontend
npm.cmd run dev
```
Vite may use port 5173 or 5174 if the first port is occupied.

## PostgreSQL setup
PostgreSQL has been downloaded by the user but still needs to be installed/configured.

Manual steps:
1. Finish the PostgreSQL installer.
2. Keep PostgreSQL port `5432`.
3. Remember the password created for the `postgres` user. Never place the real password in this document or source control.
4. In pgAdmin or psql, create the database:
```sql
CREATE DATABASE kisanlink;
```
5. In a fresh PowerShell terminal, set the password for the current session:
```powershell
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="YOUR_POSTGRES_PASSWORD"
```
6. Start the backend with PostgreSQL:
```powershell
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=postgres"
```
Do not use the PostgreSQL profile until the PostgreSQL service is installed and running. Hibernate `ddl-auto=update` will create/update the mapped tables on startup.

## Important current limitations
- H2 dev data is temporary and resets on backend restart.
- PostgreSQL is not yet verified on this laptop because the installer/database service was not available during the previous session.
- Prediction is currently a simple baseline trend estimate, not a trained ML model.
- Recommendation scoring is a prototype and should later implement configurable weighted scoring from `project.md`.
- Map UI and real routing integration are not implemented yet.
- Notification generation is not automated yet.
- Profile authorization should be hardened so a user cannot update another farmer/buyer profile by changing the URL ID.
- API responses still expose entities directly in several places; introduce response DTOs before production.

## Next work, in order
1. Verify PostgreSQL installation and run the backend with the `postgres` profile.
2. Add a database migration strategy, preferably Flyway, before production use.
3. Harden ownership checks for farmer/buyer/profile/produce/requirement endpoints.
4. Add configurable transport rates and weighted recommendation scoring.
5. Add market map and nearby-market endpoint with real distance/routing data.
6. Improve prediction with historical data and clearly labeled confidence intervals.
7. Add frontend navigation/views for profile, prices, predictions, notifications, buyer matching, and map — including category-based crop browsing in the produce and requirement forms.
8. Add production configuration and remove development defaults/secrets.

## Smoke-test workflow
1. Start backend with H2 dev profile.
2. Start frontend.
3. Register a farmer.
4. Save farmer location, for example Ranchi: latitude `23.3441`, longitude `85.3096`.
5. Register a buyer in another browser/private window.
6. Post a Tomato requirement with quality `GRADE_A` and an offered price.
7. Return to farmer, add Tomato produce with quality `GRADE_A`.
8. Request the best buyer and inspect gross revenue, transport cost, net return, score, and explanation.

## Handoff rule
The project already runs. Make small, testable changes, run a focused validation after each edit, and continue from the next work item above.
