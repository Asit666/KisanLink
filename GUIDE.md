# KisanLink -- Complete Developer and Project Guide

> Agricultural Commerce, Direct Market Linkage, AI Crop Doctor and Digital Escrow Platform

---

## Table of Contents

1. Project Overview
2. Architecture Map
3. Directory Structure
4. Quick Start - Running Everything
5. Frontend (React + Vite)
6. Main Backend (Spring Boot)
7. AI Backend (FastAPI + PyTorch)
8. Database Guide
9. Authentication and Security
10. Real-Time WebSocket System
11. Core Business Modules
12. API Reference Cheatsheet
13. Docker and Production
14. Configuration Reference
15. Troubleshooting

---

## 1. Project Overview

KisanLink is a full-stack agricultural trade platform that directly connects farmers with buyers, eliminates intermediaries, and provides transparent pricing, AI disease diagnosis, and digital escrow payment protection.

### What It Does

| Module | Description |
|---|---|
| Agri-Inputs Marketplace | Browse and procure fertilizers, pesticides, bio-inputs, farm equipment |
| Mandi Radar | Real-time mandi price tracking across regional markets |
| AI Price Forecasting | Statistical time-series linear regression for 7-14 day price predictions |
| Buyer Matching Engine | Multi-factor scoring to find the best buyer for a farmer's produce |
| Trade Negotiation | Counter-offer flows between Farmer and Buyer |
| Digital Escrow | UPI-protected escrow vault to guarantee payment before dispatch |
| Crop Doctor AI | MobileNetV3 deep learning model to diagnose leaf diseases from photos |
| Agro-Weather Advisory | Harvest windows, spoilage risk, and 5-day micro-climate forecasts |
| SMS / WhatsApp Gateway | Field alert dispatch and inbound SMS command processing |
| Farmers Community | Q&A forum, disease help posts, agronomist answers |

### User Roles

| Role | Capabilities |
|---|---|
| FARMER | List produce, get buyer recommendations, initiate trade deals, access Crop Doctor, view analytics |
| BUYER | Publish procurement requirements, negotiate trade terms, lock escrow funds, release payouts |
| ADMIN | Manage crops, markets, and price data (admin-only endpoints) |

---

## 2. Architecture Map

The project has three independent services that run in separate processes:

`
Browser - React + Vite (Port 5173)
  |                    |
  | REST+WebSocket      | REST (AI only)
  v                    v
Spring Boot Backend   FastAPI AI Backend
(Port 8080)           (Port 8000)
  |
  v
H2 (Dev) / PostgreSQL (Production)
`

- Frontend: React SPA, calls backend REST API and AI service directly from the browser
- Spring Boot Backend: Main API server - auth, market data, trade deals, escrow, matching engine
- FastAPI AI Backend: Standalone Python microservice for crop disease diagnosis only

---

## 3. Directory Structure

`
doc/
+-- frontend/                        React + Vite UI
|   +-- src/
|   |   +-- App.jsx                  Entire UI (~8,900 lines, single-file SPA)
|   |   +-- styles.css               All CSS styling
|   |   +-- websocket.js             WebSocket STOMP client
|   |   +-- main.jsx                 React entry point
|   +-- vite.config.js               Port 5173
|   +-- package.json
|
+-- kisanlink-backend/               Spring Boot Java backend
|   +-- src/main/java/com/kisanlink/
|   |   +-- config/                  CORS, Security, WebSocket, RecommendationConfig
|   |   +-- controller/              14 REST controllers
|   |   +-- dto/                     Request/Response POJOs (30+)
|   |   +-- entity/                  JPA entities (20+)
|   |   +-- exception/               Global exception handler
|   |   +-- repository/              Spring Data JPA interfaces
|   |   +-- security/                JWT filter, JWT service, ownership checks
|   |   +-- service/                 Business logic layer (14 services)
|   |   +-- util/                    Distance calculator, Profit calculator
|   +-- src/main/resources/
|   |   +-- application.properties
|   |   +-- application-dev.properties       H2 in-memory dev profile
|   |   +-- application-postgres.properties  PostgreSQL prod profile
|   |   +-- db/migration/                    Flyway SQL migrations V1-V8
|   +-- pom.xml
|
+-- kisanlink-ai/                    Python FastAPI AI service
|   +-- app.py                       Main FastAPI application
|   +-- train.py                     Model training script
|   +-- train_optimized.py           Optimized training
|   +-- evaluate.py                  Model evaluation
|   +-- dataset_classes.json         38-class disease label mapping
|   +-- models/
|   |   +-- crop_doctor_v1.pt        Trained PyTorch model weights
|   +-- .venv/                       Python virtual environment
|   +-- requirements.txt
|
+-- docker-compose.yml               Multi-container production stack
+-- GUIDE.md                         This file
`

