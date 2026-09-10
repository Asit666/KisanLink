# KisanLink Flutter Mobile + Local Desktop Application Plan

## 1. Project Overview

**Project:** KisanLink --- Farmer Market Linkage & Price Discovery\
**Repository:** https://github.com/Asit666/KisanLink

### Objective

Add two new user-facing applications to the existing KisanLink platform:

1.  **Flutter Mobile Application** --- Android first, with iOS
    compatibility kept possible.
2.  **Flutter Local Desktop Application** --- Windows first, with
    desktop architecture kept extensible.

The existing KisanLink backend, database, AI/ML services, business
rules, APIs, market-data processing, authentication, and existing web
frontend should remain the core system.

### Core principle

> **Flutter is a new client layer, not a new backend.**

The Flutter applications must consume the existing Spring Boot APIs
wherever possible. Business logic should remain on the backend so that
Web, Mobile, and Desktop all use the same data and rules.

------------------------------------------------------------------------

# 2. Existing KisanLink System

The current repository contains the major components:

``` text
KisanLink/
├── frontend/                 # Existing web frontend
├── kisanlink-backend/        # Existing Java/Spring Boot backend
├── kisanlink-ai/             # Existing AI/ML component
├── docker-compose.yml
├── .env.example
├── README.md
└── project documentation
```

The current project describes a direct farmer-to-buyer marketplace with
dedicated workflows for:

-   Farmers
-   Buyers
-   Transporters

The documented farmer workflow includes:

``` text
Crop Selection
      ↓
Live AGMARKNET Prices
      ↓
AI Price Forecasting
      ↓
Net Realization Calculation
      ↓
Optimal Market Channel
      ↓
Produce Listing + Buyer Matching
      ↓
Escrow Workflow
      ↓
Transport + Delivery + Settlement
```

The repository also documents AGMARKNET synchronization, price
normalization, AI price forecasting, crop diagnosis, negotiation, escrow
simulation, transport workflows, and automated tests.

------------------------------------------------------------------------

# 3. Target Architecture

## Recommended architecture

Use **one Flutter codebase** targeting multiple platforms rather than
maintaining two completely separate Flutter projects.

``` text
                         KISANLINK PLATFORM
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
        Existing Web      Flutter Mobile    Flutter Desktop
        Frontend            Android/iOS       Windows
              |                 |                 |
              +-----------------+-----------------+
                                |
                         REST / JSON APIs
                                |
                                v
                    Java Spring Boot Backend
                                |
          +---------------------+---------------------+
          |                     |                     |
          v                     v                     v
     PostgreSQL             AI/ML Service        Market Data
                                                    |
                                                AGMARKNET
```

### Why one Flutter codebase?

It provides:

-   Shared models
-   Shared API clients
-   Shared authentication
-   Shared validation
-   Shared business presentation logic
-   Shared localization
-   Shared testing
-   Less maintenance
-   Consistent behavior

The UI should still be **adaptive**, because a farmer using a phone and
an administrator/buyer using a desktop need different layouts.

------------------------------------------------------------------------

# 4. What Must NOT Be Rebuilt

Do not duplicate the following in Flutter unless an actual backend
change is required:

-   PostgreSQL database
-   Spring Boot business logic
-   Authentication rules
-   JWT generation/validation
-   Farmer/business entities
-   Buyer matching logic
-   Price calculation logic
-   Net realization calculations
-   AI model logic
-   AGMARKNET synchronization
-   Escrow business rules
-   Transport calculations
-   Negotiation rules
-   Order state transitions
-   Backend authorization
-   Backend validation

Flutter should call the APIs that already provide these capabilities.

------------------------------------------------------------------------

# 5. Flutter Technology Stack

## Core

  Area               Technology
  ------------------ -----------------------------------------
  Language           Dart
  UI                 Flutter
  Mobile             Android first
  Desktop            Windows first
  Architecture       Feature-first + layered architecture
  API                REST/JSON
  Authentication     Existing JWT
  Local storage      Secure storage + local cache
  State management   Riverpod recommended
  Networking         Dio recommended
  JSON models        json_serializable / freezed recommended
  Routing            go_router recommended
  Localization       Flutter localization / ARB
  Testing            flutter_test + integration_test
  CI                 GitHub Actions
  Packaging          APK/AAB + Windows executable/installer

