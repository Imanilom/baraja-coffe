import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class AuthService {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  Options _auth(String token) => Options(
    headers: {
      'Authorization': 'Bearer $token',
      'ngrok-skip-browser-warning': true,
    },
  );

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      print('Connecting to: ${AppConfig.baseUrl}/api/auth/signin');
      print('username: $username');
      print('password: $password');

      Response response = await _dio.post(
        '/api/auth/signin',
        options: Options(
          headers: {
            'Origin': AppConfig.baseUrl, // asalnya bebas aja
            'x-requested-with': 'XMLHttpRequest',
            'ngrok-skip-browser-warning': true,
          },
        ),
        data: {"identifier": username, "password": password},
      );

      print('response awal Login');
      return response.data;
    } on DioException catch (e) {
      print('error login: $e');
      throw ApiResponseHandler.handleError(e);
    }
  }

  /// GET /devices-all
  /// Response contoh: { success, data: [...], total }
  Future<Map<String, dynamic>> fetchAllDevices({required String token}) async {
    try {
      final res = await _dio.get(
        '/api/cashierauth/devices-all',
        options: _auth(token),
      );

      final result = Map<String, dynamic>.from(res.data);
      print('hasil dari get device $result');
      return result;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }

  /// GET /devices/:deviceId/cashiers
  /// Response contoh: { success, data: { device: {...}, cashiers: [...] } }
  Future<Map<String, dynamic>> fetchCashiersByDevice({
    required String token,
    required String deviceId,
  }) async {
    try {
      final res = await _dio.get(
        '/api/cashierauth/devices/$deviceId/cashiers',
        options: _auth(token),
      );

      final result = Map<String, dynamic>.from(res.data);

      return result;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }

  /// POST /devices/:deviceId/login-cashier
  /// Body: { cashierId, role? }
  /// Response contoh: { success, message, data: { session, device, cashier } }
  Future<Map<String, dynamic>> loginCashierToDevice({
    required String token,
    required String deviceId,
    required String cashierId,
    String? role,
  }) async {
    try {
      final body = <String, dynamic>{'cashierId': cashierId};
      if (role != null && role.isNotEmpty) body['role'] = role;

      final res = await _dio.post(
        '/api/cashierauth/devices/$deviceId/login-cashier',
        data: body,
        options: _auth(token),
      );

      if (!res.data['success']) {
        throw Exception(res.data['message']);
      }

      final result = Map<String, dynamic>.from(res.data);

      return result;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }

  //logoutCashierFromDevice
  Future<Map<String, dynamic>> logoutCashierFromDevice({
    required String token,
    required String deviceId,
  }) async {
    try {
      final res = await _dio.post(
        '/api/cashierauth/devices/$deviceId/logout',
        options: _auth(token),
      );
      return res.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<void> logout() async {}
}
