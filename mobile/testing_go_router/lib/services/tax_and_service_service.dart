import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class TaxAndServiceService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> fetchTaxAndServices() async {
    try {
      final response = await _dio.get(
        '/api/tax-service/cashier',
        options: Options(headers: {'ngrok-skip-browser-warning': true}),
      );

      AppLogger.debug('response tax and service: ${response.data}');

      return response.data;
    } on DioException catch (e) {
      AppLogger.error('error fetch tax and service', error: e.response?.data);
      throw ApiResponseHandler.handleError(e);
    }
  }
}
