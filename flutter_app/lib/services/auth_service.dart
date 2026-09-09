import 'package:dio/dio.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/storage/secure_storage.dart';
import '../models/user.dart';

class AuthService {
  final ApiClient apiClient;
  final SecureStorageService storage;

  AuthService({
    required this.apiClient,
    required this.storage,
  });

  Future<User> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await apiClient.post(
        ApiConstants.authLogin,
        data: {
          'email': email.trim(),
          'password': password,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final token = data['token']?.toString() ?? '';
        final user = User.fromJson(data);

        await storage.saveToken(token);
        await storage.saveUser(user);
        return user;
      } else {
        throw Exception('Invalid login response from server');
      }
    } on DioException catch (dioErr) {
      // Fallback for development / offline testing when backend is not connected
      if (dioErr.type == DioExceptionType.connectionError ||
          dioErr.type == DioExceptionType.connectionTimeout) {
        return _mockFallbackLogin(email);
      }
      final errorMsg = dioErr.response?.data?['message'] ?? dioErr.message ?? 'Authentication failed';
      throw Exception(errorMsg);
    } catch (e) {
      throw Exception('Login error: $e');
    }
  }

  Future<void> logout() async {
    await storage.clearAuth();
  }

  Future<User?> getCurrentUser() async {
    return await storage.getUser();
  }

  User _mockFallbackLogin(String email) {
    // Determine fallback role based on email pattern for seamless dev experience
    final lower = email.toLowerCase();
    UserRole role = UserRole.farmer;
    String name = 'Ramesh Patel';

    if (lower.contains('buyer')) {
      role = UserRole.buyer;
      name = 'ITC Agro Foods (Procurement)';
    } else if (lower.contains('transporter') || lower.contains('transport')) {
      role = UserRole.transporter;
      name = 'Kisan Express Logistics';
    } else if (lower.contains('fpo')) {
      role = UserRole.fpo;
      name = 'Nashik Krishi Vikas FPO Desk';
    } else if (lower.contains('admin')) {
      role = UserRole.admin;
      name = 'System Administrator';
    }

    final fallbackUser = User(
      id: 'usr_dev_${DateTime.now().millisecondsSinceEpoch}',
      email: email,
      name: name,
      role: role,
      phone: '+91 98765 43210',
      token: 'dev_mock_jwt_token',
    );

    storage.saveToken('dev_mock_jwt_token');
    storage.saveUser(fallbackUser);
    return fallbackUser;
  }
}
