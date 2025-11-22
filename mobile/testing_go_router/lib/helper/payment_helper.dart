import 'dart:math';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_action.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/payments/va_number.model.dart';

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
  /// dengan batas minimal Rp 1000.
  static int minDownPayment(int total) {
    final tenPercent = (total * 0.10).round();
    return roundToThousand(max(1000, tenPercent));
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

  static PaymentModel buildPaymentModelForCard({
    required String? orderId,
    required PaymentMethodModel methodModel, // Cash / Debit / dll
    PaymentTypeModel? typeModel, // BNI / BRI / Gopay / dll
    required int amount,
    required int remainingAfter,
    required int? tendered,
    required int? change,
    // required PaymentStage stage,
  }) {
    // 1. Tentukan method (midtrans-style)
    final midtransMethod = _mapMethodToMidtransMethod(methodModel.id);

    // 2. Bangun va_numbers / actions sesuai rule
    final List<VANumberModel> vaNumbers = [];
    final List<PaymentActionModel> actions = [];

    // nama bank / channel
    final bankName = typeModel?.typeCode ?? typeModel?.name ?? '';

    switch (methodModel.id) {
      case 'cash':
        // cash: nggak pakai VA / action
        break;

      case 'debit':
      case 'banktransfer':
        // nama bank di va_numbers
        if (bankName.isNotEmpty) {
          vaNumbers.add(VANumberModel(bank: bankName, vaNumber: null));
        }
        break;

      case 'qris':
        // nama bank di actions
        if (bankName.isNotEmpty) {
          actions.add(
            PaymentActionModel(
              name: bankName,
              method: 'QRIS',
              url: null, // URL biasanya dari backend / midtrans
            ),
          );
        }
        break;

      case 'ewallet':
        // tergantung kebutuhanmu, bisa disimpan di method / rawResponse
        // misal gunakan method = methodCode Gopay / ShopeePay
        break;

      default:
        // biarin kosong, backend bisa abaikan
        break;
    }

    // 3. Status: partial vs settlement
    final status = remainingAfter > 0 ? 'partial' : 'settlement';

    // 4. nama method yang manusiawi (buat display)
    final displayMethodName = _buildDisplayMethodName(
      methodModel: methodModel,
      typeModel: typeModel,
    );

    return PaymentModel(
      orderId: orderId,
      method: midtransMethod, // ex: "cash", "bank_transfer", "qris"
      status: status,
      paymentType: "Full", // "Full Payment" / "Down Payment" / "Final Payment"
      amount: amount,
      remainingAmount: remainingAfter,
      tenderedAmount: tendered,
      changeAmount: change,
      vaNumbers: vaNumbers,
      actions: actions,
      // optionally simpan pilihan user supaya UI gampang
      selectedPaymentMethod: methodModel,
      selectedPaymentType: typeModel,
      createdAt: DateTime.now(),
    );
  }

  static String _mapMethodToMidtransMethod(String methodId) {
    switch (methodId) {
      case 'cash':
        return 'Cash';
      case 'debit':
        return 'Debit';
      case 'banktransfer':
        return 'Bank Transfer';
      case 'qris':
        return 'QRIS';
      case 'ewallet':
        // atau bisa disesuaikan per typeModel.methodCode
        return 'E-Wallet';
      default:
        return 'Cash'; // fallback: kirim apa adanya
    }
  }

  static String _buildDisplayMethodName({
    required PaymentMethodModel methodModel,
    PaymentTypeModel? typeModel,
  }) {
    // contoh:
    // Cash → "Cash"
    // Debit + BNI → "Debit - BNI"
    // QRIS + BNI → "QRIS - BNI"
    if (methodModel.id == 'cash') {
      return 'Cash';
    }

    if (typeModel != null) {
      return '${methodModel.name} - ${typeModel.name}';
    }

    return methodModel.name;
  }
}
