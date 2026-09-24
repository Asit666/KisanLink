# KisanLink Frontend Developer & Debugging Manual (`debug.md`)

This guide is the master debugging and architectural manual for the KisanLink frontend application. It documents the modular directory organization, view state machines, data flow lifecycles, and copy-paste browser DevTools recipes for rapid troubleshooting.

---

## 1. Directory Structure & Architecture

The frontend is organized by **domain-driven view modules** to prevent monolithic mesh and make locating code immediate:

```
frontend/
├── src/
│   ├── components/
│   │   └── common/
│   │       └── NavIcon.jsx          # Reusable SVG vector navigation icon library
│   ├── views/
│   │   ├── market/                  # Market intelligence & discoveries
│   │   │   ├── PricePredictionsView.jsx  # ML 7-day price forecasts & confidence bands
│   │   │   ├── AgroWeatherView.jsx       # Agricultural meteorology & harvest advisories
│   │   │   ├── MarketMapView.jsx         # Geographical freight radar & APMC yard finder
│   │   │   └── index.js                  # Barrel exports for market views
│   │   ├── farmer/                  # Farmer tools & procurement
│   │   │   ├── AgriInputsView.jsx        # Fertilizers, bio-inputs & dealer procurement
│   │   │   ├── FarmerPayoutsLedgerView.jsx # Escrow bank payout settlements
│   │   │   └── index.js
│   │   ├── community/               # Kisan Sabha bulletin & expert directory
│   │   │   ├── CommunityView.jsx         # Discussion feed, Q&A, and crop health posts
│   │   │   ├── SupportNetworkView.jsx    # KVK directory, soil labs, radar & map
│   │   │   └── index.js
│   │   ├── admin/                   # Governance & system dispatch
│   │   │   ├── NotificationsView.jsx     # Signal feed & SMS/WhatsApp test gateway
│   │   │   ├── AdminGovernanceView.jsx   # Regulatory audits & platform oversight
│   │   │   └── index.js
│   │   ├── fpo/                     # Farmer Producer Organization workflows
│   │   │   ├── FpoIntakeView.jsx         # Digital weigh-slip & intake records
│   │   │   ├── FpoLotsAndPassportView.jsx# Lot passports & traceability QR
│   │   │   ├── FpoMemberFarmersView.jsx  # Member roster & acreage tracking
│   │   │   └── index.js
│   │   ├── transporter/             # Commercial logistics & transport
│   │   │   ├── TransporterDashboard.jsx  # Fleet management, bookings & trip profit
│   │   │   └── index.js
│   │   ├── buyer/                   # Trade negotiation & procurement
│   │   │   ├── TradeChatView.jsx         # Direct counterparty messaging & deal negotiation
│   │   │   └── index.js
│   │   └── landing/
│   │       └── AboutPage.jsx             # Public institutional about page
│   ├── config/
│   │   └── api.js                   # API base URLs, AI service URLs & timeouts
│   ├── data/
│   │   └── mockData.js              # Deterministic demo fixtures, fallback datasets
│   ├── i18n/
│   │   ├── translations.js          # Multilingual dictionary (en, hi, mr)
│   │   └── authTranslations.js      # Auth screen localized strings
│   ├── utils/
│   │   └── economics.js             # Financial engines (net realization, profit, margins)
│   ├── websocket.js                 # Reconnecting WebSocket client for real-time deals
│   ├── App.jsx                      # App root state container, router & layout
│   ├── main.jsx                     # Vite DOM mount point
│   ├── styles.css                   # Global design tokens, layouts, animations
│   └── __tests__/
│       └── app.test.js              # Unit tests for economic models, i18n & safety
├── debug.md                         # This reference manual
├── package.json
└── vite.config.js
```

---

## 2. View Registry & Route Matrix

The application uses state-based view switching with hash-navigation synchronization (`window.location.hash` and `currentView`).

