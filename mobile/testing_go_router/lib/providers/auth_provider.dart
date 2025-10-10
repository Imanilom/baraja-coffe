import 'package:flutter/material.dart';
import 'package:kasirbaraja/models/device.model.dart';
import 'package:kasirbaraja/providers/message_provider.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import '../models/user.model.dart';
import '../models/cashier.model.dart';
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

final authDeviceRepositoryProvider = Provider((ref) => AuthDevice());

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
      state = AsyncValue.data(user);
    } catch (e) {
      ref.read(messageProvider.notifier).showMessage(e.toString());
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
    print('cek login data cashier: $cashier');
    await HiveService.saveCashier(cashier);
    await ref
        .read(tryAuthProvider.notifier)
        .loginCashier(cashier.id!, cashier.password!);
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

      print('cek login data cashier: $matchedCashier');

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

enum AuthStatus { authenticated, needDataSync, unauthenticated, needPin }

class TryAuthNotifier extends StateNotifier<AsyncValue<AuthStatus>> {
  TryAuthNotifier(this._authRepository, this.ref)
    : super(const AsyncValue.loading()) {
    checkLoginStatus();
  }

  final AuthRepository _authRepository;
  final Ref ref;

  Future<bool> _hasRequiredLocalData() async {
    try {
      // Check if all required Hive boxes have data
      final menuItemsBox = HiveService.menuItemsBox;
      final taxServiceBox = HiveService.taxAndServiceBox;
      final paymentTypeBox = HiveService.paymentTypeBox;

      return menuItemsBox.isNotEmpty &&
          taxServiceBox.isNotEmpty &&
          paymentTypeBox.isNotEmpty;
    } catch (e) {
      // If boxes are not initialized yet, return false
      debugPrint('Error checking local data: $e');
      return false;
    }
  }

  Future<void> checkLoginStatus() async {
    state = const AsyncValue.loading();
    try {
      final box = Hive.box('userBox');
      final cashier = box.get('cashier') as CashierModel?;
      final user = box.get('user') as UserModel?;
      final sd = HiveService.getCashier();
      print('cek login data cashier sd: $sd');

      if (user != null) {
        if (cashier != null) {
          state = const AsyncValue.data(AuthStatus.authenticated);
          return;
        }
        final syncData = await _hasRequiredLocalData();
        if (syncData) {
          print('to need pin disini');
          state = const AsyncValue.data(AuthStatus.needPin);
        } else {
          state = const AsyncValue.data(AuthStatus.needDataSync);
        }
      } else if (cashier != null) {
        state = const AsyncValue.data(AuthStatus.authenticated);
      } else {
        state = const AsyncValue.data(AuthStatus.unauthenticated);
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<void> logout() async {
    await HiveService.clearAllData();

    ref.read(selectedCashierProvider.notifier).state = null;
    ref.read(messageProvider.notifier).clearMessage();

    state = const AsyncValue.data(AuthStatus.unauthenticated);
  }

  Future<void> login(String username, String password) async {
    try {
      // print('kita berada di try auth provider login manager');
      await _authRepository.login(username, password);
      // print('kita berada di try auth provider login manager');

      //check login status
      await checkLoginStatus();
      // state = const AsyncValue.data(AuthStatus.needPin);
    } catch (e) {
      // state = const AsyncValue.data(AuthStatus.unauthenticated);
      print('login gagal: $e');
    }
  }

  Future<void> loginCashier(String cashierId, String pinCashier) async {
    try {
      state = const AsyncValue.data(AuthStatus.authenticated);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  //logout cashier
  Future<void> logoutCashier() async {
    final box = Hive.box('userBox');
    await box.delete('cashier');
    ref.read(selectedCashierProvider.notifier).state = null;
    ref.read(messageProvider.notifier).clearMessage();
    ref.read(selectedDeviceProvider.notifier).state = null;

    state = const AsyncValue.data(AuthStatus.needPin);
  }
}

final tryAuthProvider =
    StateNotifierProvider<TryAuthNotifier, AsyncValue<AuthStatus>>(
      (ref) => TryAuthNotifier(ref.read(authRepositoryProvider), ref),
    );

// // Provider untuk mendapatkan current cashier yang berhasil login
// final currentCashierProvider = Provider<CashierModel?>((ref) {
//   return ref.watch(authCashierProvider).valueOrNull;
// });

final selectedDeviceProvider = StateProvider<DeviceModel?>((ref) => null);

// devices by outlet/cashier
final devicesProvider = FutureProvider.autoDispose<List<DeviceModel>>((
  ref,
) async {
  final repo = ref.watch(authDeviceRepositoryProvider);
  final cashier = ref.watch(selectedCashierProvider); // depend ke kasir

  if (cashier == null) return <DeviceModel>[];

  try {
    // kalau mau, kirim cashier/outlet id
    final devices = await repo.fetchAllDevices();
    return devices;
  } catch (e) {
    throw Exception('Gagal memuat device: $e');
  }
});
