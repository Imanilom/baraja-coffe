import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class PaymentMethodService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> fetchPaymentMethods() async {
    try {
      final response = await _dio.get(
        '/api/paymentlist/payment-methods-and-types',
        options: Options(headers: {'ngrok-skip-browser-warning': true}),
      );

      return response.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }
}