Packages should be selected only after checking compatibility with the
Flutter version used by the project.

------------------------------------------------------------------------

# 6. Recommended Flutter Project Structure

``` text
flutter_app/
├── android/
├── ios/
├── windows/
├── lib/
│   ├── main.dart
│   │
│   ├── app/
│   │   ├── app.dart
│   │   ├── router.dart
│   │   ├── theme.dart
│   │   └── localization.dart
│   │
│   ├── core/
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── network/
│   │   ├── storage/
│   │   ├── security/
│   │   ├── utils/
│   │   └── widgets/
│   │
│   ├── models/
│   │   ├── user.dart
│   │   ├── farmer.dart
│   │   ├── buyer.dart
│   │   ├── transporter.dart
│   │   ├── crop.dart
│   │   ├── market_price.dart
│   │   ├── listing.dart
│   │   ├── offer.dart
│   │   ├── order.dart
│   │   ├── transport.dart
│   │   └── escrow.dart
│   │
│   ├── services/
│   │   ├── api_client.dart
│   │   ├── auth_service.dart
│   │   ├── market_service.dart
│   │   ├── listing_service.dart
│   │   ├── order_service.dart
│   │   ├── negotiation_service.dart
│   │   ├── transport_service.dart
│   │   ├── escrow_service.dart
│   │   └── ai_service.dart
│   │
│   └── features/
│       ├── auth/
│       ├── farmer/
│       ├── buyer/
│       ├── transporter/
│       ├── market/
│       ├── listings/
│       ├── negotiation/
│       ├── orders/
│       ├── transport/
│       ├── escrow/
│       ├── crop_doctor/
│       └── settings/
│
├── test/
├── integration_test/
├── assets/
│   ├── images/
│   ├── icons/
│   └── translations/
└── pubspec.yaml
```

------------------------------------------------------------------------

# 7. Application Roles

The Flutter application should support the existing role model.

## Farmer

Primary features:

-   Registration/login
-   Farmer profile
-   Crop selection
-   Market prices
-   AI price forecast
-   Net realization
-   Market comparison
-   Produce listing
-   Buyer matching
-   Offers/counter-offers
-   Orders
-   Escrow status
-   Transport tracking
-   Delivery status
-   Crop Doctor AI
-   Notifications
-   Settings

## Buyer

Primary features:

-   Login/profile
-   Marketplace
-   Search/filter produce
-   Produce details
-   Farmer information
-   Offer submission
-   Counter-offers
-   Order creation
-   Landed cost calculation
-   Escrow status
-   Transport status
-   Delivery confirmation
-   Purchase history

## Transporter

Primary features:

-   Login/profile
-   Available loads
-   Load details
-   Origin/destination
-   Cargo information
-   Trip profitability
-   Accept dispatch
-   Trip status
-   Delivery confirmation
-   Settlement status
-   Transport history

------------------------------------------------------------------------

# 8. Mobile UI Plan

Mobile should prioritize simple actions, large controls, readable
information, and low cognitive load.

## Farmer mobile navigation

``` text
Home
├── Market Prices
├── AI Forecast
├── My Crops
├── Sell Produce
├── My Listings
├── Offers
├── Orders
├── Transport
└── Profile
```

Suggested bottom navigation:

``` text
Home | Market | Sell | Orders | Profile
```

## Farmer home screen

Display:

-   Greeting
-   Current crop/market summary
-   Today's price
-   AI forecast
-   Estimated net realization
-   Best market recommendation
-   Quick Sell action
-   Active order status

------------------------------------------------------------------------

# 9. Desktop UI Plan

Desktop should use a sidebar + content layout.

``` text
+----------------------------------------------------------+
| KisanLink                                  Notifications |
+----------------+-----------------------------------------+
| Dashboard      |                                         |
| Market         |              Main Content               |
| Crops          |                                         |
| Listings       |                                         |
| Buyers         |                                         |
| Orders         |                                         |
| Transport      |                                         |
| AI / Reports   |                                         |
| Settings       |                                         |
+----------------+-----------------------------------------+
```

