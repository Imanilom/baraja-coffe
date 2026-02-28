import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class EventService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> fetchEvent() async {
    try {
      final response = await _dio.get(
        '/api/event',
        options: Options(headers: {'ngrok-skip-browser-warning': true}),
        // queryParameters: {'limit': '500'},
      );

      return response.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }
}
