KisanLink — SIH26132
Farmer Market Linkage & Price Discovery
1. Project Overview

Problem Statement: SIH26132 — Farmer Market Linkage & Price Discovery

KisanLink is a farmer-focused decision-support and market-linkage platform that helps farmers discover where, when, and to whom they should sell their produce.

Instead of relying only on the nearest trader or local mandi, a farmer can compare:

Current market prices
Buyer prices
Buyer requirements
Quantity requirements
Crop quality
Distance
Transportation cost
Expected revenue
Net return
Historical price trends
Predicted future prices

The system does not simply display prices. Its main purpose is to recommend the most profitable practical selling option.

Core Idea
Farmer
   ↓
Crop Details
   ↓
Available Buyers / Markets
   ↓
Price Comparison
   ↓
Transportation Cost
   ↓
Net Return Calculation
   ↓
Price Prediction
   ↓
Best Buyer / Market Recommendation

2. Project Objectives
Help farmers discover better selling opportunities.
Provide current crop and market prices.
Connect farmers directly with potential buyers.
Compare multiple markets and buyers.
Calculate transportation costs.
Calculate expected net return.
Recommend the best buyer or market.
Provide historical price trends.
Predict possible future prices.
Help farmers decide whether to sell now or wait.
Provide map-based market and buyer discovery.
Provide explainable recommendations.
Improve farmer bargaining power by providing more market information.
3. Technology Stack
Backend
Java
Spring Boot
Spring Web
Spring Data JPA
Hibernate ORM
Spring Security
JWT Authentication
Maven
Bean Validation
Database
PostgreSQL
Hibernate/JPA for database mapping
Frontend
AI-generated / AI-assisted frontend
React or Next.js
Responsive UI
Charts
Maps
Additional Technologies
REST APIs
Map/routing API
Java-compatible ML library or separate prediction service
Chart library
Notification system
4. High-Level Architecture
                    ┌──────────────────────┐
                    │    Farmer / Buyer    │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                            REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Spring Boot     │
                    │        Java          │
                    ├──────────────────────┤
                    │ Controllers           │
                    │ Services              │
                    │ Recommendation Engine │
                    │ Authentication        │
                    │ Prediction             │
                    └──────────┬───────────┘
                               │
                         JPA / Hibernate
                               │
                               ▼
                    ┌──────────────────────┐
                    │      PostgreSQL       │
                    └──────────────────────┘

                               │
                               ▼
                    ┌──────────────────────┐
                    │ AI / Prediction      │
                    │ Historical Analysis   │
                    │ Price Forecasting     │
                    └──────────────────────┘

5. User Roles
Farmer

Farmer can:

Register
Login
Manage profile
Add available crops
Enter quantity
Enter crop quality
View current prices
Search markets
Search buyers
Compare selling options
View recommended buyer
View expected net return
View price prediction
View map
Contact buyer
Receive notifications
Buyer

Buyer can:

Register
Login
Create business profile
Publish crop requirements
Specify required quantity
Specify quality
Specify offered price
Specify location
View matching farmers
Contact farmers
Admin

Admin can:

Manage farmers
Manage buyers
Manage crops
Manage markets
Manage market prices
Verify buyers
Manage system data
Monitor recommendations
Manage users
6. Main Features
6.1 Farmer Registration and Login

Authentication using:

Spring Security
+
JWT
+
Role Based Access


Roles:

FARMER
BUYER
ADMIN

7. Farmer Produce Module

The farmer can list any agricultural product with flexible naming and image support:

- Category: FRUITS, VEGETABLES, SEEDS (plus grains, pulses, spices, oilseeds, flowers, other)
- Product / Crop Name: Custom product name set by farmer (e.g., Tomato, Organic Chia Seeds, Alphonso Mango, etc.) or selected from catalog
- Quantity: e.g., 500 kg
- Quality: e.g., Grade A / Premium
- Location: Ranchi
- Harvest Date: 25 August
- Available Until: 28 August
- Expected Price: e.g., ₹25/kg
- Product Images: Photos / Image URLs of the actual produce being sold
- Description / Notes: Optional seller notes on variety, organic certification, packaging

This information is stored in the database and becomes the input for the recommendation engine and marketplace browsing.

8. Price Discovery

