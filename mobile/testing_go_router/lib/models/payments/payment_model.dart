import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';

class PaymentState {
  final PaymentTypeModel? selectedPaymentType; // New: Selected payment type
  final PaymentMethodModel? selectedPaymentMethod;
  final int? selectedCashAmount; // For cash payments
  final int totalAmount;
  final int? selectedDownPayment;
  final bool isDownPayment;

  PaymentState({
    this.selectedPaymentType,
    this.selectedPaymentMethod,
    this.selectedCashAmount,
    required this.totalAmount,
    this.selectedDownPayment,
    this.isDownPayment = false,
  });

  PaymentState copyWith({
    PaymentTypeModel? selectedPaymentType,
    PaymentMethodModel? selectedPaymentMethod,
    int? selectedCashAmount,
    int? totalAmount,
    int? selectedDownPayment,
    bool clearPaymentType = false,
    bool clearPaymentMethod = false,
    bool clearCashAmount = false,
    bool clearDownPayment = false,
    bool isDownPayment = false,
  }) {
    return PaymentState(
      selectedPaymentType:
          clearPaymentType
              ? null
              : selectedPaymentType ?? this.selectedPaymentType,
      selectedPaymentMethod:
          clearPaymentMethod
              ? null
              : selectedPaymentMethod ?? this.selectedPaymentMethod,
      selectedCashAmount:
          clearCashAmount
              ? null
              : selectedCashAmount ?? this.selectedCashAmount,
      selectedDownPayment:
          clearDownPayment
              ? null
              : selectedDownPayment ?? this.selectedDownPayment,
      totalAmount: totalAmount ?? this.totalAmount,
      isDownPayment: isDownPayment,
    );
  }

  // Calculate change (for cash payments)
  int? get change {
    if (selectedPaymentType?.id == 'cash' && selectedCashAmount != null) {
      final changeAmount = selectedCashAmount! - totalAmount;
      return changeAmount >= 0 ? changeAmount : 0;
    }
    return null;
  }

  // Check if payment selection is complete
  bool get isSelectionComplete {
    if (selectedPaymentType == null) return false;

    if (selectedPaymentType!.id == 'cash') {
      return selectedCashAmount != null;
    }

    return selectedPaymentMethod != null;
  }

  /// Returns a map with payment info for processing payment.
  Map<String, dynamic> getPaymentInfo() {
    if (selectedPaymentType == null) {
      throw Exception('No payment type selected');
    }
    if (selectedPaymentType!.id == 'cash') {
      return {
        'type': 'Cash',
        'method': 'Cash',
        'amount': selectedCashAmount ?? 0,
        'change': change, // You may want to calculate change elsewhere
      };
    } else {
      return {
        'type': selectedPaymentType!.name,
        'method': selectedPaymentMethod?.methodCode ?? '',
        'amount': 0, // You may want to set this based on your logic
        'change': change,
      };
    }
  }
}

class PaymentMethodss {
  final String id;
  final String name;
  final String type; // 'cash' or 'edc'
  final String? logoUrl;

  PaymentMethodss({
    required this.id,
    required this.name,
    required this.type,
    this.logoUrl,
  });

  // Convert from new models to legacy format
  factory PaymentMethodss.fromPaymentMethod(PaymentMethodModel method) {
    return PaymentMethodss(
      id: method.id,
      name: method.name,
      type: method.isDigital ? 'digital' : 'physical',
    );
  }
}
