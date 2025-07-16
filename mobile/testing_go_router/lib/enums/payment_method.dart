enum PaymentMethod { cash, card, eWallet, debit, bankTransfer, unknown }

extension PaymentMethodExtension on PaymentMethod {
  String get value {
    switch (this) {
      case PaymentMethod.cash:
        return 'Cash';
      case PaymentMethod.card:
        return 'Card';
      case PaymentMethod.eWallet:
        return 'E-Wallet';
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
        return PaymentMethod.eWallet;
      case 'debit':
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