The application can display prices from:

Local mandis
Wholesale markets
Food processors
Retail buyers
Restaurants
Institutional buyers
Direct buyers
Bulk buyers

Price information can include:

Minimum Price
Maximum Price
Modal Price
Buyer Offered Price
Date
Market
Crop


For the SIH prototype, sample or collected data can be used if live data integration is not available. The data source should be clearly documented.

9. Buyer Marketplace

Buyers can publish requirements categorized by crop category (Fruits, Vegetables, Seeds, etc.) or specific custom product name.

Example:

Category: VEGETABLES
Crop / Product: Tomato
Required Quantity: 2,000 kg
Quality: Grade A
Offered Price: ₹27/kg
Location: Ranchi
Required By: 28 August


The system compares the buyer requirement with farmer produce.

Example:

Farmer:
Category: VEGETABLES
Tomato
500 kg
Grade A
[Attached Product Image]

Buyer:
Category: VEGETABLES
Tomato
Needs 2,000 kg
Grade A
₹27/kg

MATCH FOUND


This creates actual farmer-to-buyer linkage.


10. Transportation Cost

Transportation must be considered when selecting the best buyer.

Example:

Selling Price = ₹29/kg
Quantity = 500 kg

Gross Revenue = ₹29 × 500
              = ₹14,500

Transport Cost = ₹850

Net Return = ₹14,500 - ₹850
           = ₹13,650


The system can calculate transportation based on:

Distance
Vehicle Type
Rate per Kilometer
Loading Cost
Unloading Cost

11. Recommendation Engine

The recommendation engine is the core intelligence of KisanLink.

The system should not simply select the highest price.

Instead:

Selling Price
     +
Quantity
     +
Distance
     +
Transportation Cost
     +
Quality Match
     +
Buyer Requirement
     +
Buyer Reliability
     ↓
Net Return
     ↓
Recommendation Score
     ↓
Best Option

12. Profit Calculation

Basic formula:

Gross Revenue = Selling Price × Quantity

Net Return =
Gross Revenue
- Transportation Cost
- Loading Cost
- Unloading Cost
- Other Selling Costs


Example:

Local Mandi

Price = ₹20/kg
Quantity = 500 kg
Transport = ₹100

Gross Revenue = ₹10,000
Net Return = ₹9,900

Wholesale Buyer

Price = ₹24/kg
Quantity = 500 kg
Transport = ₹350

Gross Revenue = ₹12,000
Net Return = ₹11,650

Food Processor

Price = ₹29/kg
Quantity = 500 kg
Transport = ₹850

Gross Revenue = ₹14,500
Net Return = ₹13,650


Therefore:

Food Processor = Best Option

13. Recommendation Scoring

A possible scoring model:

40% → Net Return
20% → Price Advantage
15% → Distance / Logistics
10% → Buyer Reliability
10% → Quality Match
 5% → Quantity / Delivery Compatibility


Example:

Food Processor
Score: 92/100

Wholesale Buyer
Score: 82/100

Local Mandi
Score: 74/100


The weights should be configurable.

14. Explainable Recommendation

The system should not only say:

Recommended Buyer: ABC Food Processor


It should explain:

Why this buyer?

✓ Highest expected net return
✓ Quality requirement matches
✓ Quantity requirement matches
✓ Buyer is verified
✓ Transport cost is acceptable
✓ Higher price compensates for additional distance


This makes the recommendation more trustworthy.

15. AI / Price Prediction

AI should be used where it provides real value.

The main AI feature can be future price prediction.

Historical data:

Date       Price

20 Aug     ₹21
21 Aug     ₹22
22 Aug     ₹23
23 Aug     ₹24
24 Aug     ₹25


Prediction:

25 Aug → ₹26
26 Aug → ₹27
27 Aug → ₹28


The system can tell the farmer:

Price Trend: UPWARD

Expected price in 2 days: ₹27/kg

Recommendation:
If storage is available and storage cost is low,
waiting may increase expected return.


Or:

Price Trend: DOWNWARD

Recommendation:
Consider selling now to reduce the risk of a lower price.


Predictions should always be presented as estimates, not guaranteed prices.

16. Map Feature

