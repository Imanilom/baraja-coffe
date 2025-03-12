import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../repositories/auth_repository.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

final authServiceProvider = Provider((ref) => AuthService());
final storageServiceProvider = Provider((ref) => StorageService());
final authRepositoryProvider = Provider(
  (ref) => AuthRepository(
    ref.read(authServiceProvider),
    ref.read(storageServiceProvider),
  ),
);

final authProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _authRepository;

  AuthNotifier(this._authRepository) : super(const AsyncValue.data(null));

  bool get isAuthenticated => state.value != null;

  Future<void> login(String username, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authRepository.login(username, password);
      state = AsyncValue.data(user);
      print("Berhasil login");
    } catch (e) {
      print("Ada error nih :( = $e");
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<void> logout() async {
    await _authRepository.logout();
    state = const AsyncValue.data(null);
  }
}