Desktop is especially useful for:

-   Buyer procurement
-   Transport management
-   Detailed market analysis
-   Large tables
-   Reports
-   Administrative workflows
-   Negotiation dashboards

------------------------------------------------------------------------

# 10. Responsive Design Strategy

Do not simply stretch the mobile UI onto desktop.

Use breakpoints approximately like:

``` text
< 600 px
    Mobile layout

600–1000 px
    Tablet / compact layout

> 1000 px
    Desktop layout
```

Create reusable adaptive widgets:

``` dart
ResponsiveLayout
AdaptiveScaffold
AdaptiveNavigation
AdaptiveDataTable
AdaptiveDialog
AdaptiveForm
```

------------------------------------------------------------------------

# 11. Backend Integration Plan

Before implementing screens, create an **API inventory** from the actual
Spring Boot backend.

For every endpoint document:

``` text
HTTP method
Endpoint
Authentication required?
Role required?
Request body
Query parameters
Response body
Error responses
Pagination
File upload?
Status codes
```

Example:

``` text
POST /api/auth/login

Request:
{
  "email": "...",
  "password": "..."
}

Response:
{
  "token": "...",
  "user": {...}
}
```

Do not invent endpoint names. The actual repository should be treated as
the source of truth.

------------------------------------------------------------------------

# 12. API Client Architecture

Create one central HTTP client.

``` text
Flutter
   |
ApiClient
   |
Dio / HTTP
   |
Spring Boot API
```

The API client should handle:

-   Base URL
-   Headers
-   JWT
-   Timeouts
-   JSON encoding/decoding
-   Error handling
-   Logging in development
-   Retry where appropriate
-   401 handling
-   Token refresh if supported

Example conceptual structure:

``` text
ApiClient
├── GET
├── POST
├── PUT
├── PATCH
├── DELETE
└── upload
```

Feature services should use the client:

``` text
MarketService
ListingService
OrderService
TransportService
EscrowService
AIService
```

------------------------------------------------------------------------

# 13. Authentication

The existing backend authentication remains authoritative.

Flutter should:

1.  Login
2.  Receive JWT/token
3.  Store it securely
4.  Attach it to API requests
5.  Detect expired sessions
6.  Logout cleanly

Do not store JWT in plain SharedPreferences.

Use secure platform storage.

Expected behavior:

``` text
Login
  ↓
JWT received
  ↓
Secure storage
  ↓
API interceptor
  ↓
Authorization: Bearer <token>
```

------------------------------------------------------------------------

# 14. Role-Based Routing

After login:

``` text
User
 |
 +-- FARMER      → Farmer Dashboard
 |
 +-- BUYER       → Buyer Dashboard
 |
 +-- TRANSPORTER → Transporter Dashboard
 |
 +-- ADMIN       → Admin/Desktop Dashboard if supported
```

Flutter should hide irrelevant screens, but **backend authorization must
remain the final security boundary**.

------------------------------------------------------------------------

# 15. Data Models

Flutter models should mirror backend DTOs rather than database tables.

Potential models:

``` text
User
Farmer
Buyer
Transporter
Crop
MarketPrice
PriceForecast
MarketComparison
NetRealization
ProduceListing
ProduceLot
BuyerMatch
Offer
Negotiation
Order
Payment
Escrow
TransportRequest
TransportTrip
Delivery
CropDiagnosis
Notification
```

Use explicit DTO/model conversion where needed.

Avoid placing database-specific logic in Flutter models.

------------------------------------------------------------------------

# 16. Market Price Module

The Flutter client should consume backend market-price APIs.

Display:

-   Crop
-   Market
-   Location
-   Minimum price
-   Maximum price
-   Modal price
-   Normalized ₹/kg price
-   Date
-   Data source

Possible screen:

``` text
Tomato

Market       Modal      Min      Max
Delhi        ₹24/kg     ₹20      ₹28
Azadpur      ₹26/kg     ₹22      ₹30
Jaipur       ₹23/kg     ₹19      ₹27
```

Add filters:

-   Crop
-   State
-   District
-   Market
-   Date

------------------------------------------------------------------------

# 17. AI Price Forecast

