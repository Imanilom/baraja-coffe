import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';

final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>(
  (ref) => PaymentNotifier(
    totalAmount: (ref.watch(orderDetailProvider)!.totalPrice ?? 0).toInt(),
  ),
);

class PaymentNotifier extends StateNotifier<PaymentState> {
  PaymentNotifier({required int totalAmount})
    : super(PaymentState(totalAmount: totalAmount));

  void selectMethod(PaymentMethod method) {
    // hapus selectedMethod terlebih dahulu jika ada yang dipilih
    // jika ada selectedMethod yang dipilih, hapus
    // selectedMethod yang dipilih sebelumnya
    if (state.selectedMethod != null) {
      state = state.copyWith(selectedMethod: null);
    }
    state = state.copyWith(
      selectedMethod: method,
      selectedCashAmount: null,
      selectedBankId: null,
    );
  }

  void selectCashAmount(int amount) {
    state = state.copyWith(selectedCashAmount: amount);
  }

  void selectBank(String bankId) {
    state = state.copyWith(selectedBankId: bankId);
  }

  void clearSelection() {
    state = state.copyWith(
      selectedMethod: null,
      selectedCashAmount: null,
      selectedBankId: null,
      totalAmount: null,
    );
  }
}
