import 'package:barajapos/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:barajapos/configs/app_config.dart';

class AuthService {
  final Dio _dio = Dio(
    BaseOptions(baseUrl: AppConfig.baseUrl),
  );

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      print('start login...'); //
      Response response = await _dio.post(
        '/api/auth/signin',
        data: {
          "identifier": username,
          "password": password,
        },
      );
      // print('response awal : ${response.data}');
      print('response awal Login');
      return response.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<void> logout() async {}
}
