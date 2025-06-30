import 'package:kasirbaraja/configs/app_config.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/models/try/activity_model.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

class OrderHistoryService {
  // This class will handle
  // the order history data and operations

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  Future<Map<String, dynamic>> fetchOrderHistory(String cashierId) async {
    try {
      print('Fetching order history for cashierId: $cashierId');
      final response = await _dio.get('/api/orders/cashier/$cashierId');

      if (response.statusCode != 200) {
        throw Exception('Failed to load order history: ${response.statusCode}');
      }

      if (response.data == null) {
        throw Exception('No data found for order history');
      }

      print('Order history data: ${response.data}');

      return response.data;
    } on DioException catch (e) {
      print('DioException: ${e.message}');
      throw e.error ?? Exception('Failed to fetch order history: ${e.message}');
    }
  }
}

final Dio _dios = Dio(
  BaseOptions(
    baseUrl: 'https://dummyjson.com',
    headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
  ),
);
final activityProvider = FutureProvider.autoDispose<Activity>((ref) async {
  try {
    final response = await _dios.get('/quotes/random');
    print('activity: ${response.data}');
    return Activity.fromJson(response.data);
  } on DioException catch (e) {
    print('DioException: ${e.message}');
    throw e.error ?? Exception('Failed to fetch activity: ${e.message}');
  }
});
