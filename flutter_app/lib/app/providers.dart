import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/storage/secure_storage.dart';
import '../models/listing.dart';
import '../models/price.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/farmer_service.dart';
import '../services/market_service.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(
    storage: storage,
    onUnauthorized: () {
      ref.read(authNotifierProvider.notifier).logout();
    },
  );
});

final authServiceProvider = Provider<AuthService>((ref) {
  final client = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthService(apiClient: client, storage: storage);
});

final marketServiceProvider = Provider<MarketService>((ref) {
  final client = ref.watch(apiClientProvider);
  return MarketService(apiClient: client);
});

final farmerServiceProvider = Provider<FarmerService>((ref) {
  final client = ref.watch(apiClientProvider);
  return FarmerService(apiClient: client);
});

// Auth State Notifier
class AuthState {
  final User? user;
  final bool isLoading;
  final String? errorMessage;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.errorMessage,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? errorMessage,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthState()) {
    _initUser();
  }

  Future<void> _initUser() async {
    final user = await _authService.getCurrentUser();
    if (user != null) {
      state = state.copyWith(user: user);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _authService.login(email: email, password: password);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState();
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});

// Live Market Prices Provider
final livePricesFutureProvider = FutureProvider<List<MandiPrice>>((ref) async {
  final marketService = ref.watch(marketServiceProvider);
  return await marketService.getLivePrices();
});

// Farmer Listings State
class FarmerListingsNotifier extends StateNotifier<AsyncValue<List<ProduceListing>>> {
  final FarmerService _farmerService;

  FarmerListingsNotifier(this._farmerService) : super(const AsyncValue.loading()) {
    loadListings();
  }

  Future<void> loadListings() async {
    state = const AsyncValue.loading();
    try {
      final items = await _farmerService.getMyListings();
      state = AsyncValue.data(items);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addListing(ProduceListing listing) async {
    try {
      final created = await _farmerService.createListing(listing);
      state.whenData((current) {
        state = AsyncValue.data([created, ...current]);
      });
    } catch (_) {}
  }
}

final farmerListingsProvider =
    StateNotifierProvider<FarmerListingsNotifier, AsyncValue<List<ProduceListing>>>((ref) {
  final service = ref.watch(farmerServiceProvider);
  return FarmerListingsNotifier(service);
});
