# KisanLink: Digital & Software Problems Specification (Technical & Architectural)

---

## 1. Executive Summary

This document details all digital, computational, architectural, security, and algorithmic problems in the KisanLink platform (`frontend/`, `kisanlink-backend/`, `kisanlink-ai/`, and relational database schemas). It outlines the vulnerabilities, concurrency risks, state integrity bugs, and contract mismatches identified during project static scans and code audits, alongside the concrete software engineering and architectural solutions implemented to solve them.

---

## 2. Digital Security & Financial Ledger Problems

### 2.1 Arbitrary & Negative Escrow Deposits
- **Vulnerability**: In `EscrowService.java`, the deposit endpoint accepted client-supplied monetary values (`request.amount()`) and transitioned the escrow state directly to `FUNDS_HELD_IN_ESCROW` without asserting `depositAmount == totalAmount`. Furthermore, `@Positive` was missing on the request DTO.
- **Digital Impact**: A client could submit `amount = 1.00` or `amount = -500.00` on a ₹50,000 contract, resulting in a digitally "funded" escrow ledger that induced farmers to release physical assets.
- **Architectural Solution**:
  1. Added `@NotNull @Positive` validation on `EscrowDepositRequest`.
  2. Implemented strict equality check in `EscrowService`:
     ```java
     if (request.amount().compareTo(escrow.getTotalAmount()) != 0) {
         throw new IllegalArgumentException("Deposit must exactly match trade total");
     }
     ```
  3. Rejects partial funding and overfunding in fixed-price settlement flows.

---

### 2.2 Unauthorized Fund Release (Counterparty Self-Release Flaw)
- **Vulnerability**: `releaseFunds()` validated only generic trade access (`checkTradeDealAccess()`), allowing either participant (the farmer or the buyer) to trigger payout release.
- **Digital Impact**: A seller could invoke the release API immediately after creating a trade, bypassing buyer approval and physical delivery milestones.
- **Architectural Solution**:
  1. Restrict caller authorization strictly to the buyer:
     ```java
     if (!deal.getBuyer().getUser().getEmail().equalsIgnoreCase(userEmail)) {
         throw new SecurityException("Only the buyer can release escrow funds");
     }
     ```
  2. Require prerequisite milestone verification (`deal.getStatus() == DELIVERED` or verified POD code).

---

### 2.3 Payout Release During Active Disputes
- **Vulnerability**: The state machine permitted transitions from `DISPUTED` to `RELEASED_TO_FARMER` via normal release endpoints.
- **Digital Impact**: Filing a dispute did not digitally freeze funds; a counterparty could execute a release while the arbitration desk was reviewing evidence.
- **Architectural Solution**:
  ```java
  if (escrow.getStatus() == EscrowStatus.DISPUTED) {
      throw new IllegalStateException("Cannot release funds while escrow is under active dispute");
  }
  ```
  Resolving a dispute requires formal arbitration resolution by an authorized admin.

---

### 2.4 Premature Escrow Account Initialization
- **Vulnerability**: Escrow accounts could be generated while a trade deal was in `PROPOSED` or `NEGOTIATING` status.
- **Digital Impact**: Buyers could deposit capital into non-binding negotiations, locking funds in unconfirmed trades.
- **Architectural Solution**:
  Enforced strict precondition:
  ```java
  if (deal.getStatus() != TradeDealStatus.ACCEPTED) {
      throw new IllegalStateException("Escrow can only be initiated on accepted trade deals");
  }
  ```

---

## 3. State Machine & Concurrency Problems

### 3.1 Uncontrolled State Machine Jumps
- **Vulnerability**: Generic `PATCH /trades/{id}/status` endpoints allowed clients to pass arbitrary target statuses.
- **Digital Impact**: Trades could transition illegally (e.g. `PROPOSED -> COMPLETED` or `NEGOTIATING -> IN_TRANSIT`), bypassing intermediate escrow funding, carrier dispatch, and inspection steps.
- **Architectural Solution**:
  1. Replaced generic patching with explicit, intent-driven command endpoints (`/accept`, `/cancel`, `/mark-in-transit`, `/confirm-delivery`, `/complete`).
  2. Enforced a deterministic state machine:
     ```text
     PROPOSED ──► ACCEPTED ──► IN_TRANSIT ──► DELIVERED ──► COMPLETED
        │             │             │
        ▼             ▼             ▼
     REJECTED     CANCELLED      DISPUTED
     ```

