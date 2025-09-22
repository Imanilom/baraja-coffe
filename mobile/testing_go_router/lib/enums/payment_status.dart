enum PaymentStatus { pending, settlement, partial }

enum PaymentTypes { fullPayment, downPayment }

extension PaymentStatusExtension on PaymentStatus {
  String get value {
    switch (this) {
      case PaymentStatus.pending:
        return 'pending';
      case PaymentStatus.settlement:
        return 'settlement';
      case PaymentStatus.partial:
        return 'partial';
      default:
        return 'pending';
    }
  }

  static PaymentStatus fromString(String? status) {
    if (status == null) return PaymentStatus.pending;

    switch (status.toLowerCase()) {
      case 'pending':
        return PaymentStatus.pending;
      case 'settlement':
        return PaymentStatus.settlement;
      case 'partial':
        return PaymentStatus.partial;
      default:
        return PaymentStatus.pending;
    }
  }

  static String paymentStatusToJson(PaymentStatus status) => status.value;
}

extension PaymentTypesExtension on PaymentTypes {
  String get value {
    switch (this) {
      case PaymentTypes.fullPayment:
        return 'fullPayment';
      case PaymentTypes.downPayment:
        return 'downPayment';
      default:
        return 'fullPayment';
    }
  }

  static PaymentTypes fromString(String type) {
    switch (type.toLowerCase()) {
      case 'fullpayment':
        return PaymentTypes.fullPayment;
      case 'downpayment':
        return PaymentTypes.downPayment;
      default:
        return PaymentTypes.fullPayment;
    }
  }
}
