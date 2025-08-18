import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class TaxAndServiceService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> fetchTaxAndServices() async {
    try {
      final response = await _dio.get(
        '/api/tax-service/cashier',
        options: Options(headers: {'ngrok-skip-browser-warning': true}),
      );

      print('response tax and service: ${response.data}');

      return response.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }
}