---

## 4. Quick Start - Running Everything

Prerequisites: Java 21+, Node.js 20+, Python 3.11+

### Terminal 1 - AI Backend

`powershell
cd C:\dev_tool\GitHub\doc\kisanlink-ai

# Option A: Bypass execution policy then activate venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python app.py

# Option B: Run directly without activating venv (simpler)
.\.venv\Scripts\python.exe app.py

# Option C: With uvicorn hot-reload for development
.\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
`

When ready you will see: Uvicorn running on http://0.0.0.0:8000


### Terminal 2 - Spring Boot Backend

Run with Dev profile (H2 in-memory DB - no PostgreSQL needed)

`powershell
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd spring-boot:run
`

When ready: Started KisanlinkBackendApplication on port 8080

---

### Terminal 3 - Frontend

`powershell
cd C:\dev_tool\GitHub\doc\frontend

# If PowerShell scripts are blocked, use npm.cmd:
npm.cmd install
npm.cmd run dev
`

When ready: Open http://localhost:5173 in your browser

---

### Ports Summary

| Service | URL | Purpose |
|---|---|---|
| Frontend | http://localhost:5173 | React UI |
| Backend API | http://localhost:8080 | REST API + WebSocket |
| AI Service | http://localhost:8000 | Disease diagnosis |
| AI Swagger | http://localhost:8000/docs | Interactive API explorer |
| H2 Console | http://localhost:8080/h2-console | In-memory DB browser |

H2 Console Settings: JDBC URL = jdbc:h2:mem:kisanlink-dev, Username = sa, Password = (blank)

---

## 5. Frontend (React + Vite)

| Item | Value |
|---|---|
| Framework | React 18 (JSX) |
| Build Tool | Vite (port 5173) |
| Styling | Vanilla CSS (styles.css) |
| State Management | React useState, useRef, useEffect |
| Real-time | WebSocket STOMP client (websocket.js) |
| Architecture | Single-file SPA (App.jsx, ~8900 lines) |

Navigation views (currentView state):
- prices: Market Prices and Mandi Radar
- predictions: AI Price Forecast
- weather: Agro-Weather Advisory
- matching: Buyer Matching and Trade Deals
- analytics: Farmer Analytics Dashboard
- map: Market Map (nearby mandis)
- notifications: Notification Center
- profile: Account and Location Profile
- diagnostics: AI Crop Doctor
- inputs: Farm Inputs Marketplace
- my-shop: Farmer produce listings
- my-orders: Trade orders and Escrow
- community: Farmers Community Forum

### Auth Flow

1. No session -> login page shown
2. Login (real backend) or Quick Demo Login
3. JWT + session saved to localStorage (key: kisanlinkSession)
4. All API calls include Authorization: Bearer [token]
5. Logout clears localStorage

Demo Users (frontend-only mock sessions - no real backend JWT):
- Farmer (Ramesh): farmer@kisanlink.in
- Buyer (Priya): buyer@kisanlink.in

Backend URL (configurable via frontend/.env):
`
VITE_API_URL=http://localhost:8080
`

---

## 6. Main Backend (Spring Boot)

### Tech Stack: Spring Boot 4.1.1, Java 25, JJWT 0.12.6, Flyway, H2/PostgreSQL, Lombok

### Package Structure

`
com.kisanlink/
 config/        CORS, Security, WebSocket, RecommendationConfig, DevDataInitializer
 controller/    14 REST controllers
 dto/           30+ request/response records
 entity/        20+ JPA entities
 repository/    Spring Data JPA interfaces
 security/      JwtAuthFilter, JwtService, OwnershipService, CustomUserDetailsService
 service/       14 business logic services
 util/          DistanceCalculator (Haversine), ProfitCalculator
`

### Security Rules