---

### 3.2 Inventory Concurrency & Overselling Race Conditions
- **Vulnerability**: Non-atomic read-then-write checks on available harvest capacity. Two simultaneous buyer requests could both read 500 kg available and each reserve 400 kg.
- **Digital Impact**: Database committed 800 kg from a 500 kg harvest, causing fulfillment defaults.
- **Architectural Solution**:
  1. Structured produce capacity across three distinct columns: `total_quantity`, `reserved_quantity`, and `sold_quantity`.
  2. Implemented atomic reservation queries at the database layer:
     ```sql
     UPDATE farmer_produce
     SET reserved_quantity = reserved_quantity + :qty
     WHERE id = :id AND (total_quantity - reserved_quantity - sold_quantity) >= :qty;
     ```

---

### 3.3 Insecure Direct Object References (IDOR)
- **Vulnerability**: Fetching records by path variables (`/api/farmers/{id}`, `/api/trades/{id}`, `/api/diagnostics/{id}`) without asserting caller ownership.
- **Digital Impact**: Any authenticated user could enumerate IDs and view private financial deals, buyer procurement strategies, or diagnostic health records.
- **Architectural Solution**:
  Implemented centralized `OwnershipService` to verify that `resource.getUser().getId().equals(authenticatedUser.getId())` before returning private payloads.

---

## 4. Role Separation & Data Persistence Problems

### 4.1 Transporter Role Separation
- **Vulnerability**: Transporters were previously modeled as an optional profile flag on farmer or buyer accounts, allowing role switching and unauthorized rate modifications.
- **Digital Impact**: Farmers could fabricate transport options; lack of role security boundaries.
- **Architectural Solution**:
  1. Created dedicated `ROLE_TRANSPORTER` role and separate `transporters` table (`V9__transporters.sql`).
  2. Enforced `hasRole('TRANSPORTER')` in Spring Security on all fleet and trip endpoints.
  3. Built dedicated `TransporterDashboard` with isolated workflows.

---

### 4.2 Location Coordinate Erasure on Partial Updates
- **Vulnerability**: `PUT` profile update handlers replaced entire entity records without checking for nulls.
- **Digital Impact**: Editing a farmer's name or phone number erased their GPS `latitude` and `longitude`, breaking distance calculations and transport matching algorithms.
- **Architectural Solution**:
  Converted profile update services to merge non-null fields, preserving existing spatial coordinates when omitted in request payloads.

---

### 4.3 Multi-Vehicle Fleet Representation
- **Vulnerability**: Transporter entity stored vehicle attributes directly on the user record, limiting an operator to exactly one vehicle.
- **Digital Impact**: Fleet operators owning multiple vehicles could not configure separate capacities, plate numbers, and per-km rates.
- **Architectural Solution**:
  1. Created `transporter_vehicles` table (`V15__transporter_vehicles_and_disputes.sql`).
  2. Implemented `TransporterVehicle` entity, repository, service, and REST controllers (`GET/POST/PUT/DELETE /api/transporters/me/vehicles`).
  3. Added interactive fleet registry and vehicle registration modal in the frontend.

---

## 5. Algorithmic & AI Microservice Problems

### 5.1 Perishability-Aware Logistics Scoring
- **Algorithmic Flaw**: Standard recommendation sorted carriers solely by lowest freight cost, assigning slow or distant trucks to highly perishable crops.
- **Architectural Solution**:
  Dynamic weight adaptation in `TransportService`:
  - **High Perishability** (`VEGETABLE`, `FRUIT`, `FLOWER`, `tomato`, `spinach`, `milk`):
    $$\text{Score} = (0.35 \times \text{Proximity}) + (0.35 \times \text{Reliability}) + (0.20 \times \text{Price}) + (0.10 \times \text{Capacity}) + \text{FavBonus}$$
  - **Low Perishability** (`GRAIN`, `PULSE`, `OIL_SEED`):
    $$\text{Score} = (0.45 \times \text{Price}) + (0.20 \times \text{Capacity}) + (0.20 \times \text{Proximity}) + (0.15 \times \text{Reliability}) + \text{FavBonus}$$

