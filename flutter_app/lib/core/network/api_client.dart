import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  late final Dio dio;
  final SecureStorageService storage;
  final VoidCallback? onUnauthorized;

  ApiClient({
    required this.storage,
    this.onUnauthorized,
  }) {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.defaultBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  Future<void> updateBaseUrl(String newUrl) async {
    dio.options.baseUrl = newUrl;
    await storage.saveCustomBaseUrl(newUrl);
  }

  void _setupInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Check if custom base URL exists in storage
          final customUrl = await storage.getCustomBaseUrl();
          if (customUrl != null && customUrl.isNotEmpty) {
            options.baseUrl = customUrl;
          }

          // Attach JWT Token if available
          final token = await storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          if (kDebugMode) {
            debugPrint('[API REQ] ${options.method} ${options.baseUrl}${options.path}');
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            debugPrint('[API RES] ${response.statusCode} ${response.requestOptions.path}');
          }
          return handler.next(response);
        },
        onError: (DioException error, handler) async {
          if (kDebugMode) {
            debugPrint('[API ERR] ${error.response?.statusCode}: ${error.message} at ${error.requestOptions.path}');
          }

          // Handle 401 Unauthorized
          if (error.response?.statusCode == 401) {
            await storage.clearAuth();
            onUnauthorized?.call();
          }

          return handler.next(error);
        },
      ),
    );
  }

  // Generic Request Wrappers
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}