Do not run the existing server-side AI model directly inside Flutter
unless there is a future requirement for offline inference.

Preferred flow:

``` text
Flutter
   ↓
Spring Boot
   ↓
AI/ML Service
   ↓
Prediction
   ↓
Spring Boot
   ↓
Flutter
```

Display:

-   Current price
-   Forecast
-   Trend direction
-   Confidence
-   Forecast period
-   Explanation where available

The UI must clearly distinguish:

**Actual market price** vs **AI prediction**.

------------------------------------------------------------------------

# 18. Net Realization

The existing project focuses on the difference between nominal price and
actual farmer return.

Flutter should present:

``` text
Market price
       +
Buyer offer
       -
Transport
       -
Mandi/handling fees
       -
Other configured costs
       =
Estimated net realization
```

Example UI:

``` text
Market A
Price:          ₹25/kg
Transport:      -₹2/kg
Fees:           -₹1/kg
----------------------
Net:            ₹22/kg

Buyer Direct
Offer:          ₹24/kg
Transport:      -₹1/kg
----------------------
Net:            ₹23/kg

Recommended: Buyer Direct
```

All calculations should come from the backend when authoritative backend
calculations already exist.

------------------------------------------------------------------------

# 19. Produce Listing

Farmer flow:

``` text
Select Crop
     ↓
Enter Quantity
     ↓
Select Grade/Quality
     ↓
Select Location
     ↓
View Price Estimate
     ↓
View Net Realization
     ↓
Create Listing
     ↓
Buyer Matching
```

Validation must match backend validation.

------------------------------------------------------------------------

# 20. Buyer Marketplace

Buyer should be able to:

-   Browse listings
-   Search crops
-   Filter quantity
-   Filter location
-   Filter quality
-   View expected price
-   View farmer/listing details
-   Make offer
-   Negotiate
-   Purchase/order

Desktop should provide a richer table/filter interface.

Mobile should provide card-based listings.

------------------------------------------------------------------------

# 21. Negotiation

Recommended flow:

``` text
Farmer lists produce
        ↓
Buyer makes offer
        ↓
Farmer accepts / rejects / counters
        ↓
Buyer accepts / rejects / counters
        ↓
Deal confirmed
        ↓
Order created
```

Show:

-   Current offer
-   Previous offers
-   Quantity
-   Total value
-   Offer history
-   Status
-   Timestamp

Do not implement a second negotiation engine in Flutter.

------------------------------------------------------------------------

# 22. Orders

Order states should match backend states exactly.

Possible UI:

``` text
Order Created
     ↓
Payment / Escrow
     ↓
Transport Assigned
     ↓
Pickup
     ↓
In Transit
     ↓
Delivered
     ↓
Inspection
     ↓
Settlement
```

Do not invent states that do not exist in the backend.

------------------------------------------------------------------------

# 23. Escrow / Payment

The repository currently describes the payment/escrow workflow as a
sandbox/simulated environment.

The Flutter UI must clearly label this where applicable:

> Sandbox / Test Payment

Do not present simulated payment as real financial settlement.

Screens:

-   Escrow details
-   Amount
-   Lock status
-   Order reference
-   Dispute
-   Refund
-   Settlement
-   Transaction reference

Real payment integration should be a separate future phase.

------------------------------------------------------------------------

# 24. Transport Module

Transporter dashboard:

``` text
Available Loads
      ↓
Load Details
      ↓
Accept Load
      ↓
Trip Started
      ↓
Pickup
      ↓
In Transit
      ↓
Delivery
      ↓
Confirmation
```

Display:

-   Origin
-   Destination
-   Cargo
-   Weight
-   Distance
-   Estimated fuel
-   Toll
-   Driver cost
-   Margin
-   Break-even rate
-   Trip status

------------------------------------------------------------------------

# 25. Crop Doctor AI

If the existing Crop Doctor backend/API is available, Flutter should
provide:

``` text
Take Photo
    ↓
Select Crop
    ↓
Upload Image
    ↓
AI Diagnosis
    ↓
Confidence
    ↓
Recommended Action
    ↓
Agronomist Escalation if needed
```

Mobile should use the camera.

