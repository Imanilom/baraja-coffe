// models/confirm_order_request.dart
class ConfirmOrderRequest {
  final String orderId;
  final String? cashierId;
  final String source;

  ConfirmOrderRequest({
    required this.orderId,
    this.cashierId,
    required this.source,
  });

  Map<String, dynamic> toJson() {
    return {'order_id': orderId, 'cashier_id': cashierId, 'source': source};
  }
}

// models/confirm_order_response.dart
class ConfirmOrderResponse {
  final bool success;
  final String message;
  final OrderData data;

  ConfirmOrderResponse({
    required this.success,
    required this.message,
    required this.data,
  });

  factory ConfirmOrderResponse.fromJson(Map<String, dynamic> json) {
    return ConfirmOrderResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: OrderData.fromJson(json['data'] ?? {}),
    );
  }
}

class OrderData {
  final String orderId;
  final String status;
  final int grandTotal;
  final String paymentStatus;

  OrderData({
    required this.orderId,
    required this.status,
    required this.grandTotal,
    required this.paymentStatus,
  });

  factory OrderData.fromJson(Map<String, dynamic> json) {
    return OrderData(
      orderId: json['order_id'] ?? '',
      status: json['status'] ?? '',
      grandTotal: json['grandTotal'] ?? 0,
      paymentStatus: json['payment_status'] ?? '',
    );
  }
}
