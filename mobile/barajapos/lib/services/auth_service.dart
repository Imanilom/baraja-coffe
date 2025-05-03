import 'package:barajapos/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:barajapos/configs/app_config.dart';

class AuthService {
  final Dio _dio = Dio(
    BaseOptions(baseUrl: AppConfig.baseUrl),
  );

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      print('Connecting to: ${AppConfig.baseUrl}/api/auth/signin');
      print('username: $username');
      print('password: $password');

      Response response = await _dio.post(
        '/api/auth/signin',
        options: Options(headers: {
          'Origin': AppConfig.baseUrl, // asalnya bebas aja
          'x-requested-with': 'XMLHttpRequest',
          'ngrok-skip-browser-warning': true,
        }),
        data: {
          "identifier": username,
          "password": password,
        },
      );
      // if (response.statusCode == 200) {
      //   print('Login successful: ${response.data}');
      // } else {
      //   print('Login failed: ${response.statusCode}');
      // }
      // print('response awal : ${response.data}');
      print('response awal Login');
      return response.data;
    } on DioException catch (e) {
      print('error login: $e');
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<void> logout() async {}
}