Desktop should support:

-   File picker
-   Drag-and-drop where practical
-   Image preview

Never put the model's sensitive inference logic into the UI layer if the
existing service already performs it on the server.

------------------------------------------------------------------------

# 26. Offline / Poor Connectivity Strategy

This is especially important for the mobile application.

The app should gracefully handle:

-   No internet
-   Slow internet
-   Temporary backend downtime
-   API timeout
-   Cached market data

Cache safe/read-only information such as:

-   Recent market prices
-   User profile
-   Crop list
-   Previously viewed listings
-   Non-sensitive configuration

Do not blindly cache sensitive transactional operations.

For write operations:

``` text
User action
   ↓
Internet available?
   ├── Yes → API
   └── No  → Show pending/offline state
```

Only implement an offline write queue if the backend workflow can safely
support idempotent retries.

------------------------------------------------------------------------

# 27. Notifications

Potential notification types:

-   New buyer offer
-   Counter-offer
-   Offer accepted
-   Order created
-   Transport assigned
-   Pickup reminder
-   Delivery update
-   Escrow status
-   Price alert
-   AI forecast update

Start with in-app notifications.

Push notifications can be added in a separate phase after backend
notification infrastructure is confirmed.

------------------------------------------------------------------------

# 28. Localization

KisanLink targets farmers, so localization is important.

Initial languages:

-   English
-   Hindi
-   Marathi

The existing web project already documents multilingual translation
support, so Flutter should align its terminology with the existing
product.

Do not hard-code user-facing text throughout widgets.

Use localization resources.

------------------------------------------------------------------------

# 29. Maps and Location

If the existing backend exposes map/routing data, Flutter should consume
those APIs.

Potential features:

-   Farmer location
-   Market location
-   Buyer location
-   Transport origin/destination
-   Route display
-   Distance
-   Estimated travel time

Keep location permissions minimal.

Mobile:

-   GPS
-   Camera
-   Notifications
-   Internet

Desktop:

-   Internet
-   File access where required
-   Optional location support

------------------------------------------------------------------------

# 30. Security Requirements

## Flutter

-   Secure token storage
-   HTTPS in production
-   No secrets in source code
-   No API keys committed to Git
-   Input validation
-   Secure file uploads
-   Avoid sensitive data in logs
-   Clear logout behavior
-   Certificate/security hardening where justified

## Backend

Backend remains responsible for:

-   Authentication
-   Authorization
-   Role checks
-   Input validation
-   Business rules
-   Database security
-   Transaction integrity
-   Payment/escrow rules

Never trust a role or price sent by the Flutter client.

------------------------------------------------------------------------

# 31. Environment Configuration

Use separate configurations:

``` text
Development (Windows desktop)
      API_BASE_URL=http://localhost:8080/api

Physical Android device on the same Wi-Fi as the development PC
      API_BASE_URL=http://<PC_LAN_IP>:8080/api

Testing
    API_BASE_URL=<test-server>

Production
    API_BASE_URL=<production-server>
```

For Windows local development, `localhost` can be used when the backend
is running locally. For a physical phone, use the PC's LAN IP and allow
backend port 8080 through the private-network firewall, or use the React
web app's Vite proxy at `http://<PC_LAN_IP>:5173`.

For Android emulator, remember that Android emulator networking may
require a special host address when accessing the developer machine.

Physical Android devices need a reachable development server.

------------------------------------------------------------------------

# 32. Local Desktop Mode

There are two possible meanings of "local desktop app."

### Recommended

A Flutter Windows application that connects to the normal KisanLink
backend.

``` text
Windows Flutter App
       ↓
Spring Boot Backend
       ↓
PostgreSQL
```

This keeps one source of truth.

### Optional future offline/local server mode

If you later want KisanLink to operate completely without internet:

``` text
Flutter Windows
      ↓
Local Spring Boot
      ↓
Local PostgreSQL
```

This should NOT be implemented in the first Flutter phase unless offline
deployment is an explicit requirement.

It creates major additional work around:

-   Local database setup
-   Data synchronization
-   Conflict resolution
-   Security
-   Backend packaging
-   Version upgrades
-   Backup
-   Data migration

