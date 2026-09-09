import 'package:flutter_test/flutter_test.dart';
import 'package:kisanlink_app/models/listing.dart';
import 'package:kisanlink_app/models/prediction.dart';
import 'package:kisanlink_app/models/price.dart';
import 'package:kisanlink_app/models/user.dart';

void main() {
  group('KisanLink Flutter Models & Domain Mapping Tests', () {
    test('UserRole parsing accurately maps Spring Boot Role entity', () {
      expect(UserRole.fromString('FARMER'), UserRole.farmer);
      expect(UserRole.fromString('ROLE_FARMER'), UserRole.farmer);
      expect(UserRole.fromString('BUYER'), UserRole.buyer);
      expect(UserRole.fromString('TRANSPORTER'), UserRole.transporter);
      expect(UserRole.fromString('FPO'), UserRole.fpo);
      expect(UserRole.fromString('ADMIN'), UserRole.admin);
      expect(UserRole.farmer.toApiRole(), 'FARMER');
    });

    test('User JSON deserialization and copyWith', () {
      final json = {
        'userId': 'usr_101',
        'email': 'farmer@kisanlink.in',
        'name': 'Ramesh Patel',
        'role': 'FARMER',
        'phone': '+91 98765 43210',
        'token': 'jwt_test_token_123',
      };
      final user = User.fromJson(json);
      expect(user.id, 'usr_101');
      expect(user.role, UserRole.farmer);
      expect(user.token, 'jwt_test_token_123');

      final updated = user.copyWith(name: 'Rameshwar Patel');
      expect(updated.name, 'Rameshwar Patel');
      expect(updated.id, 'usr_101');
    });

    test('MandiPrice correctly computes MSP threshold comparison', () {
      final priceAbove = MandiPrice(
        id: 'p1',
        cropName: 'Soybean',
        marketName: 'Indore',
        state: 'MP',
        modalPrice: 4800.0,
        minPrice: 4500.0,
        maxPrice: 4900.0,
        mspPrice: 4600.0,
        arrivalDate: 'Today',
      );
      expect(priceAbove.isAboveMsp, isTrue);

      final priceBelow = MandiPrice(
        id: 'p2',
        cropName: 'Wheat',
        marketName: 'Khanna',
        state: 'Punjab',
        modalPrice: 2100.0,
        minPrice: 2000.0,
        maxPrice: 2200.0,
        mspPrice: 2275.0,
        arrivalDate: 'Today',
      );
      expect(priceBelow.isAboveMsp, isFalse);
    });

    test('PricePrediction handles bullish and bearish sentiment', () {
      final bullish = PricePrediction(
        cropName: 'Soybean',
        currentPrice: 4720.0,
        forecastPrice7d: 4850.0,
        forecastPrice15d: 4980.0,
        forecastPrice30d: 5120.0,
        trend: 'BULLISH',
        confidencePercent: 88,
        recommendation: 'HOLD',
      );
      expect(bullish.isBullish, isTrue);
      expect(bullish.isBearish, isFalse);
    });

    test('ProduceListing computes accurate total valuation', () {
      final listing = ProduceListing(
        id: 'lst_1',
        cropName: 'Soybean',
        variety: 'JS-335',
        quantityQuintals: 50.0,
        expectedPricePerQuintal: 4800.0,
        qualityGrade: 'FAQ Grade A',
        harvestDate: '10 Sep 2026',
        status: 'ACTIVE',
        location: 'Khargone Farm Gate',
      );
      expect(listing.totalValuation, 240000.0);
    });
  });
}
