enum PaymentStatus { pending, settlement, paid }

extension PaymentStatusExtension on PaymentStatus {
  String get value {
    switch (this) {
      case PaymentStatus.pending:
        return 'pending';
      case PaymentStatus.settlement:
        return 'settlement';
      case PaymentStatus.paid:
        return 'paid';
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
      case 'settled':
        return PaymentStatus.settlement;
      case 'paid':
      case 'success':
        return PaymentStatus.paid;
      default:
        return PaymentStatus.pending;
    }
  }

  static String paymentStatusToJson(PaymentStatus status) => status.value;
}
