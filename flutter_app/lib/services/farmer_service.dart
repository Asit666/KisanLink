import 'package:dio/dio.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/listing.dart';

class FarmerService {
  final ApiClient apiClient;

  FarmerService({required this.apiClient});

  Future<List<ProduceListing>> getMyListings() async {
    try {
      final response = await apiClient.get(ApiConstants.farmerListings);
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        List contentList = [];
        if (data is List) {
          contentList = data;
        } else if (data is Map && data['content'] is List) {
          contentList = data['content'] as List;
        }
        return contentList
            .map((item) => ProduceListing.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } on DioException catch (_) {
      // Fallback to local listings
    } catch (_) {}

    return _canonicalListings();
  }

  Future<ProduceListing> createListing(ProduceListing listing) async {
    try {
      final response = await apiClient.post(
        ApiConstants.farmerListings,
        data: listing.toJson(),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return ProduceListing.fromJson(response.data as Map<String, dynamic>);
      }
    } on DioException catch (_) {
      // Offline / dev fallback
    } catch (_) {}

    return listing;
  }

  List<ProduceListing> _canonicalListings() {
    return [
      ProduceListing(
        id: 'lst_01',
        cropName: 'Soybean (JS-335)',
        variety: 'Oilseed Grade 1',
        quantityQuintals: 45.0,
        expectedPricePerQuintal: 4750.0,
        qualityGrade: 'FAQ Grade A',
        harvestDate: '10 Sep 2026',
        status: 'ACTIVE',
        location: 'Khargone, MP',
      ),
      ProduceListing(
        id: 'lst_02',
        cropName: 'Red Onion (Garwa)',
        variety: 'Nashik Red',
        quantityQuintals: 80.0,
        expectedPricePerQuintal: 2200.0,
        qualityGrade: 'Export Grade (55mm+)',
        harvestDate: '08 Sep 2026',
        status: 'POOLED',
        location: 'Dindori, MH',
      ),
    ];
  }
}