The system can display:

                 Food Processor
                    ₹29/kg
                      ●
                     /
                    / 52 km
                   /
                  ●
                Farmer

      ●
 Local Mandi
 ₹20/kg
 8 km


Map features:

Farmer location
Buyer locations
Market locations
Distance
Transport cost
Recommended destination
17. Notifications

Examples:

Price Alert
Tomato prices increased by 8% in nearby markets.

Buyer Alert
New Buyer Found

ABC Food Processor

Looking for:
1,000 kg Tomato
Grade A
₹28/kg

Distance: 42 km

Price Prediction Alert
Tomato prices are predicted to decline
over the next 3 days.
Consider selling soon.

18. Farmer Dashboard

Example:

------------------------------------
          KISANLINK
------------------------------------

Welcome, Farmer

What do you want to sell?

Crop:
[ Tomato ▼ ]

Quantity:
[ 500 kg ]

Quality:
[ Grade A ▼ ]

Location:
[ Current Location ]

[ FIND BEST OPTION ]

------------------------------------
             BEST OPTION
------------------------------------

ABC Food Processor

₹29/kg
52 km away
Transport: ₹850

Gross Revenue: ₹14,500

Net Return:
₹13,650

Recommendation Score:
92/100

✓ Quality matches
✓ Quantity matches
✓ Verified buyer
✓ Highest net return

[ CONTACT BUYER ]

------------------------------------
          OTHER OPTIONS
------------------------------------

Wholesale Buyer
Net Return: ₹11,650

Local Mandi
Net Return: ₹9,900

19. Buyer Dashboard
------------------------------------
        BUYER DASHBOARD
------------------------------------

Welcome, ABC Food Processor

[ POST NEW REQUIREMENT ]

------------------------------------
        ACTIVE REQUIREMENTS
------------------------------------

Tomato

Required:
2,000 kg

Quality:
Grade A

Price:
₹27/kg

Valid Until:
28 August

------------------------------------

MATCHING FARMERS

Farmer A
500 kg
Grade A
40 km away

[ CONTACT ]

Farmer B
1,000 kg
Grade A
25 km away

[ CONTACT ]

20. PostgreSQL Database

Main tables:

users
farmers
buyers
crops
farmer_produce
markets
market_prices
buyer_requirements
transport_rates
recommendations
price_predictions

21. Database Tables
users
id
name
email
phone
password
role
created_at
updated_at


Roles:

FARMER
BUYER
ADMIN

farmers
id
user_id
address
district
state
latitude
longitude
created_at


Relationship:

User 1 ───── 1 Farmer

buyers
id
user_id
business_name
business_type
address
district
state
latitude
longitude
verified
created_at


Relationship:

User 1 ───── 1 Buyer

crops
id
name
category
unit
created_at


Examples:

Tomato
Potato
Rice
Wheat
Onion
Maize

farmer_produce
id
farmer_id
crop_id
quantity
quality
harvest_date
available_until
expected_price
created_at


Relationships:

Farmer 1 ───── N FarmerProduce

Crop 1 ───── N FarmerProduce

markets
id
name
address
district
state
latitude
longitude
market_type

market_prices
id
market_id
crop_id
date
min_price
max_price
modal_price
source


Relationships:

Market 1 ───── N MarketPrice

Crop 1 ───── N MarketPrice

buyer_requirements
id
buyer_id
crop_id
required_quantity
quality_required
offered_price
valid_until
location
created_at

transport_rates
id
vehicle_type
rate_per_km
base_charge
loading_charge
unloading_charge

recommendations
id
farmer_id
produce_id
buyer_id
market_id
selling_price
transport_cost
other_cost
gross_revenue
net_return
score
reason
created_at

price_predictions
id
crop_id
market_id
prediction_date
predicted_price
lower_bound
upper_bound
trend
model_version
created_at

22. Entity Relationship
                         USERS
                           |
             +-------------+-------------+
             |                           |
             ↓                           ↓
          FARMERS                      BUYERS
             |                           |
             ↓                           ↓
     FARMER_PRODUCE              BUYER_REQUIREMENTS
             |                           |
             +-------------+-------------+
                           |
                           ↓
                         CROPS


MARKETS
   |
   ↓
MARKET_PRICES
   |
   ↓
CROPS


FARMERS
   |
   ↓
