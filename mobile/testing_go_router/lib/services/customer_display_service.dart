import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';
import 'package:flutter/foundation.dart';

class CustomerDisplayService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<bool> syncCart({
    required String deviceId,
    required List<Map<String, dynamic>> cartItems,
    required num subTotal,
    required num tax,
    required num discount,
    required num grandTotal,
  }) async {
    try {
      final response = await _dio.post(
        '/api/customer-display/sync-cart',
        data: {
          'deviceId': deviceId,
          'cartItems': cartItems,
          'subTotal': subTotal,
          'tax': tax,
          'discount': discount,
          'grandTotal': grandTotal,
        },
      );
      return response.data['success'] == true;
    } catch (e) {
      debugPrint('Error syncing cart to customer display: $e');
      return false;
    }
  }

  Future<bool> showQris({
    required String deviceId,
    required String qrString,
    required num amount,
    required String orderId,
  }) async {
    try {
      final response = await _dio.post(
        '/api/customer-display/show-qris',
        data: {
          'deviceId': deviceId,
          'qrString': qrString,
          'amount': amount,
          'orderId': orderId,
        },
      );
      return response.data['success'] == true;
    } catch (e) {
      debugPrint('Error showing QRIS to customer display: $e');
      return false;
    }
  }

  Future<bool> clearDisplay({
    required String deviceId,
    String? message,
  }) async {
    try {
      final response = await _dio.post(
        '/api/customer-display/clear',
        data: {
          'deviceId': deviceId,
          'message': message,
        },
      );
      return response.data['success'] == true;
    } catch (e) {
      debugPrint('Error clearing customer display: $e');
      return false;
    }
  }
}

final customerDisplayService = CustomerDisplayService();
