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
- Development sample data for Tomato, Ranchi Main Mandi, and two modal prices.
- Root health endpoint: `GET /`.
- Password hashes excluded from JSON responses.
- Authentication response includes both `userId` and role-specific `profileId`.

## Completed frontend work
- React/Vite market dashboard in `frontend/src/App.jsx`.
- Responsive visual design in `frontend/src/styles.css`.
- Market pulse and crop board using backend APIs.
- Farmer and buyer registration.
- Login and logout with JWT stored in localStorage.
- Farmer produce entry.
- Buyer requirement posting.
- Recommendation request and net-return display.
- Farmer/buyer profile and location form.
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
3. Add integration tests for registration, login, role authorization, profile updates, produce, buyer requirements, and recommendations.
4. Harden ownership checks for farmer/buyer/profile/produce/requirement endpoints.
5. Add configurable transport rates and weighted recommendation scoring.
6. Add market map and nearby-market endpoint with real distance/routing data.
7. Improve prediction with historical data and clearly labeled confidence intervals.
8. Add frontend navigation/views for profile, prices, predictions, notifications, buyer matching, and map.
9. Add production configuration and remove development defaults/secrets.

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
