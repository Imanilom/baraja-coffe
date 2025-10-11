import 'dart:math';
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

  static int roundToThousand(int value) {
    if (value <= 0) return 0;
    final r = (value / 1000).round() * 1000;
    return r;
  }

  /// Minimal DP = 50% dari total, dibulatkan ke 1.000an,
  /// dengan batas minimal Rp 10.000.
  static int minDownPayment(int total) {
    final tenPercent = (total * 0.10).round();
    return roundToThousand(max(10000, tenPercent));
  }

  /// Saran DP: 10%, 30%, 50% dari total (dibulatkan 1.000an),
  /// disaring agar unik & 0 < dp <= total.
  static List<int> getDownPaymentSuggestions(int total) {
    final candidates =
        <int>{
            minDownPayment(total),
            roundToThousand((total * 0.30).round()),
            roundToThousand((total * 0.50).round()),
            total, // untuk "lunas sekarang"
          }.where((v) => v > 0 && v <= total).toList()
          ..sort();
    return candidates;
  }
}
