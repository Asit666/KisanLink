import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../models/user.dart';

class SecureStorageService {
  static const _keyToken = 'kisanlink_auth_token';
  static const _keyUser = 'kisanlink_current_user';
  static const _keyBaseUrl = 'kisanlink_custom_base_url';

  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              wOptions: WindowsOptions(),
            );

  Future<void> saveToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _keyToken);
  }

  Future<void> saveUser(User user) async {
    await _storage.write(key: _keyUser, value: jsonEncode(user.toJson()));
  }

  Future<User?> getUser() async {
    final raw = await _storage.read(key: _keyUser);
    if (raw == null || raw.isEmpty) return null;
    try {
      return User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> saveCustomBaseUrl(String url) async {
    await _storage.write(key: _keyBaseUrl, value: url);
  }

  Future<String?> getCustomBaseUrl() async {
    return await _storage.read(key: _keyBaseUrl);
  }

  Future<void> clearAuth() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyUser);
  }
}
