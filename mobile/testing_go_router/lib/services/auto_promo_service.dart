import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';
import 'api_response_handler.dart';

class AutoPromoService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<List<dynamic>> fetchAutoPromos() async {
    try {
      final response = await _dio.get(
        '/api/promotion/autopromos',
        options: Options(headers: {'ngrok-skip-browser-warning': true}),
      );
      print('response auto promos: ${response.data}');
      return response.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }
}
