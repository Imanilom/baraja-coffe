import 'package:hive_ce_flutter/adapters.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/enums/payment_method.dart';
import 'package:kasirbaraja/models/edit_order_ops.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/models/online_order/confirm_order.model.dart';
import 'package:kasirbaraja/models/payments/process_payment_request.dart';

class OrderService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> createOrder(
    OrderDetailModel orderDetail,
    PaymentState paymentData,
  ) async {
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

      print(
        'start create charge... orderId: ${createOrderRequest(orderDetail)}',
      );
      // print(
      //   'start charge request: ${createChargeRequest(response.data['orderId'], orderDetail.grandTotal, orderDetail.paymentMethod!)}',
      // );
      print(
        'paymentData change & amount: ${paymentData.change} ${paymentData.selectedCashAmount}',
      );
      Response chargeResponse = await _dio.post(
        '/api/cashierCharge',
        data: createChargeRequest(
          response.data['orderId'],
          orderDetail.grandTotal,
          orderDetail.paymentMethod!,
          paymentData.isDownPayment,
          paymentData.selectedDownPayment ?? 0,
          paymentData.selectedDownPayment != null
              ? orderDetail.grandTotal - (paymentData.selectedDownPayment ?? 0)
              : 0,
          paymentData.selectedCashAmount ?? 0,
          paymentData.change ?? 0,
        ),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        ),
      );
      print('response charge: ${chargeResponse.data}');
      if (chargeResponse.statusCode != 200) {
        throw Exception('Failed to create charge');
      }

      print('response status code create order: ${response.statusCode}');
      return {
        'orderId': response.data['orderId'],
        'orderNumber': response.data['orderNumber'],
        'paymentStatus': chargeResponse.data['paymentStatus'],
      };
    } on DioException catch (e) {
      print('error create order: $e');
      throw ApiResponseHandler.handleError(e);
    }
  }

  // Future<List<dynamic>> fetchPendingOrders(String outletId) async {
  Future<Map<String, dynamic>> fetchPendingOrders(String outletId) async {
    try {
      Response response = await _dio.get(
        '/api/pending-orders/$outletId',
        data: {
          "sources": ["App", "Web", "Gro"],
        },
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

  Future<Map<String, dynamic>> fetchPendingOrdersCashier(
    String outletId,
  ) async {
    try {
      Response response = await _dio.get(
        '/api/pending-orders/$outletId',
        data: {
          "sources": ["Cashier"],
        },
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

  Future<ConfirmOrderResponse> confirmPaidOrder(
    WidgetRef ref,
    ConfirmOrderRequest request,
  ) async {
    final box = Hive.box('userBox');
    final cashierId = box.get('cashier').id;
    final cashierbox = await HiveService.getCashier();

    try {
      if (cashierId == null) {
        throw Exception("orderId atau cashierId tidak boleh null");
      }
      Response response = await _dio.post(
        '/api/order/cashier/confirm-order',
        data: {
          'order_id': request.orderId,
          'cashier_id': cashierbox!.id ?? cashierId,
          'source': request.source,
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
      if (response.statusCode == 200) {
        return ConfirmOrderResponse.fromJson(response.data);
      } else {
        throw Exception('Failed to confirm order: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('error fetch order detail: ${e.response?.data}');
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<ProcessPaymentResponse> processPaymentOrder(
    ProcessPaymentRequest request,
  ) async {
    print('process payment request: ${request.toJson()}');
    try {
      Response response = await _dio.post(
        '/api/order/cashier/process-payment',
        data: request.toJson(),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        ),
      );

      if (response.statusCode == 200) {
        print('response process payment: ${response.data}');
        return ProcessPaymentResponse.fromJson(response.data);
      } else {
        throw Exception('Failed to process payment: ${response.statusCode}');
      }
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

  Future<OrderDetailModel> fetchOrderDetail(String orderId) async {
    final res = await _dio.get('/api/order/$orderId/cashier');
    final json = res.data['data']?['order'] ?? res.data['data'] ?? res.data;
    print('response fetch order detail: $json');
    final result = OrderDetailModel.fromJson(json);
    print('result fetch order detail: $result');
    return result;
  }

  Future<Map<String, dynamic>> deleteOrderItemAtOrder({
    required String orderId,
    required String menuItemId,
  }) async {
    try {
      if (orderId.isEmpty || menuItemId.isEmpty) {
        throw Exception("orderId atau menuItemId tidak boleh kosong");
      }

      print('orderId: $orderId, menuItemId: $menuItemId');

      final res = await _dio.post(
        '/api/order/delete-order-item',
        data: {'order_id': orderId, 'menu_item_id': menuItemId},
      );

      if (res.data['success'] == true) {
        return res.data;
      } else {
        throw Exception('Failed to delete order item: ${res.data['message']}');
      }
    } catch (e) {
      throw Exception('Failed to delete order item: $e');
    }
  }

  //patchOrder,
  Future<Map<String, dynamic>> patchOrder({
    required String orderId,
    required Map<String, dynamic> patchData,
  }) async {
    try {
      if (orderId.isEmpty || patchData.isEmpty) {
        throw Exception("orderId atau patchData tidak boleh kosong");
      }

      print('orderId: $orderId, patchData: $patchData');

      final res = await _dio.patch(
        '/api/order/patch-order/$orderId',
        data: patchData,
      );

      if (res.data['success'] == true) {
        return res.data;
      } else {
        throw Exception('Failed to patch order: ${res.data['message']}');
      }
    } catch (e) {
      throw Exception('Failed to patch order: $e');
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
  final now = DateTime.now().toUtc().add(Duration(hours: 7));
  print(now);
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
            'notes': item.notes,
            'dineType': OrderTypeExtension.orderTypeToJson(item.orderType),
          };
        }).toList(),
    'orderType': OrderTypeExtension.orderTypeToJson(order.orderType),
    'tableNumber': order.tableNumber ?? 1,
    'paymentMethod': order.paymentMethod ?? 'Cash',
    'outletId': user.outletId,
    'outlet': user.outletId,
    'totalPrice': order.grandTotal,
    'source': "Cashier",
    'isOpenBill': order.isOpenBill,
    'isSplitPayment': order.isSplitPayment,
    'customAmountItems':
        order.customAmountItems != null
            ? order.customAmountItems?.map((item) {
              return {
                'name': item.name,
                'description': item.description,
                'amount': item.amount,
                'orderType': OrderTypeExtension.orderTypeToJson(
                  item.orderType ?? OrderType.dineIn,
                ),
              };
            }).toList()
            : [],
    // 'createdAtWIB': now,
    // 'updatedAtWIB' : now
  };
}

Map<String, dynamic> createChargeRequest(
  String orderId,
  int grandTotal,
  String paymentType,
  bool isDownPayment,
  int downPaymentAmount,
  int remainingPayment,
  int tenderedAmount,
  int changeAmount,
) {
  print(
    'create charge orderId: $orderId, grandTotal: $grandTotal, paymentType: $paymentType',
  );

  return {
    'payment_type': paymentType,
    'is_down_payment': isDownPayment,
    'down_payment_amount': downPaymentAmount,
    'remaining_payment': remainingPayment,
    'order_id': orderId,
    'gross_amount': grandTotal,
    'tendered_amount': tenderedAmount,
    'change_amount': changeAmount,
  };
}
