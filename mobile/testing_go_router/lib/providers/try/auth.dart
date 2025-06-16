import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/user.model.dart';
import '../../repositories/auth_repository.dart';
import '../../services/auth_service.dart';
import '../../services/storage_service.dart';

/// Provider untuk AuthService
final authServiceProvider = Provider<AuthService>((ref) => AuthService());

/// Provider untuk StorageService
final storageServiceProvider = Provider<StorageService>(
  (ref) => StorageService(),
);

/// Provider untuk AuthRepository, mengelola komunikasi dengan API dan penyimpanan token
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.read(authServiceProvider),
    ref.read(storageServiceProvider),
  );
});

/// StateNotifierProvider untuk mengelola status autentikasi
final authProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
      return AuthNotifier(ref.read(authRepositoryProvider));
    });

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _authRepository;

  AuthNotifier(this._authRepository) : super(const AsyncValue.data(null));

  /// Mengecek apakah user sudah login berdasarkan state saat ini
  bool get isAuthenticated => state.value != null;

  /// Fungsi untuk login
  Future<void> login(String username, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authRepository.login(username, password);
      state = AsyncValue.data(user);
    } catch (e, stackTrace) {
      print("Login gagal: $e");
      state = AsyncValue.error(e, stackTrace);
    }
  }

  /// Fungsi untuk logout
  Future<void> logout() async {
    try {
      await _authRepository.logout();
      state = const AsyncValue.data(null);
    } catch (e, stackTrace) {
      print("Logout gagal: $e");
      state = AsyncValue.error(e, stackTrace);
    }
  }

  /// Fungsi untuk mengecek status login (misalnya saat aplikasi dibuka kembali)
  Future<void> checkAuthStatus() async {
    try {
      final user = await _authRepository.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }
}