---

### 5.2 Dynamic Transporter Reliability Scoring
- **Algorithmic Flaw**: Equal recommendation weight given to new carriers and seasoned carriers with high on-time track records.
- **Architectural Solution**:
  Implemented dynamic reliability index (`V13__transporter_reliability.sql`):
  $$\text{Reliability} = (0.40 \times \text{RatingNormalized}) + (0.40 \times \text{OnTimeRate}) + (0.20 \times \text{TripVolumeScore})$$
  Transporters achieving score $\ge 95.0$ and $\ge 20$ trips receive `ELITE_CARRIER` badges and priority matching.

---

### 5.3 Client-Side Image Preprocessing & Bandwidth Optimization
- **Performance Bottleneck**: High-resolution camera photos (10 MB to 25 MB) caused upload timeouts on rural 2G/3G networks.
- **Architectural Solution**:
  - Implemented client-side WebAssembly / canvas image downsampling (1024x1024 WebP format).
  - Stripped non-essential EXIF metadata before transmission, reducing upload size by 85%.

---

### 5.4 Point-Estimate Prediction Miscommunication
- **Algorithmic Flaw**: Single-number price predictions created false guarantees in volatile agricultural markets.
- **Architectural Solution**:
  - Converted forecasts to directional trend signals (`UPWARD`, `DOWNWARD`, `STABLE`) with explicit confidence scores (e.g. 84%).
  - Added real-time confidence downgrades during sudden market or weather anomalies.

---

## 6. Full Database Migration Catalog

| Migration File | Description & Entities Created |
| :--- | :--- |
| `V1__schema.sql` | Core `users`, `farmers`, `buyers` tables and RBAC roles. |
| `V2__regional_data.sql` | Master tables for Indian states, districts, and APMC mandis. |
| `V3__seed_data.sql` | Baseline commodities, crop categories, and regional price seeds. |
| `V4__market_prices.sql` | Historical and spot price time-series ledger. |
| `V5__produce_and_requirements.sql` | `farmer_produce` and `buyer_requirements` listings tables. |
| `V6__trade_deals.sql` | `trade_deals` contract table and legal status machine. |
| `V7__escrow_payments.sql` | `escrow_payments` ledger and milestone transition states. |
| `V8__diagnostic_reports.sql` | Crop Doctor AI diagnostic logs and treatment prescriptions. |
| `V9__transporters.sql` | `transporters` and `transport_bookings` tables. |
| `V10__transport_pricing.sql` | Pricing columns (`rate_per_km`, `base_charge`, `distance_km`). |
| `V11__chat_system.sql` | `chat_conversations` and `chat_messages` tables for trade negotiation. |
| `V12__proof_of_pickup_and_delivery.sql` | Columns for 4-digit POP/POD codes and weight discrepancies. |
| `V13__transporter_reliability.sql` | Columns for reliability score, on-time rate, and carrier badges. |
| `V14__favorite_transporters.sql` | `farmer_favorite_transporters` table for carrier bookmarking. |
| `V15__transporter_vehicles_and_disputes.sql` | `transporter_vehicles` fleet table and `trade_disputes` table. |

---

## 7. Summary of Digital Safeguards Enforced

1. **Cryptographic & Token Security**: Stateless JWT authentication, BCrypt password hashing ($> 10$ rounds), and authorization role matchers.
2. **Transactional Database Integrity**: Atomic database updates, foreign key referential integrity with cascading deletes, and unique constraints on bookmarks/deals.
3. **Strict Validation Layers**: Jakarta validation (`@NotNull`, `@NotBlank`, `@Positive`, `@Min`, `@DecimalMin`) across all request DTOs.
4. **Resilient Frontend Design**: Removal of silent mock fallbacks on critical mutations; explicit error banners and status indicators.
5. **Observability**: Flyway version-controlled migrations, structured JSON logging, and clean build pipelines with zero errors.