------------------------------------------------------------------------

# 33. Development Phases

## Phase 0 --- Existing System Audit

Before writing Flutter UI:

-   Inspect backend modules
-   Inspect all REST endpoints
-   Inspect DTOs
-   Inspect authentication
-   Inspect roles
-   Inspect database entities
-   Inspect AI APIs
-   Inspect market APIs
-   Inspect existing frontend API usage
-   Run backend tests
-   Confirm current API behavior

### Deliverable

`FLUTTER_API_MAPPING.md`

------------------------------------------------------------------------

## Phase 1 --- Flutter Foundation

Create:

-   Flutter project
-   Android target
-   Windows target
-   Theme
-   Routing
-   API client
-   Error handling
-   Secure token storage
-   Environment configuration
-   Localization
-   State management
-   Logging

### Deliverable

Flutter app launches on Android and Windows.

------------------------------------------------------------------------

## Phase 2 --- Authentication

Implement:

-   Login
-   Registration if supported
-   Logout
-   Token storage
-   Session restoration
-   Role detection
-   Unauthorized handling

### Deliverable

A user can log in and reach the correct dashboard.

------------------------------------------------------------------------

## Phase 3 --- Farmer Application

Implement:

1.  Dashboard
2.  Profile
3.  Crop selection
4.  Market prices
5.  AI forecast
6.  Net realization
7.  Market comparison
8.  Produce listing
9.  Buyer matching
10. Offers
11. Orders
12. Transport status

------------------------------------------------------------------------

## Phase 4 --- Buyer Application

Implement:

1.  Dashboard
2.  Marketplace
3.  Search/filter
4.  Listing details
5.  Offers
6.  Negotiation
7.  Orders
8.  Landed cost
9.  Escrow
10. Delivery

------------------------------------------------------------------------

## Phase 5 --- Transporter Application

Implement:

1.  Dashboard
2.  Load board
3.  Load details
4.  Accept job
5.  Trip management
6.  Profit calculation
7.  Delivery confirmation
8.  Settlement

------------------------------------------------------------------------

## Phase 6 --- Crop Doctor

Implement:

-   Camera
-   Gallery/file upload
-   Image preview
-   AI request
-   Diagnosis
-   Confidence
-   Escalation
-   History

------------------------------------------------------------------------

## Phase 7 --- Notifications + Localization

Implement:

-   English
-   Hindi
-   Marathi
-   In-app notifications
-   Push notifications if backend supports them

------------------------------------------------------------------------

## Phase 8 --- Offline/Caching

Add:

-   Cache
-   Connectivity detection
-   Retry
-   Safe offline views
-   Optional queued writes

Only after the online application is stable.

------------------------------------------------------------------------

## Phase 9 --- Testing

Perform:

-   Unit tests
-   Widget tests
-   API integration tests
-   Authentication tests
-   Role tests
-   End-to-end tests
-   Android testing
-   Windows testing
-   Network failure testing
-   Performance testing
-   Security testing

------------------------------------------------------------------------

## Phase 10 --- Release

### Android

Build:

``` text
APK  → direct testing
AAB  → Play Store
```

### Windows

Build:

``` text
Windows executable
Installer/package
```

Add:

-   Version number
-   App icon
-   Signing
-   Release notes
-   Update strategy

------------------------------------------------------------------------

# 34. Testing Matrix

  Area                 Mobile    Desktop   Backend
  ------------------ -------- ---------- ---------
  Login                     ✓          ✓         ✓
  Registration              ✓          ✓         ✓
  JWT                       ✓          ✓         ✓
  Market prices             ✓          ✓         ✓
  AI forecast               ✓          ✓         ✓
  Produce listing           ✓          ✓         ✓
  Buyer matching            ✓          ✓         ✓
  Negotiation               ✓          ✓         ✓
  Orders                    ✓          ✓         ✓
  Transport                 ✓          ✓         ✓
  Escrow sandbox            ✓          ✓         ✓
  Crop Doctor               ✓          ✓         ✓
  Localization              ✓          ✓       ---
  Offline handling          ✓   Optional       ---
  Responsive UI             ✓          ✓       ---

------------------------------------------------------------------------

# 35. Error Handling