RECOMMENDATIONS
   |
   +---------- BUYERS
   |
   +---------- MARKETS
   |
   +---------- FARMER_PRODUCE


CROPS
   |
   ↓
PRICE_PREDICTIONS

23. Spring Boot Project Structure
kisanlink-backend/
│
├── pom.xml
│
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── kisanlink/
        │
        │           ├── KisanLinkApplication.java
        │           │
        │           ├── config/
        │           │   ├── SecurityConfig.java
        │           │   ├── CorsConfig.java
        │           │   └── JwtConfig.java
        │           │
        │           ├── controller/
        │           │   ├── AuthController.java
        │           │   ├── FarmerController.java
        │           │   ├── BuyerController.java
        │           │   ├── CropController.java
        │           │   ├── MarketController.java
        │           │   ├── PriceController.java
        │           │   ├── RecommendationController.java
        │           │   └── DashboardController.java
        │           │
        │           ├── service/
        │           │   ├── AuthService.java
        │           │   ├── FarmerService.java
        │           │   ├── BuyerService.java
        │           │   ├── CropService.java
        │           │   ├── MarketService.java
        │           │   ├── PriceService.java
        │           │   ├── TransportService.java
        │           │   ├── RecommendationService.java
        │           │   └── PredictionService.java
        │           │
        │           ├── repository/
        │           │   ├── UserRepository.java
        │           │   ├── FarmerRepository.java
        │           │   ├── BuyerRepository.java
        │           │   ├── CropRepository.java
        │           │   ├── ProduceRepository.java
        │           │   ├── MarketRepository.java
        │           │   ├── MarketPriceRepository.java
        │           │   ├── BuyerRequirementRepository.java
        │           │   └── RecommendationRepository.java
        │           │
        │           ├── entity/
        │           │   ├── User.java
        │           │   ├── Farmer.java
        │           │   ├── Buyer.java
        │           │   ├── Crop.java
        │           │   ├── FarmerProduce.java
        │           │   ├── Market.java
        │           │   ├── MarketPrice.java
        │           │   ├── BuyerRequirement.java
        │           │   ├── TransportRate.java
        │           │   ├── Recommendation.java
        │           │   └── PricePrediction.java
        │           │
        │           ├── dto/
        │           │   ├── LoginRequest.java
        │           │   ├── RegisterRequest.java
        │           │   ├── ProduceRequest.java
        │           │   ├── BuyerRequest.java
        │           │   ├── RecommendationRequest.java
        │           │   └── RecommendationResponse.java
        │           │
        │           ├── security/
        │           │   ├── JwtService.java
        │           │   ├── JwtAuthFilter.java
        │           │   └── CustomUserDetailsService.java
        │           │
        │           ├── exception/
        │           │   ├── GlobalExceptionHandler.java
        │           │   ├── ResourceNotFoundException.java
        │           │   └── BadRequestException.java
        │           │
        │           └── util/
        │               ├── DistanceCalculator.java
        │               └── ProfitCalculator.java
        │
        └── resources/
            ├── application.properties
            ├── schema.sql
            └── data.sql

24. Frontend Structure

Since the frontend is being generated with AI, keep it API-driven.

frontend/
│
└── kisanlink-ui/
    │
    ├── public/
    │
    ├── src/
    │   │
    │   ├── components/
    │   ├── pages/
    │   ├── layouts/
    │   ├── services/
    │   ├── hooks/
    │   ├── context/
    │   ├── assets/
    │   └── App.*
    │
    └── package.json


Important frontend pages:

Login
Register
Farmer Dashboard
Add Produce
Price Discovery
Best Buyer
Market Map
Price Prediction
Notifications
Buyer Dashboard
Post Requirement
Matching Farmers
Profile

25. REST API Structure
Authentication
POST /api/auth/register
POST /api/auth/login

Farmer
GET    /api/farmers/{id}
PUT    /api/farmers/{id}

POST   /api/farmers/produce
GET    /api/farmers/{id}/produce
DELETE /api/farmers/produce/{id}

Buyer
GET    /api/buyers/{id}
PUT    /api/buyers/{id}

POST   /api/buyers/requirements
GET    /api/buyers/{id}/requirements
DELETE /api/buyers/requirements/{id}

