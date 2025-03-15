import 'package:barajapos/providers/message_provider.dart';
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
  return AuthNotifier(ref.read(authRepositoryProvider), ref);
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _authRepository;
  final Ref ref;

  AuthNotifier(this._authRepository, this.ref)
      : super(const AsyncValue.loading()) {
    checkLoginStatus(); // 🔹 Cek login saat aplikasi pertama kali dibuka
  }

  bool get isAuthenticated => state.value != null;

  @override
  Stream<AsyncValue<UserModel?>> get stream async* {
    yield state;
  }

  Future<void> login(String username, String password) async {
    try {
      final user = await _authRepository.login(username, password);
      print('null tidak $user');
      print('login berhasil akhir!');
      state = AsyncValue.data(user);
    } catch (e) {
      print('login gagal akhir!');
      print(e);
      //menyimpan state error ke messageProvider
      ref.read(messageProvider.notifier).showMessage(e.toString());
      // state = AsyncValue.error(e, StackTrace.current);
      print('ini isi dari state: $state');
      print('ini isi dari state value: ${state.value}');
    }
  }

  Future<void> logout() async {
    await _authRepository.logout();
    state = const AsyncValue.data(null);
  }

  Future<void> checkLoginStatus() async {
    try {
      final user = await _authRepository.getCurrentUser();
      print('cek login status disini dulu ngga?: $user');
      state = AsyncValue.data(user);
    } catch (e, stackTrace) {
      print("cek login status disini dulu ngga?: $e");
      state = AsyncValue.error(e, stackTrace);
    }
  }
}
