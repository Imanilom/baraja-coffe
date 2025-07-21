import 'package:kasirbaraja/models/payments/payment_model.dart';

class PaymentHelper {
  // Get payment type icon
  static String getPaymentTypeIcon(String typeId) {
    switch (typeId) {
      case 'cash':
        return 'assets/icons/cash.png';
      case 'ewallet':
        return 'assets/icons/ewallet.png';
      case 'debit':
        return 'assets/icons/debit.png';
      case 'banktransfer':
        return 'assets/icons/bank-transfer.png';
      default:
        return 'assets/icons/payment.png';
    }
  }

  // Get cash suggestions based on total amount
  static List<int> getCashSuggestions(int totalAmount) {
    final suggestions =
        <int>{
            totalAmount,
            _roundUpToNearest(totalAmount, 1000),
            _roundUpToNearest(totalAmount, 2000),
            _roundUpToNearest(totalAmount, 5000),
            _roundUpToNearest(totalAmount, 10000),
            _roundUpToNearest(totalAmount, 20000),
            _roundUpToNearest(totalAmount, 50000),
            _roundUpToNearest(totalAmount, 100000),
          }.toList()
          ..sort();

    return suggestions.take(6).toList();
  }

  static int _roundUpToNearest(int number, int nearest) {
    if (nearest <= 0) {
      throw ArgumentError('Nearest must be greater than zero.');
    }
    return ((number + nearest - 1) ~/ nearest) * nearest;
  }

  // Validate payment selection
  static bool isValidPaymentSelection(PaymentState state) {
    if (state.selectedPaymentType == null) return false;

    if (state.selectedPaymentType!.id == 'cash') {
      return state.selectedCashAmount != null &&
          state.selectedCashAmount! >= state.totalAmount;
    }

    return state.selectedPaymentMethod != null;
  }
}
