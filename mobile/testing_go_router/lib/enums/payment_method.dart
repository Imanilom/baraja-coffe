enum PaymentMethod { cash, card, qris, debit, bankTransfer, unknown }

extension PaymentMethodExtension on PaymentMethod {
  String get value {
    switch (this) {
      case PaymentMethod.cash:
        return 'Cash';
      case PaymentMethod.card:
        return 'Card';
      case PaymentMethod.qris:
        return 'Qris';
      case PaymentMethod.debit:
        return 'Debit';
      case PaymentMethod.bankTransfer:
        return 'Bank Transfer';
      default:
        return 'Unknown';
    }
  }

  static PaymentMethod fromString(String method) {
    switch (method.toLowerCase()) {
      case 'cash':
        return PaymentMethod.cash;
      case 'card':
        return PaymentMethod.card;
      case 'e-wallet':
        return PaymentMethod.qris;
      case 'Qris':
        return PaymentMethod.debit;
      case 'bank transfer':
        return PaymentMethod.bankTransfer;
      default:
        return PaymentMethod.cash;
    }
  }

  //to json
  static String? paymentMethodToJson(PaymentMethod? method) => method?.value;
}
