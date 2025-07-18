import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:barajapos/configs/app_config.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class OrderService {
  final Dio _dio = Dio(
    BaseOptions(baseUrl: AppConfig.baseUrl),
  );

  Future<Map<String, dynamic>> createOrder(OrderDetailModel orderDetail) async {
    // final requestBody = orderDetail.toJson();
    try {
      print('start create order...');
      print('request body: ${createOrderRequest(orderDetail)}');
      Response response = await _dio.post(
        '/api/order',
        data: createOrderRequest(orderDetail),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
      print('response status code: ${response.statusCode}');
      return response.data;
    } on DioException catch (e) {
      print('error create order: ${e.response?.data}');
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<List<dynamic>> fetchPendingOrders() async {
    try {
      Response response = await _dio.get(
        '/api/pending-orders',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      return response.data as List;
    } on DioException catch (e) {
      print('error fetch pending orders: ${e.response?.data}');
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<Map<String, dynamic>> confirmPendingOrder(
      WidgetRef ref, OrderDetailModel orderDetail) async {
    final cashier = ref.read(authCashierProvider);

    try {
      if (orderDetail.orderId == null) {
        throw Exception("orderId atau cashierId tidak boleh null");
      }
      Response response = await _dio.post(
        '/api/confirm-order',
        data: {
          //cashierId dari authCashierProvider
          'cashierId': cashier.value?.id,
          'orderId': orderDetail.orderId,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('response confirm order: ${response.data}');

      return response.data;
    } on DioException catch (e) {
      print('error fetch order detail: ${e.response?.data}');
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<List<dynamic>> fetchOrderHistory() async {
    try {
      Response response = await _dio.get(
        '/api/order-history',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      return response.data as List;
    } on DioException catch (e) {
      print('error fetch order history: ${e.response?.data}');
      throw ApiResponseHandler.handleError(e);
    }
  }
}

Map<String, dynamic> createOrderRequest(OrderDetailModel order) {
  return {
    'userId': order.customerId ?? "",
    'customerName': order.customerName ?? 'contoh_user',
    'cashierId': order.cashierId ?? '67cbbfff0e9014c516adcda1',
    'phoneNumber': order.phoneNumber ?? '0000',
    'items': order.items.map((item) {
      return {
        'id': item.menuItem.id, // Ambil id menu aja
        'quantity': item.quantity,
        'selectedAddons': [],
        'selectedToppings': [],
      };
    }).toList(),
    'orderType': order.orderType,
    'tableNumber': order.tableNumber ?? 1,
    'paymentMethod': order.paymentMethod ?? 'Cash',
    'totalPrice': order.totalPrice ?? 12000,
  };
}
