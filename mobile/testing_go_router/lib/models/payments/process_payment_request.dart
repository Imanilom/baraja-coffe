// models/payment/process_payment_request.dart
class ProcessPaymentRequest {
  final String orderId;
  final String? cashierId;
  final List<String>? selectedPaymentId;
  final String? paymentType;
  final String? paymentMethod;

  ProcessPaymentRequest({
    required this.orderId,
    this.cashierId,
    this.selectedPaymentId,
    this.paymentType,
    this.paymentMethod,
  });

  Map<String, dynamic> toJson() {
    return {
      'order_id': orderId,
      'cashier_id': cashierId ?? '',
      'selected_payment_id': selectedPaymentId ?? [],
      'payment_type': paymentType ?? '',
      'payment_method': paymentMethod ?? '',
    };
  }

  //copyWith
  ProcessPaymentRequest copyWith({
    String? orderId,
    String? cashierId,
    List<String>? selectedPaymentId,
    String? paymentType,
    String? paymentMethod,
  }) {
    return ProcessPaymentRequest(
      orderId: orderId ?? this.orderId,
      cashierId: cashierId ?? this.cashierId,
      selectedPaymentId: selectedPaymentId ?? this.selectedPaymentId,
      paymentType: paymentType ?? this.paymentType,
      paymentMethod: paymentMethod ?? this.paymentMethod,
    );
  }
}

// models/payment/process_payment_response.dart
class ProcessPaymentResponse {
  final bool success;
  final String message;
  final ProcessPaymentData? data;

  ProcessPaymentResponse({
    required this.success,
    required this.message,
    this.data,
  });

  factory ProcessPaymentResponse.fromJson(Map<String, dynamic> json) {
    return ProcessPaymentResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: ProcessPaymentData.fromJson(json['data'] ?? {}),
    );
  }
}

class ProcessPaymentData {
  final String orderId;
  final String orderStatus;
  final bool isFullyPaid;
  final List<ProcessedPayment> processedPayments;

  ProcessPaymentData({
    required this.orderId,
    required this.orderStatus,
    required this.isFullyPaid,
    required this.processedPayments,
  });

  factory ProcessPaymentData.fromJson(Map<String, dynamic> json) {
    return ProcessPaymentData(
      orderId: json['order_id'] ?? '',
      orderStatus: json['order_status'] ?? '',
      isFullyPaid: json['is_fully_paid'] ?? false,
      processedPayments:
          (json['processed_payments'] as List? ?? [])
              .map((e) => ProcessedPayment.fromJson(e))
              .toList(),
    );
  }
}

class ProcessedPayment {
  final String paymentId;
  final String paymentType;
  final int amount;
  final int remainingAmount;
  final String status;

  ProcessedPayment({
    required this.paymentId,
    required this.paymentType,
    required this.amount,
    required this.remainingAmount,
    required this.status,
  });

  factory ProcessedPayment.fromJson(Map<String, dynamic> json) {
    return ProcessedPayment(
      paymentId: json['payment_id'] ?? '',
      paymentType: json['payment_type'] ?? '',
      amount: json['amount'] ?? 0,
      remainingAmount: json['remaining_amount'] ?? 0,
      status: json['status'] ?? '',
    );
  }
}