| `currentView` Key | Component File | Required Role | Description & Primary Features |
| :--- | :--- | :--- | :--- |
| `'about'` | `src/views/landing/AboutPage.jsx` | *Public / Any* | Landing page, platform manifesto, architecture overview. |
| `'prices'` | Inline in `App.jsx` | *Public / Any* | Real-time AGMARKNET Mandi Price Ticker with filters. |
| `'predictions'` | `src/views/market/PricePredictionsView.jsx` | *Any* | 7-day ARIMA / ML price trajectories with 80%, 90%, 95% certainty bounds. |
| `'weather'` | `src/views/market/AgroWeatherView.jsx` | *Any* | 5-day agro-meteorological advisories, harvest suitability, spoilage risk. |
| `'map'` | `src/views/market/MarketMapView.jsx` | *Any* | Radial radar for nearby wholesale & APMC mandis with freight estimate. |
| `'inputs'` | `src/views/farmer/AgriInputsView.jsx` | `FARMER` / `FPO` | Certified seeds, bio-inputs, fertilizers with instant escrow order modal. |
| `'my-orders'` | Inline in `App.jsx` | `FARMER` / `BUYER` | Escrow-backed trade order ledger, live dispatch tracking, invoice viewing. |
| `'community'` | `src/views/community/CommunityView.jsx` | *Any* | Kisan Sabha community bulletin, agronomic replies, prescription ordering. |
| `'support-network'`| `src/views/community/SupportNetworkView.jsx`| *Any* | Verified KVK research stations, certified agronomists, soil labs. |
| `'diagnostics'` | Inline in `App.jsx` | *Any* | MobileNetV3 AI Crop Doctor (38 disease classes, heuristic fallbacks). |
| `'chat'` | `src/views/buyer/TradeChatView.jsx` | *Authenticated* | Live trade counterparty messaging & counter-offer negotiations. |
| `'transporter-dashboard'` | `src/views/transporter/TransporterDashboard.jsx` | `TRANSPORTER` | Fleet capacity, driver dispatch, round-trip deadhead economic calculations. |
| `'fpo-intake'` | `src/views/fpo/FpoIntakeView.jsx` | `FPO` / `ADMIN` | Member farmer lot intake, moisture %, digital weigh-slip generation. |
| `'fpo-lots'` | `src/views/fpo/FpoLotsAndPassportView.jsx` | `FPO` / `ADMIN` | Aggregated crop lot passports, QR traceability, bulk buyer dispatch. |
| `'fpo-farmers'` | `src/views/fpo/FpoMemberFarmersView.jsx` | `FPO` / `ADMIN` | Registered member database, acreage, yield forecasts. |
| `'payouts'` | `src/views/farmer/FarmerPayoutsLedgerView.jsx` | `FARMER` / `FPO` | Escrow bank payouts, bank UTR numbers, deduction breakdowns. |
| `'governance'` | `src/views/admin/AdminGovernanceView.jsx` | `ADMIN` | Regulatory oversight, dispute resolution, platform compliance logs. |
| `'notifications'` | `src/views/admin/NotificationsView.jsx` | *Any* | Real-time desk feed, simulated SMS & WhatsApp field dispatch logs. |

---

## 3. Core State Architecture & Storage Keys

All persistent client state is stored in `window.localStorage`:

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `kisanlink_session` | JSON Object | `null` | Active user session `{ token, user: { id, name, role, phone, district, state } }`. |
| `kisanlink_lang` | String | `'en'` | Interface language: `'en'` (English), `'hi'` (Hindi), or `'mr'` (Marathi). |
| `kisanlink_trades` | JSON Array | `[]` | Active and historical trade deal offers. |
| `kisanlink_orders` | JSON Array | `INITIAL_USER_ORDERS` | Escrow-backed purchase and procurement orders. |
| `kisanlink_sidebar_collapsed` | Boolean string | `'false'` | Sidebar collapse toggle state. |

---

## 4. Debugging Workflows for Major Subsystems

### 4.1 Mandi Prices & AGMARKNET Feed
- **Component**: Inline in `App.jsx` (lines ~4700-5300)
- **Data Source**: `GET /api/mandi-prices` or fallback `DEFAULT_CROPS` in `src/data/mockData.js`.
- **Normalization Engine**: `normalizeMandiPricePerQuintal()` in `src/utils/economics.js` converts modal quintal rates (₹/quintal) to standard ₹/kg.
- **Common Debug Checks**:
  1. Check Network tab for `GET /api/mandi-prices`. If HTTP 500 or offline, verify mock data loads automatically.
  2. Inspect price variance indicator: `priceChange` field (+/- green/red).

### 4.2 Escrow & Trade Deal State Machine
- **Lifecycle Sequence**:
  `PROPOSED` &rarr; `ACCEPTED` &rarr; `ESCROW_LOCKED` &rarr; `IN_TRANSIT` &rarr; `DELIVERED_PENDING_RELEASE` &rarr; `ESCROW_RELEASED`
- **Dispute Branch**:
  Any party can transition an order to `DISPUTED`. Resolving releases funds back to buyer or forward to farmer via `AdminGovernanceView.jsx`.
- **Key Files**:
  - `src/utils/economics.js`: `calculateFarmerNetRealization`, `calculateBuyerLandedCost`
  - `src/views/farmer/FarmerPayoutsLedgerView.jsx`: Bank payout ledger
  - `src/views/admin/AdminGovernanceView.jsx`: Dispute arbitrator

