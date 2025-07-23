import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';

class PaymentState {
  final PaymentTypeModel? selectedPaymentType; // New: Selected payment type
  final PaymentMethodModel?
  selectedPaymentMethod; // New: Selected payment method
  final int? selectedCashAmount; // For cash payments
  final int totalAmount;

  PaymentState({
    this.selectedPaymentType,
    this.selectedPaymentMethod,
    this.selectedCashAmount,
    required this.totalAmount,
  });

  PaymentState copyWith({
    PaymentTypeModel? selectedPaymentType,
    PaymentMethodModel? selectedPaymentMethod,
    int? selectedCashAmount,
    int? totalAmount,
    bool clearPaymentType = false,
    bool clearPaymentMethod = false,
    bool clearCashAmount = false,
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
      totalAmount: totalAmount ?? this.totalAmount,
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
        'change': 0, // You may want to calculate change elsewhere
      };
    } else {
      return {
        'type': selectedPaymentType!.name,
        'method': selectedPaymentMethod?.methodCode ?? '',
        'amount': 0, // You may want to set this based on your logic
        'change': 0,
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
