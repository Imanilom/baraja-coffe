import 'package:kasirbaraja/models/cashier.model.dart';

import '../models/user.model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import '../services/hive_service.dart';
import '../models/device.model.dart';

class AuthRepository {
  final AuthService _authService;
  final StorageService _storage;

  AuthRepository(this._authService, this._storage);

  Future<UserModel> login(String username, String password) async {
    try {
      final data = await _authService.login(username, password);
      final userData = UserModel.fromJson(data);

      await _storage.saveDetailUser(userData);
      await _storage.saveUserData(userData.token, userData.id);
      AppLogger.info('Login successful for outlet: ${userData.outletId}');
      //masukan data user ke hive?
      await HiveService.saveUser(userData);

      return userData;
    } catch (e) {
      AppLogger.error('Login failed', error: e);
      rethrow;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  Future<UserModel?> getCurrentUser() async {
    final token = await _storage.getToken();
    if (token == null) return null;

    try {
      if (JwtDecoder.isExpired(token)) {
        await logout(); // 🔹 Hapus token jika sudah expired
        return null;
      }
      final userData = await _storage.getDetailUser();
      return userData;
    } catch (e) {
      return null; // 🔹 Jika API gagal, anggap user tidak login
    }
  }
}

class AuthDevice {
  final AuthService _authService = AuthService();
  //fetch all devices
  Future<List<DeviceModel>> fetchAllDevices() async {
    final token = await HiveService.userToken;
    // final deviceBox = Hive.box<DeviceModel>('devices');

    try {
      final response = await _authService.fetchAllDevices(token: token);

      final data = response['data'] as List<dynamic>;
      final devices = data.map((json) => DeviceModel.fromJson(json)).toList();
      // for (var device in devices) {
      //   await deviceBox.put(device.id, device);
      // }

      AppLogger.debug('Devices fetched: ${devices.length}');

      return devices;
    } catch (e) {
      AppLogger.error('error saat convert to model device', error: e);
      throw Exception('Failed to fetch devices: $e');
    }
  }

  //fetch cashiers by device
  Future<Map<String, dynamic>> fetchCashiersByDevice(String deviceId) async {
    final token = await HiveService.userToken;

    final response = await _authService.fetchCashiersByDevice(
      token: token,
      deviceId: deviceId,
    );
    return response['data'] as Map<String, dynamic>;
  }

  //login cashier to device
  Future<bool> loginCashierToDevice(
    CashierModel cashier,
    DeviceModel device,
  ) async {
    try {
      final token = await HiveService.userToken;

      if (device.id.isEmpty) {
        throw Exception('Device tidak valid');
      }
      if (cashier.id == null || cashier.id!.isEmpty) {
        throw Exception('Cashier tidak valid');
      }

      final response = await _authService.loginCashierToDevice(
        token: token,
        deviceId: device.id,
        cashierId: cashier.id!,
      );

      //simpan device ke hive
      await HiveService.saveDevice(device);

      return response['success'] == true;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> logoutCashierFromDevice() async {
    try {
      final token = await HiveService.userToken;
      final device = await HiveService.getDevice();

      if (device == null || device.id.isEmpty) {
        throw Exception('Device tidak valid');
      }

      final res = await _authService.logoutCashierFromDevice(
        token: token,
        deviceId: device.id,
      );

      return res['success'] == true;
    } catch (e) {
      rethrow;
    }
  }
}
