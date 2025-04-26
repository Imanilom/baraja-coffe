import 'package:barajapos/providers/message_provider.dart';
import 'package:barajapos/services/hive_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import '../models/adapter/user.model.dart';
import '../models/adapter/cashier.model.dart';
import '../repositories/auth_repository.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import 'package:bcrypt/bcrypt.dart';
import 'package:collection/collection.dart';

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
    // await _authRepository.logout();
    state = const AsyncValue.data(null);
    ref.read(selectedCashierProvider.notifier).state = null;
    ref.read(messageProvider.notifier).clearMessage();
    //delete data user di hive
    final box = Hive.box('userBox');
    await box.delete('user');
    //delete data menuitem
    await HiveService.clearMenuItems();
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

class CashierNotifier extends StateNotifier<AsyncValue<CashierModel?>> {
  final Ref ref;

  CashierNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<void> login(CashierModel cashier) async {
    state = AsyncValue.data(cashier);
  }

  Future<void> logincashier(CashierModel cashier, String pinCashier) async {
    try {
      final box = Hive.box('userBox');
      final manager = box.get('user') as UserModel?;

      if (manager == null || manager.cashiers == null) {
        throw Exception("Data manager tidak ditemukan");
      }

      // Cari kasir berdasarkan ID
      final matchedCashier = manager.cashiers!.firstWhereOrNull(
        (c) => c.id == cashier.id,
      );

      // Validasi PIN
      if (matchedCashier == null ||
          !BCrypt.checkpw(pinCashier, matchedCashier.password!)) {
        throw Exception("PIN salah");
      }

      // Jika berhasil, set state ke kasir yang login
      state = AsyncValue.data(matchedCashier);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      ref.read(messageProvider.notifier).showMessage(e.toString());
    }
  }

  void logout() {
    state = const AsyncValue.data(null);
    ref.read(selectedCashierProvider.notifier).state = null;
  }
}

final authCashierProvider =
    StateNotifierProvider<CashierNotifier, AsyncValue<CashierModel?>>(
  (ref) => CashierNotifier(ref),
);

//state onselected cashier
final selectedCashierProvider = StateProvider<CashierModel?>((ref) => null);