| Path | Access |
|---|---|
| /api/auth/**, /ws/**, GET public market endpoints | Public |
| POST /api/crops, /api/markets, /api/prices | ADMIN only |
| /api/farmers/** | FARMER role only |
| /api/buyers/** | BUYER role only |
| Everything else | Any authenticated user |

### Dev Profile Auto-Seeded Data

Crops: Tomato, Potato, Onion, Mango, Apple, Banana, Mustard Seeds, Chia Seeds, Sunflower Seeds, Rice, Wheat, Lentil, Urea, DAP, NPK 19:19:19, Vermicompost, MOP, SSP, Neem Bio-Pesticide, Chlorpyrifos, Mancozeb, Trichoderma, Imidacloprid, Seaweed Extract, Azotobacter, PSB Phosphate Solubilizer, Knapsack Sprayer, Drip Lateral Kit, Solar Insect Trap, Tarpaulin

Markets: Ranchi Main Mandi, Ramgarh Krishi Mandi, Bokaro APMC Center, Jamshedpur Agro Yard, Hazaribagh Krishi Mandi, Dhanbad Wholesale Yard

Price history: 7-day series for top crops

Demo User: Ashok Kumar | ashok@example.com | 9876543210

---

## 7. AI Backend (FastAPI + PyTorch)

### Tech Stack: FastAPI >= 0.115.0, PyTorch >= 2.4.0, TorchVision, Pillow, Uvicorn

### Model: MobileNetV3-Large

Backbone: MobileNetV3-Large (ImageNet pre-trained)
Classifier head: Dropout(0.3) + Linear(in_features -> num_classes)
Input: 224x224 RGB, normalized with ImageNet stats

Device: CUDA if available, else CPU

### Inference: image -> Pillow load -> transforms -> model -> softmax -> top-3 -> metadata lookup -> DiagnosisResponse

DiagnosisResponse: crop, condition, is_healthy, confidence_score, pathogen_type, severity (HEALTHY/MODERATE/SEVERE), treatment_plan, recommended_inputs, top_candidates, device, model_status

### Fallback (no model file): pixel-color heuristics classify based on green/yellow/rust/dark/white ratios

### 4 API Endpoints

- GET /health: service status, device, class count, inference mode
- GET /classes: full list of 38 disease class metadata
- POST /predict: multipart image upload diagnosis
- POST /predict-url: JSON with image URL diagnosis

---

## 8. Database Guide

### Dev Mode (H2 In-Memory, default)

No installation needed. Data wiped on each restart. Auto-seeded by DevDataInitializer.

JDBC: jdbc:h2:mem:kisanlink-dev | User: sa | Password: (blank)

### Production Mode (PostgreSQL)

Set env: SPRING_PROFILES_ACTIVE=postgres

Configure: DB_URL, DB_USERNAME, DB_PASSWORD

### Flyway Migrations

| Version | Contents |
|---|---|
| V1 | Core tables: users, farmers, buyers, crops, markets, prices, produce, requirements, recommendations, notifications, predictions |
| V2 | Real Jharkhand mandi seed data |
| V3 | Trade deals and negotiation tables |
| V4 | Escrow payment vault table |
| V5 | SMS/WhatsApp dispatch log table |
| V6 | Alert email and phone fields |
| V7 | Farm input catalog (fertilizers, pesticides, equipment) |
| V8 | AI diagnostic report storage |

### Data Model Summary

`
User -> Farmer -> FarmerProduce, Recommendation, DiagnosticReport
User -> Buyer  -> BuyerRequirement

Crop (id, name, category, unit)
Market (id, name, district, lat, lon, type[MANDI/APMC/WHOLESALE])
MarketPrice (market, crop, date, minPrice, maxPrice, modalPrice)

TradeDeal (farmer, buyer, produce, agreedPrice, quantity)
  Status: PROPOSED/ACCEPTED/IN_TRANSIT/DELIVERED/COMPLETED/CANCELLED/DISPUTED
  +-- TradeNegotiation (counter-offer details)
  +-- EscrowPayment (totalAmount, depositAmount, farmerPayout)
       Status: PENDING_DEPOSIT/FUNDS_HELD_IN_ESCROW/RELEASED_TO_FARMER/DISPUTED/REFUNDED

SmsWhatsAppLog, Notification, PricePrediction
`

---

## 9. Authentication and Security

### JWT Flow

`
POST /api/auth/register  -> Returns JWT token
POST /api/auth/login     -> Returns JWT token
All requests             -> Authorization: Bearer [token]
JwtAuthFilter            -> Validates token on every request
`

### Register

`ash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ramesh Kumar","email":"ramesh@example.com","phone":"9876543210","password":"Pass123","role":"FARMER"}'
`

### Login

`ash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ramesh@example.com","password":"Pass123"}'
`

Response: { "token": "eyJ...", "userId": 1, "profileId": 1, "name": "Ramesh Kumar", "role": "FARMER" }

### JWT Config

jwt.secret: configure via JWT_SECRET env var (change in production)
jwt.expiration: 86400000ms = 24 hours (configure via JWT_EXPIRATION env var)

OwnershipService enforces: farmers/buyers can only access their own records.

---

## 10. Real-Time WebSocket System

STOMP over WebSocket: ws://localhost:8080/ws (SockJS fallback also available)

| Topic | Who Receives | Triggered When |
|---|---|---|
| /topic/prices/alerts | All connected clients | Market price changes |
| /topic/notifications/user/{userId} | Specific user (auth) | Escrow events, trade updates |
| /topic/trades/user/{userId} | Specific user (auth) | Trade status changes |

WebSocket auth: JWT must be sent in STOMP CONNECT frame Authorization header.
Users can only subscribe to their own /user/{userId} topics.

---

## 11. Core Business Modules

### 11.1 Buyer Matching Engine (POST /api/recommendations)

1. Farmer submits farmerId + produceId
2. System fetches buyer requirements for that crop
3. Filters: validity date, quality match, max distance 500km (Haversine)
4. Calculates per buyer: transport cost (Rs.100 base + Rs.15/km), gross revenue, net return
5. Weighted scoring:
   - Net margin: 40%
   - Price competitiveness: 30%
   - Proximity: 20%
   - Buyer trust/verification: 10%
6. Returns ranked list, persists top recommendation

### 11.2 Price Prediction (GET /api/predictions/{cropId}/forecast?days=7)

Algorithm: Statistical time-series linear regression (PredictionService)
1. Load historical modal prices (chronological)
2. Compute linear regression slope (beta) and residual std dev (sigma)
3. Forecast each day: projected = latestPrice + beta * day * damping(0.92^(day-1))
4. Confidence intervals: 80% (z=1.28), 90% (z=1.645), 95% (z=1.96)
5. Trend: UPWARD (beta > 0.15), DOWNWARD (beta < -0.15), STABLE

### 11.3 Digital Escrow (EscrowService)

Flow: Trade ACCEPTED -> open escrow -> buyer deposits full amount -> trade IN_TRANSIT/DELIVERED -> buyer releases funds -> farmer receives payout + UTR

Dispute: Either party can freeze funds. Status becomes DISPUTED, funds held until resolution.

Real-time: WebSocket notifications to both parties at each step. SMS/WhatsApp alerts to farmer.

### 11.4 Agro-Weather Advisory (GET /api/weather/advisory)

Pure algorithmic - no external API required.
Temp from latitude offset, humidity from longitude offset.
Outputs: harvestSuitability, recommendedHarvestWindow, spoilageRiskIndex, transitAdvisory, cropAdvisories, 5-day forecast.

### 11.5 SMS / WhatsApp Gateway

Outbound: dispatchAlert() called from EscrowService and TradeDealService
Inbound webhook: POST /api/notifications/sms-whatsapp/webhook
Commands: ACCEPT [dealId], REJECT [dealId], STATUS [dealId]

---

## 12. API Reference Cheatsheet

Base URL: http://localhost:8080

### Auth (Public)
POST /api/auth/register    Create account
POST /api/auth/login       Login and get JWT

### Public Read Endpoints (no auth)
GET /api/crops                                    List all crops
GET /api/markets/nearby?latitude=&longitude=      Find nearby mandis
GET /api/prices/{cropId}                          Recent prices
GET /api/prices/{cropId}/trend                    Price trend
GET /api/predictions/{cropId}/forecast?days=7     Price forecast
GET /api/weather/advisory?latitude=&longitude=    Weather advisory

### Farmer Endpoints (FARMER role)
GET  /api/farmers/{id}                Get profile
PUT  /api/farmers/{id}                Update profile + GPS
POST /api/farmers/{id}/produce        List produce
GET  /api/farmers/{id}/produce        View produce
POST /api/recommendations             Find best buyer
GET  /api/analytics/farmer/{id}       Earnings analytics

### Buyer Endpoints (BUYER role)
GET  /api/buyers/{id}                 Get profile
PUT  /api/buyers/{id}                 Update profile
POST /api/buyers/{id}/requirements    Post requirement
GET  /api/buyers/{id}/requirements    View requirements

### Trade Deals (authenticated)
POST   /api/trades                        Initiate deal
GET    /api/trades/farmer/{farmerId}      Farmer trade history
GET    /api/trades/buyer/{buyerId}        Buyer trade history
PATCH  /api/trades/{id}/status            Update status
POST   /api/trades/{id}/negotiate         Counter-offer

### Escrow (authenticated, Buyer for deposit/release)
GET  /api/escrow/trade/{dealId}          Get/create escrow account
POST /api/escrow/initiate/{dealId}        Open escrow
POST /api/escrow/{id}/deposit            Deposit funds
POST /api/escrow/{id}/release            Release to farmer
POST /api/escrow/{id}/dispute            Raise dispute

### AI Crop Doctor (Frontend calls AI directly - no auth)
GET  http://localhost:8000/health        AI service health check
GET  http://localhost:8000/classes       All disease class metadata
POST http://localhost:8000/predict       Diagnose from image file upload
POST http://localhost:8000/predict-url   Diagnose from image URL

---

## 13. Docker and Production

### Run with Docker Compose

`powershell
cd C:\dev_tool\GitHub\doc
docker compose up --build        # foreground
docker compose up --build -d     # background
docker compose down              # stop
`

Note: kisanlink-ai (Python AI service) is NOT in docker-compose.yml. Run it separately.

### Services in docker-compose.yml

| Service | Port | Notes |
|---|---|---|
| postgres | 5432 | PostgreSQL 16 |
| backend | 8080 | Spring Boot with postgres profile + Flyway |
| frontend | 80, 3000 | Vite build via Nginx |

### Production Environment Variables (.env in project root)

`
POSTGRES_DB=kisanlink
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_db_password
JWT_SECRET=your-very-long-random-secret-min-32-characters
PORT=8080
JWT_EXPIRATION=86400000
`

### Production Checklist

- Change JWT_SECRET to a long random string (32+ chars)
- Set strong POSTGRES_PASSWORD
- Set SPRING_PROFILES_ACTIVE=postgres
- Set frontend VITE_API_URL to your production backend URL
- Enable HTTPS / SSL
- Update CORS allowed origins in CorsConfig.java to your domain
- Configure real SMS/WhatsApp provider (Twilio, MSG91, etc.)

---

## 14. Configuration Reference

### Backend - application.properties

`properties
server.port=${PORT:8080}

jwt.secret=${JWT_SECRET:change-this-in-production}
jwt.expiration=${JWT_EXPIRATION:86400000}

kisanlink.transport.base-charge=100.00
kisanlink.transport.rate-per-km=15.00
kisanlink.transport.max-distance-km=500.0

kisanlink.scoring.weight.net-margin=0.40
kisanlink.scoring.weight.price=0.30
kisanlink.scoring.weight.proximity=0.20
kisanlink.scoring.weight.buyer-trust=0.10
`

All weights can be changed without recompiling. They should sum to 1.0.

### Frontend - frontend/.env

`
VITE_API_URL=http://localhost:8080
`

### AI Backend - app.py constants

`python
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "./models/crop_doctor_v1.pt"
CLASSES_PATH = "./dataset_classes.json"
`

---

## 15. Troubleshooting

### PowerShell - Scripts are disabled

Fix for current session:
`powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
`

Fix permanently:
`powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
`

Or bypass npm scripts by using:
`powershell
npm.cmd install
npm.cmd run dev
`

---

### Backend - Port 8080 already in use

`powershell
netstat -ano | findstr :8080
taskkill /PID [PID_NUMBER] /F
`

---

### AI Backend - Running on CPU (no GPU)

Normal. You will see: [START] KisanLink AI Microservice on http://localhost:8000 (Device: cpu)
Expect 2-5 seconds per image (vs <0.5s on GPU). Fully functional.

---

### AI Backend - Model file not found

You will see: [INFO] No trained checkpoint found. Starting in fallback diagnosis mode.
The service starts normally using image heuristics. To train the model:

`powershell
cd C:\dev_tool\GitHub\doc\kisanlink-ai
.\.venv\Scripts\python.exe train_optimized.py
`

---

### Frontend - Backend is connecting or unavailable

Make sure Spring Boot backend is running on port 8080. Check firewall settings.

---

### Frontend - Demo login works but API calls return 403

Demo sessions use fake JWT tokens. Register a real account via Login -> Create Account to get a valid JWT.

---

### H2 Console - Table not found

URL: http://localhost:8080/h2-console
JDBC URL: jdbc:h2:mem:kisanlink-dev | Username: sa | Password: (empty)
The app must be running to access the console.

---

### WebSocket - Stays at Connecting

Make sure backend is running on port 8080. Check browser console for WebSocket errors.
Endpoint: ws://localhost:8080/ws

---

### Port conflict check

`powershell
netstat -ano | findstr :5173    # Frontend
netstat -ano | findstr :8080    # Backend
netstat -ano | findstr :8000    # AI service
netstat -ano | findstr :5432    # PostgreSQL
`

---

Last updated: 2026-08-31
KisanLink - Empowering farmers with direct market access and AI-powered field intelligence