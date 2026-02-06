import 'package:hive_ce_flutter/adapters.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/models/order_type.model.dart';
import 'package:kasirbaraja/models/edit_order_item.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/models/device.model.dart';
import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/online_order/confirm_order.model.dart';
import 'package:kasirbaraja/models/payments/process_payment_request.dart';
import 'package:kasirbaraja/utils/payment_details_utils.dart';

class OrderService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> createOrder(
    OrderDetailModel orderDetail, {
    String? idempotencyKey,
  }) async {
    try {
      final payload = createOrderRequest(orderDetail);
      AppLogger.debug('order request: $payload');
      // print('PAYLOAD DISCOUNTS: ${payload['discounts']}');

      Response response = await _dio.post(
        '/api/unified-order',
        data: payload,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            if (idempotencyKey != null) 'x-idempotency-key': idempotencyKey,
          },
        ),
      );
      AppLogger.debug('response create order: ${response.data}');

      return {
        'orderId': response.data['orderId'],
        'orderNumber': response.data['orderNumber'],
        'paymentStatus': 'settlement',
        // 'paymentStatus': chargeResponse.data['paymentStatus'],
      };
    } on DioException catch (e) {
      AppLogger.error('error create order', error: e);
      throw ApiResponseHandler.handleError(e);
    }
  }

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
      AppLogger.error('error fetch pending orders', error: e.response?.data);
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
      AppLogger.error(
        'error fetch pending orders cashier',
        error: e.response?.data,
      );
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

      AppLogger.info('response confirm order: ${response.data}');
      if (response.statusCode == 200) {
        return ConfirmOrderResponse.fromJson(response.data);
      } else {
        throw Exception('Failed to confirm order: ${response.statusCode}');
      }
    } on DioException catch (e) {
      AppLogger.error(
        'error fetch order detail in confirmPaidOrder',
        error: e.response?.data,
      );
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<ProcessPaymentResponse> processPaymentOrder(
    ProcessPaymentRequest request,
  ) async {
    AppLogger.debug('process payment request: ${request.toJson()}');
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
        AppLogger.info('response process payment: ${response.data}');
        return ProcessPaymentResponse.fromJson(response.data);
      } else {
        throw Exception('Failed to process payment: ${response.statusCode}');
      }
    } on DioException catch (e) {
      AppLogger.error(
        'error fetch order detail in processPaymentOrder',
        error: e.response?.data,
      );
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<Map<String, dynamic>> confirmPendingOrder(
    WidgetRef ref,
    OrderDetailModel orderDetail,
  ) async {
    final box = Hive.box('userBox');
    final cashierId = box.get('cashier').id;

    AppLogger.debug('cashierId: $cashierId , orderId: ${orderDetail.orderId}');

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

      AppLogger.info('response confirm order: ${response.data}');

      return response.data;
    } on DioException catch (e) {
      AppLogger.error(
        'error fetch order detail in confirmPendingOrder',
        error: e.response?.data,
      );
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
      AppLogger.error('error fetch order history', error: e.response?.data);
      throw ApiResponseHandler.handleError(e);
    }
  }

  Future<OrderDetailModel> fetchOrderDetail(String orderId) async {
    final res = await _dio.get('/api/order/$orderId/cashier');
    final json = res.data['data']?['order'] ?? res.data['data'] ?? res.data;
    AppLogger.debug('response fetch order detail: $json');
    final result = OrderDetailModel.fromJson(json);
    AppLogger.debug('result fetch order detail: $result');
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

      AppLogger.debug('orderId: $orderId, menuItemId: $menuItemId');

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
  Future<Map<String, dynamic>> patchOrderEdit({
    required EditOrderItemModel patchData,
    String? idempotencyKey,
  }) async {
    final orderId = patchData.order?.id ?? '';
    if (orderId.isEmpty) {
      throw Exception("orderId tidak boleh kosong");
    }

    AppLogger.debug('orderId: $orderId, patchData: $patchData');

    try {
      final order = patchData.order;
      List<OrderItemModel> itemsToSend = order?.items ?? [];

      // KHUSUS OPEN BILL: Hanya kirim item baru (tanpa orderItemid)
      // Ini mencegah duplikasi karena backend bersifat "append" untuk Open Bill
      if (order?.isOpenBill == true) {
        itemsToSend =
            itemsToSend
                .where(
                  (it) => it.orderItemid == null || it.orderItemid!.isEmpty,
                )
                .toList();
      }

      final patchEditData = updateEditOrderRequest(
        patchData.reason ?? 'Update_Order_After_Payment',
        itemsToSend,
      );

      AppLogger.debug('patchEditData on order service: $patchEditData');

      final res = await _dio.patch(
        '/api/orders/$orderId/edit',
        data: patchEditData,
        options: Options(
          headers: {
            if (idempotencyKey != null) 'x-idempotency-key': idempotencyKey,
          },
        ),
      );

      if (res.data['success'] == true) {
        return res.data;
      } else {
        throw Exception('Failed to patch order: ${res.data['message']}');
      }

      // return {'success': true, 'message': 'Order updated successfully'};
    } catch (e) {
      throw Exception('Failed to patch order: $e');
    }
  }

  Future<Map<String, dynamic>> closeOpenBill({
    required String orderId,
    required String cashierId,
    required dynamic paymentDetails, // Can be single object or array
    bool isSplitPayment = false,
    String? customerName,
    String? customerPhone,
    String? notes,
  }) async {
    try {
      if (orderId.isEmpty) {
        throw Exception("orderId tidak boleh kosong");
      }

      final requestData = {
        'cashierId': cashierId,
        'paymentDetails': paymentDetails,
        'isSplitPayment': isSplitPayment,
        if (customerName != null) 'customerName': customerName,
        if (customerPhone != null) 'customerPhone': customerPhone,
        if (notes != null) 'notes': notes,
      };

      // 🐛 DEBUG: Log request data
      print('📤 Close Bill Request:');
      print('URL: /api/open-bill/$orderId/close');
      print('Data: $requestData');

      final res = await _dio.post(
        '/api/open-bill/$orderId/close',
        data: requestData,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        ),
      );

      if (res.data['success'] == true) {
        return res.data;
      } else {
        throw Exception('Failed to close open bill: ${res.data['message']}');
      }
    } on DioException catch (e) {
      // 🐛 DEBUG: Log detailed error
      print('❌ Close Bill Error:');
      print('Status Code: ${e.response?.statusCode}');
      print('Response Data: ${e.response?.data}');
      print('Error Message: ${e.message}');

      // Extract backend error message if available
      String errorMsg = 'Failed to close open bill';
      if (e.response?.data != null) {
        if (e.response!.data is Map) {
          errorMsg =
              e.response!.data['message'] ??
              e.response!.data['error'] ??
              errorMsg;
        }
      }
      throw Exception('$errorMsg: ${e.toString()}');
    } catch (e) {
      print('❌ Unexpected Error: $e');
      throw Exception('Failed to close open bill: $e');
    }
  }
}

