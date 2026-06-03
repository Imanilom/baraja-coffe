import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_action.model.dart';
import 'package:kasirbaraja/models/payments/va_number.model.dart';

class PaymentDetails {
  static String buildPaymentMethodLabel(PaymentModel p) {
    final rawMethod = (p.method ?? '').toString().toUpperCase();

    // 1. CASH → hanya nama metode saja
    if (rawMethod == 'CASH') {
      return p.method ?? 'Cash';
    }

    // 2. DEBIT & BANK TRANSFER → ambil nama bank dari va_number
    if (rawMethod == 'DEBIT' || rawMethod == 'BANK TRANSFER') {
      final bankName = _extractBankFromVaNumber(p.vaNumbers ?? []);
      if (bankName != null && bankName.isNotEmpty) {
        // contoh: "BCA (Debit)" atau "BCA - Bank Transfer"
        final niceMethod =
            p.method ?? rawMethod[0] + rawMethod.substring(1).toLowerCase();
        return '$niceMethod $bankName';
      }

      // fallback kalau bank tidak ketemu
      return p.method ?? rawMethod;
    }

    // 3. QRIS → ambil nama bank dari actions
    if (rawMethod == 'QRIS') {
      final qrisBank = _extractBankFromActions(p.actions ?? []);
      if (qrisBank != null && qrisBank.isNotEmpty) {
        // contoh: "QRIS BCA", "QRIS Mandiri"
        return 'QRIS $qrisBank';
      }
      return p.method ?? 'QRIS';
    }

    // 4. Default fallback
    return p.method ?? 'Metode tidak diketahui';
  }

  static String? _extractBankFromVaNumber(List<VANumberModel> vaNumber) {
    for (final item in vaNumber) {
      if (item.bank != null) {
        return item.bank.toString().toUpperCase();
      }
    }

    return null;
  }

  static String? _extractBankFromActions(List<PaymentActionModel> actions) {
    for (final item in actions) {
      if (item.name != null) {
        return item.name.toString().toUpperCase();
      }
    }

    return null;
  }
}
