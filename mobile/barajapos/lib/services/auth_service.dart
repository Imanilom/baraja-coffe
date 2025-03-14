import 'package:barajapos/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:barajapos/configs/app_config.dart';

class AuthService {
  final Dio _dio = Dio(
    BaseOptions(baseUrl: AppConfig.baseUrl),
  );

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      Response response = await _dio.post(
        '/api/auth/signin',
        data: {
          "identifier": username,
          "password": password,
        },
      );
      print('response awal: $response');
      print('response data awal: ${response.data}');
      return response.data;
    } on DioException catch (e) {
      final error = ApiResponseHandler.handleError(e);
      print('response error awal: $error');
      throw error;
    }
  }

  Future<void> logout() async {}
}