Map<String, dynamic> createOrderRequest(OrderDetailModel order) {
  final box = Hive.box('userBox');
  final user = box.get('user') as UserModel;
  final loginDevice = box.get('device') as DeviceModel;

  return {
    'order_id': order.orderId,
    'user_id': order.userId ?? "",
    'user': order.user,
    'cashierId': order.cashier?.id ?? '',
    'device_id': loginDevice.id,
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
            'dineType': OrderTypeModel.toJsonString(item.orderType),
            // Include custom discount for item
            if (item.customDiscount?.isActive == true)
              'customDiscount': {
                'isActive': item.customDiscount!.isActive,
                'discountType': item.customDiscount!.discountType,
                'discountValue': item.customDiscount!.discountValue,
                'discountAmount': item.customDiscount!.discountAmount,
                'appliedBy': item.customDiscount!.appliedBy,
                'appliedAt': item.customDiscount!.appliedAt?.toIso8601String(),
                'reason': item.customDiscount!.reason,
              },
          };
        }).toList(),
    'orderType': OrderTypeModel.toJsonString(order.orderType),
    'tableNumber': order.tableNumber ?? 1,
    'paymentMethod': order.paymentMethod ?? 'Cash',
    'outletId': user.outletId,
    'outlet': user.outletId,
    'selectedPromoIds': order.selectedPromoIds,
    'appliedPromos': order.appliedPromos,
    'discounts':
        order.discounts?.copyWith(
          customDiscount: 0, // Prevent double counting in backend
        ) ??
        DiscountModel(customDiscount: 0),
    // Include order-level custom discount
    if (order.customDiscountDetails?.isActive == true)
      'customDiscountDetails': {
        'isActive': order.customDiscountDetails!.isActive,
        'discountType': order.customDiscountDetails!.discountType,
        'discountValue': order.customDiscountDetails!.discountValue,
        'discountAmount': order.customDiscountDetails!.discountAmount,
        'appliedBy': order.customDiscountDetails!.appliedBy,
        'appliedAt': order.customDiscountDetails!.appliedAt?.toIso8601String(),
        'reason': order.customDiscountDetails!.reason,
      },
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
                'orderType': OrderTypeModel.toJsonString(
                  item.orderType ?? OrderTypeModel.dineIn,
                ),
              };
            }).toList()
            : [],
    'paymentDetails':
        order.isOpenBill == true
            ? []
            : order.payments.map((payment) {
              final methodtype = PaymentDetails.buildPaymentMethodLabel(
                payment,
              );
              return {
                'status': payment.status,
                'method': payment.method,
                'methodType': methodtype,
                'amount': payment.amount,
                'remainingAmount': payment.remainingAmount,
                'tenderedAmount': payment.tenderedAmount,
                'changeAmount': payment.changeAmount,
                'vaNumbers': payment.vaNumbers?.toList() ?? [],
                'actions': payment.actions?.toList() ?? [],
              };
            }).toList(),
  };
}

