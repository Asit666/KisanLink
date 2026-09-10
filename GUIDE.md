# KisanLink — Complete Developer & Project Guide

> Agricultural Commerce · Direct Market Linkage · AI Crop Doctor · FPO Operations · Transporter Freight · Digital Escrow Platform

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Map](#2-architecture-map)
3. [Directory Structure](#3-directory-structure)
4. [Quick Start — Running Everything](#4-quick-start--running-everything)
5. [Desktop App Launcher](#5-desktop-app-launcher)
6. [Frontend (React + Vite)](#6-frontend-react--vite)
7. [Main Backend (Spring Boot)](#7-main-backend-spring-boot)
8. [AI Backend (FastAPI + PyTorch)](#8-ai-backend-fastapi--pytorch)
9. [FPO Operations Module](#9-fpo-operations-module)
10. [Transporter Module & Freight Matching](#10-transporter-module--freight-matching)
11. [Database Guide](#11-database-guide)
12. [Authentication and Security](#12-authentication-and-security)
13. [Real-Time WebSocket System](#13-real-time-websocket-system)
14. [Core Business Modules](#14-core-business-modules)
15. [API Reference Cheatsheet](#15-api-reference-cheatsheet)
16. [Responsive & Mobile Design](#16-responsive--mobile-design)
17. [Docker and Production](#17-docker-and-production)
18. [Configuration Reference](#18-configuration-reference)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Project Overview

KisanLink is a full-stack agricultural trade and intelligence platform connecting farmers, FPOs (Farmer Producer Organisations), institutional buyers, and regional transport operators. It eliminates intermediaries, provides transparent mandi pricing, AI disease diagnosis, algorithmic transporter matching, FPO lot pooling, and UPI-backed digital escrow payments.

### Platform Modules

| Module | Description |
|---|---|
| **Mandi Radar** | Real-time commodity arrival price tracking across regional APMC markets |
| **AI Price Forecasting** | Statistical time-series linear regression for 7-14 day modal price predictions |
| **Buyer Matching Engine** | Multi-factor scoring (net margin, distance, price competitiveness, trust) |
| **Trade Chat & Negotiation** | Structured counter-offer exchange between Farmer and Buyer |
| **Transporter Freight Hub** | Ranked carrier suggestions, dynamic route pricing, and trip management |
| **Digital Escrow Vault** | Buyer locks funds upfront; payouts released upon verified physical delivery |
| **Crop Doctor AI** | MobileNetV3 deep learning model diagnosing 38 leaf diseases from field photos |
| **Agro-Weather Advisory** | 5-day microclimate forecast, harvest window rating, and spoilage risk index |
| **Agri-Inputs Marketplace** | Browse and procure certified fertilizers, bio-inputs, pesticides, and irrigation equipment |
| **Farmers Community Forum** | Peer-to-peer Q&A, agronomist consultation, and disease alert posts |
| **FPO Operations Desk** | Village intake hub, lot pooling & passports, member farmer traceability |
| **Farmer Payouts & Escrow Ledger** | Realized rates, UTR tracking, and NPCI IMPS/UPI settlement records |
| **Admin Governance Desk** | Dispute arbitration, NABL KYC verification, nodal platform controls |
| **Support Network** | Nearby KVK, agronomist, soil lab, and helpline directory with map radar |

### User Roles

| Role | Capabilities |
|---|---|
| `FARMER` | List produce lots, receive buyer recommendations, negotiate deals, book transporters, access Crop Doctor AI, view payouts ledger |
| `BUYER` | Post procurement quotas, negotiate counter-offers, fund escrow vault, release payouts |
| `TRANSPORTER` | Manage fleet vehicle, accept/reject haul requests, confirm pickup & deliver shipments |
| `FPO` | Village intake, lot pooling, member farmer management, FPO analytics dashboard |
| `ADMIN` | Manage platform commodities, regional mandis, official benchmark prices, governance dispute queue |

---

## 2. Architecture Map

The platform consists of three independent services:

```
+-------------------------------------------------------------+
|                    Browser (React + Vite)                   |
|  http://localhost:5173  (or via Launch_KisanLink_Desktop.bat)|
+-------------------------------+-----------------------------+
               | REST API & STOMP WebSocket     | REST (Image)
               v                               v
+------------------------------+  +---------------------------+
|  Spring Boot Main Backend    |  |  FastAPI AI Microservice  |
|    http://localhost:8080     |  |   http://localhost:8000   |
|  (Auth, Trades, Escrow, Hub) |  | (MobileNetV3 Crop Doctor) |
+---------------+--------------+  +---------------------------+
               |
               v
+------------------------------+
|  H2 (Dev) / PostgreSQL (Prod)|
+------------------------------+
```

---

## 3. Directory Structure

```
doc/
+-- frontend/                        # React 18 SPA (Vite)
|   +-- src/
|   |   +-- App.jsx                  # Main UI container, all views & routing
|   |   +-- styles.css               # Full responsive design system (desktop + mobile)
|   |   +-- websocket.js             # STOMP WebSocket client
|   |   +-- main.jsx                 # Application mount point
|   |   +-- config/
|   |   |   +-- api.js               # API_URL & AI_API_URL constants
|   |   +-- data/
|   |   |   +-- mockData.js          # Demo seed data for offline mode
|   |   +-- i18n/
|   |   |   +-- translations.js      # EN / HI / MR language strings
|   |   +-- pages/
|   |   |   +-- FpoIntakeView.jsx    # Village weigh-slip intake hub
|   |   |   +-- FpoLotsAndPassportView.jsx
|   |   |   +-- FpoMemberFarmersView.jsx
|   |   |   +-- FarmerPayoutsLedgerView.jsx
|   |   |   +-- TradeChatView.jsx
|   |   |   +-- TransporterDashboard.jsx
|   |   |   +-- AdminGovernanceView.jsx
|   |   +-- utils/
|   |       +-- economics.js         # Net realization, profit & freight calculators
|   +-- vite.config.js               # Dev server (port 5173, host: true)
|   +-- package.json
|
+-- kisanlink-backend/               # Spring Boot 4 Java backend
|   +-- src/main/java/com/kisanlink/
|   |   +-- config/                  # SecurityConfig, WebSocketConfig, CorsConfig
|   |   +-- controller/              # 16 REST controllers
|   |   +-- dto/                     # Request and Response records
|   |   +-- entity/                  # JPA entities
|   |   +-- repository/              # Spring Data JPA repositories
|   |   +-- security/                # JwtAuthFilter, JwtService, OwnershipService
|   |   +-- service/                 # Core business services
|   |   +-- util/                    # DistanceCalculator (Haversine), ProfitCalculator
|   +-- src/main/resources/
|   |   +-- application.properties
|   |   +-- application-dev.properties
|   |   +-- db/migration/            # Flyway migrations V1 through V10
|   +-- pom.xml
|
+-- kisanlink-ai/                    # FastAPI PyTorch service
|   +-- app.py                       # Inference server (port 8000)
|   +-- dataset_classes.json         # 38 crop condition metadata classes
|   +-- models/                      # crop_doctor_v1.pt weights
|   +-- train_optimized.py
|   +-- requirements.txt
|
+-- Launch_KisanLink_Desktop.bat     # One-click desktop app launcher
+-- docker-compose.yml
+-- GUIDE.md
+-- README.md
```

---

## 4. Quick Start — Running Everything

Open **three separate terminal windows** (PowerShell or Command Prompt):

### Terminal 1 — AI Backend (FastAPI + PyTorch)

```powershell
cd C:\dev_tool\GitHub\doc\kisanlink-ai
.\.venv\Scripts\python.exe app.py
```
> Ready when you see: `Uvicorn running on http://0.0.0.0:8000`

---

### Terminal 2 — Spring Boot Backend

```powershell
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd spring-boot:run
```
> Ready when you see: `Started KisanlinkBackendApplication on port 8080`

---

### Terminal 3 — Frontend (React + Vite)

```powershell
cd C:\dev_tool\GitHub\doc\frontend
npm.cmd run dev
```
> Ready when you see: `Local: http://localhost:5173/`

Open your browser to: **`http://localhost:5173`**

For a physical phone, use the PC's Wi-Fi/LAN address instead, for example `http://172.16.10.242:5173`. Keep both devices on the same network. Development API and WebSocket requests are proxied through Vite, so the phone does not need direct access to backend port `8080`.

---

### Ports Summary

| Service | Address | Description |
|---|---|---|
| **Frontend** | `http://localhost:5173` | React web application |
| **Backend REST API** | `http://localhost:8080` | Spring Boot main API |
| **STOMP WebSocket** | `ws://localhost:8080/ws` | Live price & trade events |
| **H2 Database Console** | `http://localhost:8080/h2-console` | In-memory dev database |
| **AI Backend** | `http://localhost:8000` | PyTorch inference microservice |
| **AI Swagger Docs** | `http://localhost:8000/docs` | Interactive OpenAPI documentation |

For phone testing, use the same host address for the frontend, such as `http://172.16.10.242:5173`. If the page cannot be reached, allow Node.js/Vite through Windows Firewall for private networks and confirm the Vite process is listening with `--host 0.0.0.0`.

**H2 Console Login (Dev Profile):**
- **JDBC URL**: `jdbc:h2:mem:kisanlink-dev`
- **User Name**: `sa`
- **Password**: *(leave blank)*

### Real SMS Demo (MSG91)

SMS delivery is simulated by default. To send a real SMS, create a MSG91 Flow template whose message contains the `VAR1` variable, then set these environment variables in the same PowerShell window used to start Spring Boot:

```powershell
$env:KISANLINK_SMS_MODE = "real"
$env:MSG91_AUTH_KEY = "your-msg91-auth-key"
$env:MSG91_TEMPLATE_ID = "your-approved-flow-template-id"
$env:MSG91_SENDER_ID = "KISAN"
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd spring-boot:run
```

Use the notification panel's **SMS** channel and enter a real number in international or Indian format. In real mode, the response status is `SENT` when MSG91 accepts the request; final delivery depends on MSG91 and carrier delivery reports. WhatsApp remains simulated until a WhatsApp Business provider is configured.

Never commit provider credentials or put them in frontend code.

### MCP Price Prediction Demo

The first MCP vertical slice is available through the Python AI service:

```powershell
$env:MCP_SERVER_URL = "http://localhost:8080/mcp"
$env:KISANLINK_MCP_TOKEN = ""
cd C:\dev_tool\GitHub\doc\kisanlink-ai
python app.py
```

Test it after the Spring Boot backend is running:

```powershell
$body = '{"crop":"Tomato","horizon":7}'
Invoke-WebRequest -Uri http://localhost:8000/price-prediction -Method Post -ContentType 'application/json' -Body $body
```

The AI service calls the Spring MCP tools `get_historical_prices` and `get_latest_market_price`; it does not access the database directly. The existing frontend endpoint `GET /api/predictions/{cropId}/forecast` remains on the Java statistical path until the MCP path is enabled for the UI in a later integration step.

For live MCP market data, configure the official data.gov.in API key before starting Spring Boot:

```powershell
$env:AGMARKNET_API_KEY = "your-data-gov-in-api-key"
$env:AGMARKNET_DEFAULT_STATE = "Jharkhand"
$env:KISANLINK_MCP_LIVE_REFRESH_ENABLED = "true"
$env:KISANLINK_MCP_REFRESH_MINUTES = "15"
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd spring-boot:run
```

MCP refreshes the AGMARKNET cache at most once per configured interval. The response includes `data_status` and `last_refresh`. If the API key is missing or AGMARKNET is unavailable, the system returns the last cached records and reports the failure status; it does not label those records as live.

---

## 5. Desktop App Launcher

**`Launch_KisanLink_Desktop.bat`** launches KisanLink as a standalone desktop-style app using Microsoft Edge in app (kiosk) mode — no browser chrome, no address bar, maximized window.

```batch
start msedge.exe --app=http://localhost:5173 --start-maximized
```

**To use it:**
1. Start the frontend dev server (`npm.cmd run dev` in `frontend/`)
2. Double-click **`Launch_KisanLink_Desktop.bat`**

---

## 6. Frontend (React + Vite)

### Navigation System

The app uses `currentView` state for client-side view switching (no page reloads). The `navigateFromMenu()` helper handles:
- Setting `currentView`
- Updating `window.location.hash` for deep-linking
- Closing the mobile navigation drawer (`setMobileNavOpen(false)`)

### All Available Views

| View ID | Label | Role |
|---|---|---|
| `prices` | Mandi Radar / Crop Prices | All |
| `inputs` | Farm Inputs Marketplace | Farmer, Buyer |
| `predictions` | AI Price Forecast | All |
| `matching` | Buyer Matching Engine | Farmer, Buyer |
| `my-orders` | My Orders & Escrow | Farmer, Buyer |
| `my-shop` | My Shop | Farmer |
| `order-progress` | Shipment Tracker | Farmer, Buyer |
| `trade-chat` | Trade Chat / Buyer Offers | Farmer, Buyer, FPO |
| `transporter-dashboard` | Transport Hub | Transporter |
| `farmer-payouts` | Payouts & Escrow Ledger | Farmer, FPO |
| `fpo-intake` | Village Intake Hub | FPO, Farmer, Buyer, Admin |
| `fpo-lots` | FPO Lots & Passports | FPO, Farmer, Buyer, Admin |
| `fpo-farmers` | Member Farmers | FPO, Farmer, Buyer, Admin |
| `analytics` | FPO Analytics Dashboard | FPO |
| `profile` | FPO Trust Score / Profile | FPO |
| `admin-governance` | Governance Desk | Admin |
| `community` | Krishi Charcha Forum | All |
| `diagnostics` | AI Crop Doctor | Farmer |
| `support-network` | Support & KVK Network | All |
| `weather` | Agro-Weather Advisory | All |
| `map` | Nearby Mandi Map | All |
| `notifications` | Activity Feed | All |

### URL Hash Deep Linking

| Hash | View |
|---|---|
| `#/fpo/collection` | FPO Intake Hub |
| `#/fpo/lots` | FPO Lots & Passports |
| `#/fpo/farmers` | Member Farmers |
| `#/fpo/offers` | Trade Chat (FPO mode) |
| `#/fpo/dashboard` | FPO Analytics |
| `#/fpo/profile` | FPO Trust Score |
| `#/payouts` | Farmer Payouts Ledger |
| `#/admin` | Admin Governance Desk |
| `#/transporter` | Transport Hub |

### 1-Click Quick Demo Login

| Role | Email | Password |
|---|---|---|
| Farmer (Ramesh) | `farmer@kisanlink.in` | `demo` |
| Buyer (Priya) | `buyer@kisanlink.in` | `demo` |
| Transporter (Suresh) | `transporter@kisanlink.in` | `demo` |

### Languages Supported

Switch instantly using the **Lang** selector in the topbar:
- English (`en`)
- Hindi — हिन्दी (`hi`)
- Marathi — मराठी (`mr`)

### Interactive Platform Tour

Click **Tour** in the topbar to launch the 6-step onboarding walkthrough. Use **Arrow keys** or **Next / Back** to navigate. Press **Escape** or **Skip** to exit.

---

## 7. Main Backend (Spring Boot)

### Security Rules

| Pattern | Access Rule |
|---|---|
| `/api/auth/**`, `/ws/**` | Public |
| `GET /api/crops/**`, `GET /api/markets/**`, `GET /api/prices/**` | Public |
| `GET /api/predictions/**`, `GET /api/weather/**` | Public |
| `POST /api/crops`, `POST /api/markets`, `POST /api/prices` | `ROLE_ADMIN` |
| `/api/farmers/**` | `ROLE_FARMER` |
| `/api/buyers/**` | `ROLE_BUYER` |
| `/api/transporters/**` | `ROLE_TRANSPORTER` |
| `/api/transport/**` | Authenticated |
| Everything else | Authenticated |

---

## 8. AI Backend (FastAPI + PyTorch)

- **Model Backbone**: MobileNetV3-Large with custom linear classification head
- **Classes**: 38 plant disease classes (tomato, potato, apple, corn, grape, rice, etc.)
- **GPU/CPU**: Auto-detects NVIDIA CUDA; falls back to CPU seamlessly
- **Fallback**: If weights are missing, uses HSV color-ratio foliar heuristics
- **Safety**: High-entropy ambiguous images route to agronomist escalation

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health status, device, class count |
| `GET` | `/classes` | All 38 diagnosis classes |
| `POST` | `/predict` | Multipart image file upload |
| `POST` | `/predict-url` | JSON `{ "url": "..." }` diagnosis |

---

## 9. FPO Operations Module

### FPO Workflow

```
Member Farmer delivers produce to village collection point
                    |
                    v
FPO Agent records weigh-slip in Village Intake Hub
                    |
                    v
FPO pools intakes into a Lot with a Digital Passport (QR)
                    |
                    v
FPO negotiates with buyers via Trade Chat
                    |
                    v
Buyer accepts lot -> Escrow locked -> Transporter dispatches
                    |
                    v
Delivered -> Escrow released -> Payouts distributed to farmers
```

### FPO Views

| View | Purpose |
|---|---|
| `fpo-intake` | Log weigh-slips from member farmers |
| `fpo-lots` | Pool intakes into saleable lots with digital certificates |
| `fpo-farmers` | Traceability register for member farmers |
| `trade-chat` | View and negotiate incoming buyer offers |
| `analytics` | Revenue dashboard: lots sold, pooled quantity, buyer breakdown |
| `profile` | NABL certification, fulfillment rate, trust score |

---

## 10. Transporter Module & Freight Matching

### Workflow

```
Trade Accepted -> Farmer clicks "Find Transporter"
              -> System ranks carriers by price, proximity, verified status
              -> Farmer books carrier -> TRANSPORT_BOOKED
              -> Transporter accepts -> IN_TRANSIT
              -> Delivery confirmed -> DELIVERED
              -> Buyer releases Escrow -> Payouts sent
```

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/transport/suggestions/{dealId}` | Ranked carrier list |
| `POST` | `/api/transport/book` | Farmer books a carrier |
| `GET` | `/api/transport/transporter/{id}/requests` | View incoming requests |
| `POST` | `/api/transport/bookings/{id}/confirm` | Accept haul |
| `POST` | `/api/transport/bookings/{id}/reject` | Decline haul |
| `POST` | `/api/transport/bookings/{id}/delivered` | Log delivery |

---

## 11. Database Guide

### Flyway Migrations

| Version | Description |
|---|---|
| `V1` | Core tables (users, farmers, buyers, crops, markets, prices) |
| `V2` | Real Jharkhand APMC mandi seed data |
| `V3` | Trade deals and negotiation history |
| `V4` | Escrow payments vault |
| `V5` | SMS & WhatsApp dispatch logs |
| `V6` | Alert email & notification fields |
| `V7` | Farm input marketplace catalog |
| `V8` | Diagnostic reports storage |
| `V9` | Transporters & transport bookings, escrow payout column |
| `V10` | Transporter seed migration |

---

## 12. Authentication and Security

### Registration
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Suresh","email":"suresh@logistics.in","phone":"9001112222","password":"Pass123!","role":"TRANSPORTER"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"suresh@logistics.in","password":"Pass123!"}'
```

Use the returned JWT as: `Authorization: Bearer <token>`

---

## 13. Real-Time WebSocket System

STOMP endpoint: `ws://localhost:8080/ws`

| Destination | Scope | Trigger |
|---|---|---|
| `/topic/prices/alerts` | Public | APMC mandi price updates |
| `/topic/notifications/user/{id}` | Personal | Deal updates, escrow lock |
| `/topic/trades/user/{id}` | Personal | Trade status transitions |

The topbar shows `Live WS` with a green dot when connected.

---

## 14. Core Business Modules

### Buyer Matching Formula
- **40%** Net Profit Margin
- **30%** Price Competitiveness vs regional average
- **20%** Proximity (Haversine distance)
- **10%** Buyer Verification Trust Score

### Transporter Ranking
- **40%** Freight Cost (lower = better)
- **35%** Proximity to farm
- **15%** Verified Operator badge
- **10%** Capacity buffer

### Escrow State Machine
```
PENDING -> LOCKED (buyer deposits) -> RELEASED (delivery confirmed)
                                   -> DISPUTED -> REFUNDED
```

### Client-Side Economic Calculators
All profit calculators run in the browser with no backend call:
- **Farmer Net Realization**: Direct Buyer vs APMC Mandi vs Village Trader
- **Buyer Landed Cost**: Total cost per kg (freight + spoilage + storage)
- **Transporter Trip P&L**: Revenue minus fuel, tolls, wages, wear, escrow fee
- **Quick Sell Break-Even**: Minimum price to recover cultivation costs

---

## 15. API Reference Cheatsheet

### Public APIs
```
GET  /api/crops
GET  /api/markets/nearby?latitude=23.34&longitude=85.30
GET  /api/prices/{cropId}
GET  /api/predictions/{cropId}/forecast?days=7
GET  /api/weather/advisory?latitude=23.34&longitude=85.30
GET  /api/support/nearby?latitude=20.03&longitude=73.80&radiusKm=500
```

### Trade & Escrow
```
POST   /api/trades
GET    /api/trades/farmer/{farmerId}
GET    /api/trades/buyer/{buyerId}
PATCH  /api/trades/{id}/status
POST   /api/trades/{id}/negotiate
POST   /api/trades/disputes
GET    /api/escrow/trade/{dealId}
POST   /api/escrow/{id}/deposit
POST   /api/escrow/{id}/release
```

### AI Crop Doctor
```
GET   http://localhost:8000/health
GET   http://localhost:8000/classes
POST  http://localhost:8000/predict          # multipart/form-data
POST  http://localhost:8000/predict-url      # { "url": "..." }
```

---

## 16. Responsive & Mobile Design

### Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Desktop | > 820px | Left sidebar visible, two-column layout |
| Mobile | <= 768px | Off-canvas fixed drawer, hamburger button shown |

### Mobile Navigation Drawer

On screens <= 768px the left nav becomes a **fixed off-canvas drawer**:
- **Open**: Tap **Menu** (☰) in the topbar
- **Navigate**: Tap any nav item — it switches view **and closes the drawer automatically**
- **Close manually**: Tap the **✕** button or tap the dark backdrop overlay

The `navigateFromMenu(view, hash?)` helper in `App.jsx` handles all three actions atomically.

### Mobile Access on LAN

Since `vite.config.js` sets `host: true`, the app is accessible from any device on the same Wi-Fi:
```
http://<YOUR_PC_IP>:5173/
```
The Network URL is printed in the terminal when Vite starts.

---

## 17. Docker and Production

```powershell
cd C:\dev_tool\GitHub\doc
docker compose up --build -d
```

| Container | Technology | Port |
|---|---|---|
| `postgres` | PostgreSQL 16 | 5432 |
| `backend` | Spring Boot JAR | 8080 |
| `frontend` | Nginx (Vite build) | 80 |

---

## 18. Configuration Reference

### Backend (`application.properties`)
```properties
server.port=${PORT:8080}
jwt.secret=${JWT_SECRET:your-secure-secret-key-32-chars}
jwt.expiration=${JWT_EXPIRATION:86400000}

kisanlink.transport.base-charge=100.00
kisanlink.transport.rate-per-km=15.00
kisanlink.transport.max-distance-km=500.0
```

### Frontend (`frontend/.env`)
```properties
VITE_API_URL=
VITE_AI_API_URL=http://localhost:8000
```

### Vite Dev Server (`vite.config.js`)
```js
server: { port: 5173, host: true, allowedHosts: true }
```

---

## 19. Troubleshooting

### PowerShell Scripts Disabled
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Or use `npm.cmd` and `.\mvnw.cmd` directly.

---

### Port Conflict Check
```powershell
netstat -ano | findstr :5173    # Frontend
netstat -ano | findstr :8080    # Backend
netstat -ano | findstr :8000    # AI service
netstat -ano | findstr :5432    # PostgreSQL
```

Kill a stuck process:
```powershell
taskkill /PID <PID_NUMBER> /F
```

---

### Two Frontend Servers Running

If `npm.cmd run dev` says "Port 5173 is in use", a new server starts on port 5174.
- Kill the old server with `taskkill`, or
- Update `Launch_KisanLink_Desktop.bat` to use `http://localhost:5174`

---

### AI Service Running on CPU
Normal without an NVIDIA GPU. Inference takes 1-3 seconds instead of ~200ms. No action needed.

---

### Mobile Nav Drawer Not Opening
1. Confirm viewport width is <= 768px (the hamburger button is hidden on wider screens via CSS).
2. If the drawer exists but is invisible, check DevTools for z-index conflicts with other fixed elements.

---

### Tutorial Dialog Appears Off-Screen
The tutorial card uses `position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%)` to center on desktop. On mobile (<= 768px) it docks to the bottom (`bottom: 16px`). If it still appears off-screen, verify no parent `transform` is interfering.

---

*Last updated: 2026-09-10*
*KisanLink — Empowering farmers with direct market access, AI diagnostics, FPO operations, and smart freight linkages.*
