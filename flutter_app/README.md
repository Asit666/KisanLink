# KisanLink Multiplatform Flutter App
**Target Platforms:** Android Mobile (`apk` / `appbundle`) & Windows Desktop (`win32` / `msix`)  
**Backend:** Spring Boot 3 (`kisanlink-backend` on port `8080`)  
**Architecture:** Shared codebase, zero server-logic duplication, Riverpod + GoRouter + Dio.

---

## 1. Project Directory Structure

```
flutter_app/
├── lib/
│   ├── app/
│   │   ├── providers.dart        # Riverpod DI & State Notifiers
│   │   ├── router.dart           # GoRouter route guards & navigation
│   │   └── theme.dart            # Agronomic design system (Parchment, Slate, Terracotta)
│   ├── core/
│   │   ├── constants/
│   │   │   └── api_constants.dart # Platform-aware base URLs (Windows: localhost, Android: 10.0.2.2)
│   │   ├── network/
│   │   │   └── api_client.dart    # Dio HTTP client, Bearer interceptors, 401 handling
│   │   └── storage/
│   │       └── secure_storage.dart# Platform-secure JWT token and profile storage
│   ├── models/
│   │   ├── listing.dart          # Farmer produce lots & valuation
│   │   ├── prediction.dart       # AI price forecasts & trajectory
│   │   ├── price.dart            # AGMARKNET live mandi quotes & MSP comparison
│   │   └── user.dart             # Stakeholder identity & role mapping
│   ├── services/
│   │   ├── auth_service.dart     # /api/auth integration & secure session
│   │   ├── farmer_service.dart   # /api/farmers inventory management
│   │   └── market_service.dart   # /api/prices and /api/predictions client
│   ├── features/
│   │   ├── admin/                # Platform oversight & compliance desk
│   │   ├── auth/                 # Multi-role login screen with quick demo profiles
│   │   ├── buyer/                # Wholesale procurement & escrow bidding
│   │   ├── farmer/               # Live rates, AI forecast & produce listing
│   │   ├── fpo/                  # Village intake & weigh-slip lot pooling
│   │   ├── shell/                # AdaptiveScaffold (Mobile bottom bar vs Desktop sidebar)
│   │   └── transporter/          # Fleet operations & dispatch manifests
│   └── main.dart                 # Application entrypoint
├── test/
│   └── models_test.dart          # Domain and DTO serialization unit tests
├── android/                      # Android platform runner & manifest
├── pubspec.yaml                  # Flutter package definition & dependencies
└── analysis_options.yaml         # Linting configuration
```

---

## 2. Multiplatform Endpoint Configuration

| Target Device | Host URL | Note |
|---|---|---|
| **Windows Desktop** | `http://localhost:8080/api` | Connects directly via loopback |
| **Android Emulator** | `http://10.0.2.2:8080/api` | Standard Android Studio emulator loopback alias |
| **Physical Android Device** | `http://<LAN_IP>:8080/api` | Requires same Wi-Fi and Windows Firewall access to port 8080 |

---

## 3. Running the Application

### Prerequisites
- Flutter SDK (v3.19+ or stable channel)
- Java 21 / 25 JDK
- Visual Studio 2022 C++ desktop workload (for Windows desktop runner) or Android Studio SDK

### Commands
```bash
# Fetch Flutter packages
flutter pub get

# Run on Windows Desktop
flutter run -d windows

# Run on Android Device / Emulator
flutter run -d android

# Physical device: configure the backend base URL to the PC LAN address,
# for example http://172.16.10.242:8080/api. Do not use localhost.

# Execute Unit Tests
flutter test test/models_test.dart
```
