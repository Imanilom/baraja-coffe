import 'package:dio/dio.dart';
import 'package:barajapos/configs/app_config.dart';

class AuthService {
  final Dio _dio = Dio(
    BaseOptions(baseUrl: AppConfig.baseUrl),
  ); // Ganti URL API kamu

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      Response response = await _dio.post(
        '/api/auth/signin',
        data: {
          "identifier": username,
          "password": password,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception("Login gagal: ${e.toString()}");
    }
  }

  Future<void> logout() async {}
}
