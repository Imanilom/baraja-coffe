import 'package:barajapos/configs/app_config.dart';
import 'package:dio/dio.dart';

class OrderHistoryService {
  // This class will handle
  // the order history data and operations

  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConfig.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  Future<Map<String, dynamic>> fetchOrderHistory(String cashierId) async {
    try {
      final response = await _dio.get('/api/orders/cashier/$cashierId');

      if (response.statusCode != 200) {
        throw Exception('Failed to load order history: ${response.statusCode}');
      }

      if (response.data == null) {
        throw Exception('No data found for order history');
      }

      return response.data;
    } on DioException catch (e) {
      print('DioException: ${e.message}');
      throw e.error ?? Exception('Failed to fetch order history: ${e.message}');
    }
  }
}