All API errors should be converted into understandable messages.

Examples:

``` text
Network unavailable
"Internet connection unavailable. Please try again."

401
"Your session has expired. Please log in again."

403
"You do not have permission to perform this action."

404
"The requested item could not be found."

500
"Something went wrong on the server. Please try again later."
```

Never expose stack traces to users.

------------------------------------------------------------------------

# 36. Loading States

Every API-driven screen needs:

``` text
Loading
Success
Empty
Error
Retry
```

Example:

``` text
Loading → Skeleton/Progress

Success → Data

Empty → "No listings found"

Error → Message + Retry
```

Do not leave blank screens while an API request is running.

------------------------------------------------------------------------

# 37. Accessibility and Usability

Important for farmer-facing applications:

-   Large touch targets
-   High readability
-   Simple language
-   Clear icons + text
-   Minimal unnecessary screens
-   Large price values
-   Avoid information overload
-   Hindi/local-language support
-   Good contrast
-   Form validation
-   Clear confirmation messages

------------------------------------------------------------------------

# 38. Performance

Mobile requirements:

-   Avoid unnecessary API calls
-   Paginate long lists
-   Cache read-only data
-   Compress image uploads
-   Avoid rebuilding large widget trees
-   Lazy-load screens
-   Dispose controllers correctly

Desktop requirements:

-   Efficient large tables
-   Pagination
-   Search debounce
-   Background loading
-   Avoid blocking the UI thread

------------------------------------------------------------------------

# 39. Logging

Development logging should include:

``` text
Request
Response status
Request duration
Feature
Error type
```

Never log:

-   Passwords
-   JWT tokens
-   Payment secrets
-   Sensitive personal information

Production logging should be significantly reduced.

------------------------------------------------------------------------

# 40. Git Branch Strategy

Recommended:

``` text
main
 |
 +-- develop
      |
      +-- feature/flutter-foundation
      +-- feature/flutter-auth
      +-- feature/flutter-farmer
      +-- feature/flutter-buyer
      +-- feature/flutter-transporter
      +-- feature/flutter-crop-doctor
      +-- feature/flutter-testing
```

Do not develop everything directly on `main`.

------------------------------------------------------------------------

# 41. Recommended Repository Structure

Preferred:

``` text
KisanLink/
├── frontend/
├── kisanlink-backend/
├── kisanlink-ai/
├── flutter_app/
│   ├── android/
│   ├── ios/
│   ├── windows/
│   ├── lib/
│   ├── test/
│   └── integration_test/
├── docker-compose.yml
└── documentation/
```

Potential documentation:

``` text
documentation/
├── FLUTTER_PLAN.md
├── FLUTTER_API_MAPPING.md
├── FLUTTER_UI_SPEC.md
├── FLUTTER_TEST_PLAN.md
└── FLUTTER_RELEASE_PLAN.md
```

------------------------------------------------------------------------

# 42. Definition of Done

The Flutter implementation should not be considered complete merely
because the application opens.

A feature is complete when:

-   UI exists
-   API integration works
-   Authentication works
-   Correct role access works
-   Loading state works
-   Empty state works
-   Error state works
-   Validation works
-   Backend data is correctly displayed
-   Backend mutations work
-   Mobile layout works
-   Desktop layout works
-   Unit/widget tests exist
-   Integration test exists where important
-   No secrets are committed
-   No duplicated business logic is introduced

------------------------------------------------------------------------

# 43. MVP Priority

Do not build every feature at once.

## MVP 1 --- Essential

``` text
Authentication
      ↓
Farmer Dashboard
      ↓
Market Prices
      ↓
AI Forecast
      ↓
Net Realization
      ↓
Produce Listing
      ↓
Buyer Marketplace
      ↓
Offer / Negotiation
      ↓
Order
```

## MVP 2

``` text
Transport
Escrow Sandbox
Notifications
Crop Doctor
Localization
```

## MVP 3

``` text
Offline support
Advanced analytics
Advanced maps/routing
Push notifications
Advanced desktop reporting
Production payment integration
```

------------------------------------------------------------------------

# 44. Important Architectural Rules

### Rule 1 --- One backend