### 4.3 AI Crop Doctor (MobileNetV3 & Heuristic Fallback)
- **Component**: `currentView === 'diagnostics'`
- **API Endpoint**: `POST /api/diagnostics/analyze-leaf` (FastAPI / PyTorch service)
- **Safety Fallback**:
  If AI model service is unavailable or returns low confidence (&lt;70%), the app triggers a heuristic rule-based fallback:
  - Confidence is flagged as uncalibrated.
  - A prominent agronomic disclaimer is displayed.
  - The farmer is prompted to post to Kisan Sabha (`CommunityView.jsx`) for human expert verification.
  - Chemical recommendations are automatically locked until verified.

### 4.4 Agro-Weather & Freight Radar
- **Components**: `src/views/market/AgroWeatherView.jsx` and `src/views/market/MarketMapView.jsx`
- **Location Presets**: Ranchi Center, Ramgarh, Bokaro, Jamshedpur (or GPS coordinates from `navigator.geolocation`).
- **Coordinate Conversion**:
  Distance calculated via Haversine spherical formula in kilometers. Freight cost estimated at `₹45/km + ₹12/quintal-handling`.

### 4.5 Real-Time WebSocket Channel
- **Client**: `src/websocket.js` (`KisanLinkWebSocketClient`)
- **Default WS URL**: `ws://localhost:5000/ws` (falls back to polling when unavailable).
- **Subscribed Events**:
  - `TRADE_UPDATE`: Triggers deal refresh in chat and notification desk.
  - `ESCROW_UPDATE`: Updates milestone badges across active orders.
  - `PRICE_TICKER`: Broadcasts intraday mandi price updates.

---

## 5. Browser DevTools Console Debug Recipes

Paste these helper snippets directly into your browser DevTools Console (`F12`) to inspect or force frontend states:

### 5.1 Switch User Role Instantly
```javascript
// Switch to FARMER role
localStorage.setItem('kisanlink_session', JSON.stringify({
  token: 'mock-token-farmer',
  user: { id: 'usr-101', name: 'Ramesh Patel', role: 'FARMER', phone: '+91 98765 43210', district: 'Ranchi', state: 'Jharkhand' }
}));
window.location.reload();
```
```javascript
// Switch to BUYER role
localStorage.setItem('kisanlink_session', JSON.stringify({
  token: 'mock-token-buyer',
  user: { id: 'usr-202', name: 'Metro Fresh Agro Pvt Ltd', role: 'BUYER', phone: '+91 98111 22233', district: 'Kolkata', state: 'West Bengal' }
}));
window.location.reload();
```
```javascript
// Switch to TRANSPORTER role
localStorage.setItem('kisanlink_session', JSON.stringify({
  token: 'mock-token-transporter',
  user: { id: 'usr-303', name: 'Chotanagpur Freight Haulers', role: 'TRANSPORTER', phone: '+91 94311 55667', district: 'Ranchi', state: 'Jharkhand' }
}));
window.location.reload();
```
```javascript
// Switch to FPO Admin role
localStorage.setItem('kisanlink_session', JSON.stringify({
  token: 'mock-token-fpo',
  user: { id: 'usr-404', name: 'Birsa Munda Krishak Samiti', role: 'FPO', phone: '+91 94311 99887', district: 'Khunti', state: 'Jharkhand' }
}));
window.location.reload();
```

### 5.2 Navigate to Any View Programmatically
```javascript
// Switch views directly via hash navigation:
window.location.hash = '#/predictions';   // ML Price Predictions
window.location.hash = '#/weather';       // Agro-Weather
window.location.hash = '#/map';           // Market Radar Map
window.location.hash = '#/inputs';        // Farm Inputs & Seeds
window.location.hash = '#/community';     // Kisan Sabha Bulletin
window.location.hash = '#/support-network'; // KVK & Soil Labs
window.location.hash = '#/notifications'; // Notifications Feed
window.location.hash = '#/about';         // Public About Page
```

### 5.3 Reset App State Cleanly
```javascript
// Clear corrupted session or order state and return to clean guest demo mode:
localStorage.removeItem('kisanlink_session');
localStorage.removeItem('kisanlink_orders');
localStorage.removeItem('kisanlink_trades');
window.location.hash = '#/prices';
window.location.reload();
```

---

## 6. Build & Test Verification

Run these commands from `frontend/` directory to verify integrity:

```bash
# Execute full production bundle build (Vite)
npm run build

# Run comprehensive economic, translation & safety unit tests (23 tests)
npm test

# Launch local development server with hot-reload (HMR)
npm run dev
```

> **Note for Windows developers**: If PowerShell blocks script execution due to execution policy, prefix commands with `cmd /c`:
> ```cmd
> cmd /c npm run build
> cmd /c npm test
> ```