Map<String, dynamic> logOrder(OrderDetailModel order) {
  final box = Hive.box('userBox');
  final user = box.get('user') as UserModel;
  final loginDevice = box.get('device') as DeviceModel;
  return {
    'order_id': order.orderId,
    'user_id': order.userId ?? "",
    'user': order.user,
    'cashierId': order.cashier?.id ?? '',
    'device_id': loginDevice.id,
    'orderType': OrderTypeModel.toJsonString(order.orderType),
    'tableNumber': order.tableNumber ?? 1,
    'paymentMethod': order.paymentMethod ?? 'Cash',
    'outletId': user.outletId,
    'outlet': user.outletId,
    'selectedPromoIds': order.selectedPromoIds,
    'discounts': order.discounts,
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
                'orderType': OrderTypeModel.toJsonString(
                  item.orderType ?? OrderTypeModel.dineIn,
                ),
              };
            }).toList()
            : [],
  };
}

Map<String, dynamic> logMenuItem(OrderDetailModel order) {
  return {
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
            'dineType': OrderTypeModel.toJsonString(item.orderType),
          };
        }).toList(),
  };
}

Map<String, dynamic> logPayments(OrderDetailModel order) {
  return {
    'paymentDetails':
        order.isOpenBill == true
            ? []
            : order.payments.map((payment) {
              final methodtype = PaymentDetails.buildPaymentMethodLabel(
                payment,
              );
              return {
                'status': payment.status,
                'method': payment.method,
                'methodType': methodtype,
                'amount': payment.amount,
                'remainingAmount': payment.remainingAmount,
                'tenderedAmount': payment.tenderedAmount,
                'changeAmount': payment.changeAmount,
                'vaNumbers': payment.vaNumbers?.toList() ?? [],
                'actions': payment.actions?.toList() ?? [],
              };
            }).toList(),
  };
}

Map<String, dynamic> logAppliedPRomo(OrderDetailModel order) {
  return {'appliedPromos': order.appliedPromos};
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
  AppLogger.debug(
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

Map<String, dynamic> updateEditOrderRequest(
  String reason,
  List<OrderItemModel> orderItems,
) {
  return {
    'reason': reason,
    'items':
        orderItems.map((item) {
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
            'dineType': OrderTypeModel.toJsonString(item.orderType),
          };
        }).toList(),
  };
}