Do not create a second backend for Flutter.

### Rule 2 --- One source of truth

PostgreSQL + Spring Boot remain authoritative.

### Rule 3 --- No business logic duplication

Do not recreate backend price, profit, escrow, order, or matching
calculations in Dart.

### Rule 4 --- API-first

Every Flutter feature should have a clear API contract.

### Rule 5 --- Secure by default

Flutter is an untrusted client. Backend authorization remains mandatory.

### Rule 6 --- Adaptive UI

Mobile and desktop can have different layouts while sharing code.

### Rule 7 --- Offline carefully

Read-only caching first. Offline transactions only when the backend
supports safe synchronization.

### Rule 8 --- Preserve existing web application

The new Flutter client must not break the existing web client.

------------------------------------------------------------------------

# 45. First Implementation Checklist

Before writing the first Flutter screen:

-   [ ] Clone/open KisanLink
-   [ ] Confirm backend starts
-   [ ] Confirm PostgreSQL starts
-   [ ] Confirm AI service starts
-   [ ] Run existing backend tests
-   [ ] Run existing frontend tests
-   [ ] Identify all backend controllers
-   [ ] Identify all REST endpoints
-   [ ] Identify DTOs
-   [ ] Identify JWT flow
-   [ ] Identify role names
-   [ ] Identify API base URL configuration
-   [ ] Identify file/image upload endpoints
-   [ ] Identify market-price endpoints
-   [ ] Identify AI endpoints
-   [ ] Identify listing endpoints
-   [ ] Identify negotiation endpoints
-   [ ] Identify order endpoints
-   [ ] Identify transport endpoints
-   [ ] Identify escrow endpoints
-   [ ] Identify notification support
-   [ ] Create API mapping document
-   [ ] Create Flutter project
-   [ ] Enable Android
-   [ ] Enable Windows
-   [ ] Configure environment
-   [ ] Implement API client
-   [ ] Implement authentication

------------------------------------------------------------------------

# 46. Recommended First Sprint

The first development sprint should **not** attempt to build the entire
application.

### Sprint 1

``` text
1. Audit backend
2. Map APIs
3. Create Flutter project
4. Configure Android + Windows
5. Configure environment
6. Add API client
7. Add JWT handling
8. Add secure storage
9. Add routing
10. Build login screen
11. Connect login API
12. Build role-based dashboard routing
13. Test on Android
14. Test on Windows
```

### Sprint 1 success condition

``` text
Flutter Android App
        |
        v
Login
        |
        v
Spring Boot API
        |
        v
JWT
        |
        v
Correct role
        |
        +------> Farmer Dashboard
        +------> Buyer Dashboard
        +------> Transporter Dashboard
```

Once this works, build the feature modules one at a time.

------------------------------------------------------------------------

# 47. Final Target

The finished KisanLink platform should look like:

``` text
                         KISANLINK
                            |
       +--------------------+--------------------+
       |                    |                    |
       v                    v                    v
   WEB CLIENT         FLUTTER MOBILE       FLUTTER DESKTOP
       |                    |                    |
       +--------------------+--------------------+
                            |
                       REST / JSON
                            |
                            v
                  JAVA SPRING BOOT
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
      PostgreSQL          AI/ML          Market Data
          |                 |                 |
          +-----------------+-----------------+
                            |
                    Shared KisanLink Data
```

The key goal is **not three separate KisanLink systems**.

It is:

> **One KisanLink platform with three clients: Web + Flutter Mobile +
> Flutter Desktop.**

This keeps the existing backend and data intact while making KisanLink
accessible from phones and local Windows computers.

------------------------------------------------------------------------

# 48. Immediate Next Document

After this plan, the next technical document should be:

`FLUTTER_API_MAPPING.md`

It should be generated directly from the actual `kisanlink-backend`
source and contain:

``` text
Backend Controller
       ↓
Endpoint
       ↓
HTTP Method
       ↓
Request DTO
       ↓
Response DTO
       ↓
Required JWT role
       ↓
Flutter service
       ↓
Flutter screen
```

This API mapping should be completed **before substantial Flutter UI
development**, because it prevents the Flutter application from
inventing endpoints or duplicating backend logic.
