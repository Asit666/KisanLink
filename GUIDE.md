# KisanLink — Complete Developer and Project Guide

> Agricultural Commerce, Direct Market Linkage, AI Crop Doctor, Transporter Freight, and Digital Escrow Platform

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Map](#2-architecture-map)
3. [Directory Structure](#3-directory-structure)
4. [Quick Start — Running Everything](#4-quick-start--running-everything)
5. [Frontend (React + Vite)](#5-frontend-react--vite)
6. [Main Backend (Spring Boot)](#6-main-backend-spring-boot)
7. [AI Backend (FastAPI + PyTorch)](#7-ai-backend-fastapi--pytorch)
8. [Transporter Module & Freight Matching](#8-transporter-module--freight-matching)
9. [Database Guide](#9-database-guide)
10. [Authentication and Security](#10-authentication-and-security)
11. [Real-Time WebSocket System](#11-real-time-websocket-system)
12. [Core Business Modules](#12-core-business-modules)
13. [API Reference Cheatsheet](#13-api-reference-cheatsheet)
14. [Docker and Production](#14-docker-and-production)
15. [Configuration Reference](#15-configuration-reference)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Project Overview

KisanLink is a full-stack agricultural trade and intelligence platform connecting farmers directly with institutional buyers and regional transport operators. It eliminates intermediaries, provides transparent mandi pricing, AI disease diagnosis, algorithmic transporter matching, and UPI-backed digital escrow payments.

### Platform Modules

| Module | Description |
|---|---|
| **Agri-Inputs Marketplace** | Browse and procure certified fertilizers, bio-inputs, pesticides, and irrigation equipment |
| **Mandi Radar** | Real-time commodity arrival price tracking across regional APMC markets |
| **AI Price Forecasting** | Statistical time-series linear regression for 7–14 day modal price predictions |
| **Buyer Matching Engine** | Multi-factor scoring (net margin, distance, price competitiveness, trust) |
| **Trade Negotiation** | Structured counter-offer exchange between Farmer and Buyer |
| **Transporter Freight Hub** | Ranked carrier suggestions, dynamic route pricing, and trip management |
| **Digital Escrow Vault** | Buyer locks funds upfront; payouts released upon verified physical delivery |
| **Crop Doctor AI** | MobileNetV3 deep learning model diagnosing 38 leaf diseases from field photos |
| **Agro-Weather Advisory** | 5-day microclimate forecast, harvest window rating, and spoilage risk index |
| **Farmers Community Forum** | Peer-to-peer Q&A, agronomist consultation, and disease alert posts |

### User Roles

| Role | Capabilities |
|---|---|
| `FARMER` | List produce lots, receive buyer recommendations, negotiate deals, book transporters, access Crop Doctor AI |
| `BUYER` | Post procurement quotas, negotiate counter-offers, fund escrow vault, release payouts |
| `TRANSPORTER` | Manage fleet vehicle, accept/reject haul requests, confirm pickup & deliver shipments |
| `ADMIN` | Manage platform commodities, regional mandis, and official benchmark price updates |

---

## 2. Architecture Map

The platform consists of three independent services:

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React + Vite)                   │
│                     http://localhost:5173                   │
└──────────────┬───────────────────────────────┬──────────────┘
               │ REST API & STOMP WebSocket     │ REST (Image uploads)
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│  Spring Boot Main Backend    │ │     FastAPI AI Microservice │
│    http://localhost:8080     │ │      http://localhost:8000  │
│  (Auth, Trades, Escrow, Hub) │ │  (MobileNetV3 Crop Doctor)  │
└──────────────┬───────────────┘ └────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│  H2 (Dev) / PostgreSQL (Prod)│
└──────────────────────────────┘
```

---

## 3. Directory Structure

```
doc/
├── frontend/                        # React 18 SPA (Vite)
│   ├── src/
│   │   ├── App.jsx                  # Main UI container & views
│   │   ├── styles.css               # Design system & responsive styles
│   │   ├── websocket.js             # STOMP WebSocket client
│   │   └── main.jsx                 # Application mount
│   ├── vite.config.js               # Dev server configuration (port 5173)
│   └── package.json
│
├── kisanlink-backend/               # Spring Boot 4 Java backend
│   ├── src/main/java/com/kisanlink/
│   │   ├── config/                  # SecurityConfig, WebSocketConfig, CorsConfig, DevDataInitializer
│   │   ├── controller/              # 16 REST controllers (Trades, Escrow, Transport, etc.)
│   │   ├── dto/                     # Request and Response records
│   │   ├── entity/                  # JPA entities (Farmer, Buyer, Transporter, TradeDeal, etc.)
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── security/                # JwtAuthFilter, JwtService, OwnershipService
│   │   ├── service/                 # Core business services (Transport, Escrow, Matching)
│   │   └── util/                    # DistanceCalculator (Haversine), ProfitCalculator
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-dev.properties
│   │   └── db/migration/            # Flyway migrations V1 through V10
│   └── pom.xml
│
├── kisanlink-ai/                    # FastAPI PyTorch service
│   ├── app.py                       # Inference server (port 8000)
│   ├── dataset_classes.json         # 38 crop condition metadata classes
│   ├── models/                      # crop_doctor_v1.pt weights
│   ├── train_optimized.py           # Model training script
│   └── requirements.txt
│
├── .gitignore                       # Root gitignore
└── GUIDE.md                         # This documentation
```

---

## 4. Quick Start — Running Everything

Open **three separate terminal windows** (PowerShell or Command Prompt):

### Terminal 1: AI Backend (FastAPI + PyTorch)

```powershell
cd C:\dev_tool\GitHub\doc\kisanlink-ai
.\.venv\Scripts\python.exe app.py
```
> Ready when you see: `Uvicorn running on http://0.0.0.0:8000`

---

### Terminal 2: Spring Boot Backend

```powershell
cd C:\dev_tool\GitHub\doc\kisanlink-backend
.\mvnw.cmd spring-boot:run
```
> Ready when you see: `Started KisanlinkBackendApplication on port 8080`

---

### Terminal 3: Frontend (React + Vite)

```powershell
cd C:\dev_tool\GitHub\doc\frontend
npm.cmd run dev
```
> Ready when you see: `Local: http://localhost:5173/`

Open your browser to: **`http://localhost:5173`**

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

**H2 Console Login (Dev Profile):**
- **JDBC URL**: `jdbc:h2:mem:kisanlink-dev`
- **User Name**: `sa`
- **Password**: *(leave blank)*

---

## 5. Frontend (React + Vite)

### Navigation Views

Navigation is controlled by the `currentView` state variable:

- `prices`: Mandi Radar & commodity spot rates
- `predictions`: ML 7–14 day price forecasting
- `matching`: Direct farmer-buyer linkages & trade deals
- `my-orders`: Active trades, escrow tracker & transporter booking
- `transporter-dashboard`: Fleet operator hub for haul assignments
- `diagnostics`: Crop Doctor AI photo diagnosis
- `inputs`: Certified agricultural inputs marketplace
- `weather`: 5-day agro-weather & harvest advisory
- `community`: Peer-to-peer farmer Q&A forum
- `analytics`: Farmer gross revenue & profit margins
- `map`: Interactive nearby mandi map
- `profile`: Account details and GPS coordinates

### 1-Click Quick Demo Login

The login modal contains instant demo accounts:
- **🌾 Farmer (Ramesh)**: `farmer@kisanlink.in`
- **🏪 Buyer (Priya)**: `buyer@kisanlink.in`
- **🚛 Transporter (Suresh)**: `transporter@kisanlink.in`

---

## 6. Main Backend (Spring Boot)

### Security Rules

| Pattern | Access Rule |
|---|---|
| `/api/auth/**`, `/ws/**`, `/api/notifications/sms-whatsapp/webhook` | Public |
| `GET /api/crops/**`, `GET /api/markets/**`, `GET /api/prices/**` | Public |
| `GET /api/predictions/**`, `GET /api/weather/**` | Public |
| `POST /api/crops`, `POST /api/markets`, `POST /api/prices` | `ROLE_ADMIN` |
| `/api/farmers/**` | `ROLE_FARMER` |
| `/api/buyers/**` | `ROLE_BUYER` |
| `/api/transporters/**` | `ROLE_TRANSPORTER` |
| `/api/transport/**` | Authenticated |
| Everything else | Authenticated |

---

## 7. AI Backend (FastAPI + PyTorch)

- **Model Backbone**: MobileNetV3-Large with custom linear classification head.
- **Classes**: 38 plant disease classes covering tomato, potato, apple, corn, grape, rice, etc.
- **Inference Mode**:
  - Automatically utilizes NVIDIA CUDA GPU if detected, otherwise runs seamlessly on CPU.
  - If weights are missing, falls back to HSV color-ratio foliar analysis heuristics.

### Endpoints
- `GET /health`: Health status, hardware device (cuda/cpu), loaded class count.
- `GET /classes`: All 38 diagnosis classes and treatment plans.
- `POST /predict`: Multipart image upload diagnosis.
- `POST /predict-url`: Image URL diagnosis.

---

## 8. Transporter Module & Freight Matching

### Workflow Lifecycle

```
Trade Deal ACCEPTED by Farmer & Buyer
            │
            ▼
Farmer clicks "Find Transporter"
            │
            ▼
System calculates route (Farmer GPS ──► Buyer GPS)
Filters available carriers with capacity >= quantity
Ranks by: Price (40%), Proximity (35%), Verified (15%), Capacity (10%)
            │
            ▼
Farmer books carrier ──► Status: TRANSPORT_BOOKED
            │
            ▼
Transporter receives request in "Transport Hub"
  ├── Accepts ──► Status: IN_TRANSIT (goods en-route)
  └── Declines ──► Reverts to ACCEPTED (farmer re-selects)
            │
            ▼
Transporter confirms delivery ──► Status: DELIVERED
            │
            ▼
Buyer releases Escrow ──► Farmer & Transporter receive payouts
```

### Key Transporter Endpoints
- `GET /api/transport/suggestions/{dealId}`: Ranked list of transporters.
- `POST /api/transport/book`: Farmer books carrier.
- `GET /api/transport/transporter/{id}/requests`: Transporter views incoming requests.
- `POST /api/transport/bookings/{id}/confirm`: Transporter accepts haul.
- `POST /api/transport/bookings/{id}/reject`: Transporter declines haul.
- `POST /api/transport/bookings/{id}/delivered`: Transporter logs delivery.

---

## 9. Database Guide

### Flyway Migrations

| Version | Description |
|---|---|
| `V1` | Core tables (users, farmers, buyers, crops, markets, prices, produce, requirements, recommendations) |
| `V2` | Real Jharkhand APMC mandi seed data |
| `V3` | Trade deals and negotiation history |
| `V4` | Escrow payments vault table |
| `V5` | SMS & WhatsApp dispatch logs |
| `V6` | Alert email & notification fields |
| `V7` | Farm input marketplace catalog |
| `V8` | Diagnostic reports storage |
| `V9` | Transporters & transport bookings tables, escrow payout column |
| `V10` | Transporter seed migration |

---

## 10. Authentication and Security

### Registration Example

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Suresh Logistics",
    "email": "suresh@logistics.in",
    "phone": "9001112222",
    "password": "Pass123!",
    "role": "TRANSPORTER"
  }'
```

### Login Example

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "suresh@logistics.in",
    "password": "Pass123!"
  }'
```

---

## 11. Real-Time WebSocket System

WebSocket STOMP Broker endpoint: `ws://localhost:8080/ws`

| Destination | Scope | Event Trigger |
|---|---|---|
| `/topic/prices/alerts` | Public Broadcast | APMC mandi price updates |
| `/topic/notifications/user/{id}` | Personal | Deal updates, transport bookings, escrow lock |
| `/topic/trades/user/{id}` | Personal | Trade deal status transitions |

---

## 12. Core Business Modules

### Buyer Matching Formula
Composite score for ranking buyers:
- **40% Net Profit Margin**: Modal price minus transport freight
- **30% Price Competitiveness**: Ratio against regional average
- **20% Proximity**: Haversine distance from farm
- **10% Buyer Verification**: Trust score

### Transporter Ranking Formula
- **40% Freight Cost**: Lower route cost scores higher
- **35% Proximity to Farm**: Closer base to pickup point scores higher
- **15% Verified Operator**: Certified fleet operator badge
- **10% Capacity Buffer**: Vehicle capacity relative to lot size

---

## 13. API Reference Cheatsheet

### Public APIs
```
GET  /api/crops
GET  /api/markets/nearby?latitude=23.34&longitude=85.30
GET  /api/prices/{cropId}
GET  /api/predictions/{cropId}/forecast?days=7
GET  /api/weather/advisory?latitude=23.34&longitude=85.30
```

### Trade & Escrow APIs
```
POST   /api/trades                           # Propose deal
GET    /api/trades/farmer/{farmerId}         # Farmer's trade list
GET    /api/trades/buyer/{buyerId}           # Buyer's trade list
PATCH  /api/trades/{id}/status               # Update status
POST   /api/trades/{id}/negotiate            # Counter-offer
GET    /api/escrow/trade/{dealId}            # Get escrow record
POST   /api/escrow/{id}/deposit              # Buyer locks funds
POST   /api/escrow/{id}/release              # Buyer releases payout
```

### AI Crop Doctor APIs
```
GET   http://localhost:8000/health
GET   http://localhost:8000/classes
POST  http://localhost:8000/predict          # Multipart form upload
POST  http://localhost:8000/predict-url      # JSON { "url": "..." }
```

---

## 14. Docker and Production

Run the multi-container stack:

```powershell
cd C:\dev_tool\GitHub\doc
docker compose up --build -d
```

### Included Services
- `postgres`: PostgreSQL 16 on port 5432
- `backend`: Spring Boot container on port 8080
- `frontend`: Nginx serving production Vite build on port 80

---

## 15. Configuration Reference

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
VITE_API_URL=http://localhost:8080
```

---

## 16. Troubleshooting

### PowerShell Scripts Disabled
Run once to allow script execution for the active terminal session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Or run `npm.cmd` and `.\mvnw.cmd` directly without invoking `.ps1` files.

---

### Port Conflict Check
Check if any other service is occupying required ports:
```powershell
netstat -ano | findstr :5173    # Frontend
netstat -ano | findstr :8080    # Backend
netstat -ano | findstr :8000    # AI service
netstat -ano | findstr :5432    # PostgreSQL
```

To terminate a stuck process on a specific PID:
```powershell
taskkill /PID <PID_NUMBER> /F
```

---

### AI Service Running on CPU
Normal on machines without NVIDIA CUDA GPUs. Inference will take 1–3 seconds per photo instead of ~200ms.

---

*Last updated: 2026-08-31*  
*KisanLink — Empowering farmers with direct market access, AI diagnostics, and smart freight linkages.*