Crops
GET  /api/crops
GET  /api/crops/{id}
POST /api/crops

Markets
GET /api/markets
GET /api/markets/nearby
GET /api/markets/{id}

Prices
GET /api/prices/{cropId}
GET /api/prices/{cropId}/history
GET /api/prices/{cropId}/trend

Recommendations
POST /api/recommendations
GET  /api/recommendations/{id}
GET  /api/farmers/{farmerId}/recommendations

Predictions
GET /api/predictions/{cropId}
GET /api/predictions/{cropId}/{marketId}

26. Example Recommendation API
Request
POST /api/recommendations
Content-Type: application/json

{
  "farmerId": 101,
  "cropId": 1,
  "quantity": 500,
  "quality": "GRADE_A",
  "sellDate": "2026-08-25"
}

Response
{
  "crop": "Tomato",
  "quantity": 500,
  "recommendedBuyer": {
    "id": 25,
    "name": "ABC Food Processor",
    "pricePerKg": 29,
    "distanceKm": 52,
    "transportCost": 850,
    "grossRevenue": 14500,
    "netReturn": 13650,
    "score": 92
  },
  "reason": [
    "Highest estimated net return",
    "Quality requirement matches",
    "Quantity requirement matches",
    "Buyer is verified"
  ],
  "alternatives": [
    {
      "name": "XYZ Wholesale",
      "netReturn": 11650
    },
    {
      "name": "Local Mandi",
      "netReturn": 9900
    }
  ]
}

27. Complete Application Workflow
                 FARMER LOGIN
                      ↓
               ENTER PRODUCE
                      ↓
               SELECT CROP
                      ↓
          QUANTITY + QUALITY
                      ↓
              FARMER LOCATION
                      ↓
          FIND BUYERS / MARKETS
                      ↓
             GET CURRENT PRICES
                      ↓
        CHECK BUYER REQUIREMENTS
                      ↓
            CALCULATE DISTANCE
                      ↓
        CALCULATE TRANSPORT COST
                      ↓
          CALCULATE GROSS REVENUE
                      ↓
           CALCULATE NET RETURN
                      ↓
        CALCULATE RECOMMENDATION
                      ↓
             CHECK PRICE TREND
                      ↓
            PRICE PREDICTION
                      ↓
             RANK ALL OPTIONS
                      ↓
             BEST OPTION SHOWN
                      ↓
             CONTACT BUYER

28. Example Complete Scenario

Farmer enters:

Crop: Tomato
Quantity: 500 kg
Quality: Grade A
Location: Ranchi


System finds:

LOCAL MANDI

Price: ₹20/kg
Distance: 8 km
Transport: ₹100

Gross Revenue: ₹10,000
Net Return: ₹9,900

WHOLESALE BUYER

Price: ₹24/kg
Distance: 25 km
Transport: ₹350

Gross Revenue: ₹12,000
Net Return: ₹11,650

FOOD PROCESSOR

Price: ₹29/kg
Distance: 52 km
Transport: ₹850

Gross Revenue: ₹14,500
Net Return: ₹13,650


Final recommendation:

====================================
          BEST OPTION
====================================

ABC FOOD PROCESSOR

Price: ₹29/kg
Distance: 52 km
Transport: ₹850

Gross Revenue: ₹14,500

NET RETURN:
₹13,650

Score:
92/100

✓ Highest expected net return
✓ Quality matches
✓ Quantity matches
✓ Verified buyer
✓ Transport cost acceptable
====================================

29. Why KisanLink is Different
Traditional Selling
Farmer
   ↓
Nearest Trader
   ↓
Trader Offers Price
   ↓
Farmer Sells


The farmer may have little information about alternatives.

KisanLink
Farmer
   ↓
Multiple Markets + Buyers
   ↓
Current Prices
   ↓
Buyer Requirements
   ↓
Distance
   ↓
Transportation Cost
   ↓
Net Return
   ↓
Price Prediction
   ↓
Explainable Recommendation
   ↓
Direct Buyer Linkage


The main value proposition is:

Give farmers information, alternatives, and an actionable recommendation before they sell.

30. SIH MVP

For the first SIH prototype, focus on these features:

