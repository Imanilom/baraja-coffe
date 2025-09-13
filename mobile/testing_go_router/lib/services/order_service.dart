import 'package:hive_ce_flutter/adapters.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/enums/payment_method.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';

class OrderService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> createOrder(OrderDetailModel orderDetail) async {
    // final requestBody = orderDetail.toJson();
    try {
      print('start create order...');
      print('request body: ${createOrderRequest(orderDetail)}');
      // print('orderDetail: ${orderDetail.payment!.method.toString()}');
      Response response = await _dio.post(
        '/api/unified-order',
        data: createOrderRequest(orderDetail),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        ),
      );
      print('response create order: ${response.data}');
      if (orderDetail.source != 'App') {
        Response chargeResponse = await _dio.post(
          '/api/cashierCharge',
          data: createChargeRequest(
            response.data['orderId'],
            orderDetail.grandTotal,
            orderDetail.paymentMethod!,
          ),
          options: Options(
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        );
        print('response charge: ${chargeResponse.data}');
        if (chargeResponse.statusCode != 200) {
          throw Exception('Failed to create charge');
        }
      }

      print('response status code create order: ${response.statusCode}');
      return response.data;
    } on DioException catch (e) {
      print('error create order: ${e.response?.data}');
      throw ApiResponseHandler.handleError(e);
    }
  }

  // Future<List<dynamic>> fetchPendingOrders(String outletId) async {
  Future<Map<String, dynamic>> fetchPendingOrders(String outletId) async {
    try {
      Response response = await _dio.get(
        '/api/pending-orders/$outletId',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        ),
      );

      return response.data;
    } on DioException catch (e) {
      print('error fetch pending orders: ${e.response?.data}');
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<Map<String, dynamic>> confirmPaidOrder(
    WidgetRef ref,
    String? orderId,
    String source,
  ) async {
    final box = Hive.box('userBox');
    final cashierId = box.get('cashier').id;

    try {
      if (orderId == null || cashierId == null) {
        throw Exception("orderId atau cashierId tidak boleh null");
      }
      Response response = await _dio.post(
        '/api/order/cashier/confirm-order',
        data: {'order_id': orderId, 'cashier_id': cashierId, 'source': source},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
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

  Future<Map<String, dynamic>> confirmPendingOrder(
    WidgetRef ref,
    OrderDetailModel orderDetail,
  ) async {
    final box = Hive.box('userBox');
    final cashierId = box.get('cashier').id;

    print('cashierId: $cashierId , orderId: ${orderDetail.orderId}');

    try {
      if (orderDetail.orderId == null) {
        throw Exception("orderId atau cashierId tidak boleh null");
      }
      Response response = await _dio.post(
        '/api/confirm-order/${orderDetail.orderId}',
        data: {
          //cashierId dari authCashierProvider
          'cashierId': cashierId,
          'jobId': orderDetail.orderId,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
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
            'ngrok-skip-browser-warning': 'true',
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
  print('order.cashierId: ${order.cashierId}');
  print('order item first: ${order.items.first.menuItem.id}');
  print('username: ${order.user}');
  print('payment method: ${order.paymentMethod}');

  final box = Hive.box('userBox');
  final user = box.get('user') as UserModel;

  return {
    'order_id': order.orderId,
    'user_id': order.userId ?? "",
    'user': order.user,
    'cashierId': order.cashierId ?? '',
    'items':
        order.items.map((item) {
          return {
            'id': item.menuItem.id, // Ambil id menu aja
            'quantity': item.quantity,
            'selectedAddons':
                item.selectedAddons.map((addon) {
                  return {
                    'id': addon.id,
                    'options':
                        addon.options
                            ?.map((option) => {'id': option.id})
                            .toList(),
                  };
                }).toList(),
            'selectedToppings':
                item.selectedToppings
                    .map((topping) => {'id': topping.id})
                    .toList(),
          };
        }).toList(),
    'orderType': OrderTypeExtension.orderTypeToJson(order.orderType),
    'tableNumber': order.tableNumber ?? 1,
    'paymentMethod': order.paymentMethod ?? 'Cash',
    'outlet': user.outletId,
    'totalPrice': order.grandTotal,
    'source': "Cashier",
  };
}

Map<String, dynamic> createChargeRequest(
  String orderId,
  int grandTotal,
  String paymentType,
) {
  return {
    'payment_type': paymentType,
    'is_down_payment': false,
    'down_payment_amount': 0,
    'remaining_payment': 0,
    'order_id': orderId,
    'gross_amount': grandTotal,
  };
}
