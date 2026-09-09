import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConstants {
  /// Resolves the default backend base URL according to the current target platform.
  /// Android emulator maps host machine localhost to 10.0.2.2.
  /// Windows desktop connects directly to localhost:8080.
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:8080/api';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8080/api';
    }
    return 'http://localhost:8080/api';
  }

  // Auth
  static const String authLogin = '/auth/login';
  static const String authRegister = '/auth/register';
  static const String authMe = '/auth/me';
  static const String authRefresh = '/auth/refresh';

  // Crops & Prices
  static const String crops = '/crops';
  static const String livePrices = '/prices/live';
  static const String priceTrends = '/prices/trends';
  static const String mspPrices = '/prices/msp';
  static const String predictions = '/predictions';

  // Farmer Features
  static const String farmerProfile = '/farmers/profile';
  static const String farmerListings = '/farmers/listings';
  static const String farmerAnalytics = '/farmers/analytics';
  static const String farmerNetRealization = '/farmers/analytics/net-realization';

  // Buyer Features
  static const String buyerProfile = '/buyers/profile';
  static const String exploreLots = '/buyers/explore-lots';
  static const String demands = '/demands';

  // Transporter Features
  static const String transporterProfile = '/transporters/profile';
  static const String transporterVehicles = '/transporters/vehicles';
  static const String transportOrders = '/transport/orders';

  // FPO Features
  static const String fpoIntakeLogs = '/fpo/intake-logs';
  static const String fpoMembers = '/fpo/members';
  static const String lots = '/lots';

  // Trade & Escrow
  static const String offers = '/offers';
  static const String deals = '/deals';
  static const String escrow = '/escrow';

  // Health
  static const String health = '/health';
}