Farmer registration/login
Farmer profile
Add crop/produce
Current market prices
Buyer requirements
Buyer matching
Distance calculation
Transportation cost
Net-return calculation
Best buyer recommendation
Explainable recommendation
Price trend
Basic price prediction
Map
Buyer contact/linkage

Do not try to build every possible feature before the core workflow is stable.

31. Development Plan
Phase 1 — Planning
Finalize requirements
Define user roles
Design database
Define entities
Define relationships
Define API contracts
Phase 2 — Spring Boot
Create Maven project
Configure PostgreSQL
Configure Hibernate/JPA
Create entities
Create repositories
Create DTOs
Create services
Create controllers
Add validation
Add exception handling
Phase 3 — Authentication
Registration
Login
JWT
Role-based access
Spring Security
Phase 4 — Farmer and Buyer
Farmer profile
Farmer produce
Buyer profile
Buyer requirements
Matching
Phase 5 — Markets and Prices
Crop management
Market management
Market prices
Historical prices
Price trends
Phase 6 — Recommendation Engine
Buyer matching
Market matching
Distance calculation
Transport cost
Revenue calculation
Net-return calculation
Recommendation score
Ranking
Explanation
Phase 7 — AI
Prepare historical data
Train/select prediction model
Generate future price estimates
Integrate predictions
Add sell-now/wait recommendation
Phase 8 — Frontend
Generate UI using AI
Farmer dashboard
Buyer dashboard
Price charts
Recommendation page
Map
Notifications
API integration
Phase 9 — Testing
Unit testing
API testing
Database testing
Recommendation testing
Security testing
Frontend/backend integration testing
Phase 10 — SIH Presentation

Prepare:

Problem statement
Proposed solution
Architecture diagram
ER diagram
Technology stack
AI/ML explanation
Recommendation algorithm
Demo scenario
Innovation
Scalability
Social impact
Future scope
32. Future Scope

Possible future features:

Government/market data integration
Regional-language support
Voice-based farmer assistant
WhatsApp/SMS notifications
Advanced price forecasting
Crop quality/image analysis
Digital contracts
Buyer reliability score
Logistics/vehicle pooling
FPO/cooperative support
Personalized recommendations
Storage-aware recommendations
Multi-crop optimization
Transaction history
Digital payments
33. Important Design Principles
Farmer First

The UI should be:

Simple
Mobile-friendly
Easy to understand
Large buttons
Minimal typing
Local-language friendly
Net Return Over Raw Price

The highest price does not always mean the best option.

For example:

Buyer A
₹30/kg
Transport = ₹2,000

Buyer B
₹28/kg
Transport = ₹500


Buyer B may provide the better net return.

Explainable AI

Always show why the system recommends a particular buyer.

AI With Purpose

Use AI primarily for:

Price forecasting
Trend detection
Personalized recommendations

Do not add AI to simple CRUD operations just to call the project "AI-powered."

API-First Frontend

The AI-generated frontend should consume the Spring Boot REST APIs.

Business logic should remain primarily in the backend.

34. Final Vision

KisanLink changes the farmer's decision from:

"Where can I sell my crop?"

to:

"Which verified buyer or market gives me the best expected net return, and should I sell now or wait?"

The complete solution combines:

PRICE DISCOVERY
      +
BUYER DISCOVERY
      +
MARKET DISCOVERY
      +
TRANSPORTATION COST
      +
NET RETURN CALCULATION
      +
PRICE PREDICTION
      +
LOCATION INTELLIGENCE
      +
EXPLAINABLE RECOMMENDATION
      +
DIRECT FARMER-BUYER LINKAGE

Final Project Flow
                KISANLINK
                    │
                    ▼
             Farmer / Buyer
                    │
                    ▼
             Crop Information
                    │
                    ▼
        Market + Buyer Discovery
                    │
                    ▼
            Price Comparison
                    │
                    ▼
         Distance + Transport
                    │
                    ▼
             Net Return
                    │
                    ▼
            AI Price Forecast
                    │
                    ▼
        Recommendation Engine
                    │
                    ▼
        BEST SELLING OPTION
                    │
                    ▼
             DIRECT LINKAGE


KisanLink is not just a price-display application. It is a decision-support and farmer-buyer linkage platform designed to help farmers make better selling decisions using market information, logistics, price forecasting, and explainable recommendations.