import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/repositories/payment_type_repository.dart';

final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>((
  ref,
) {
  final orderDetail = ref.watch(orderDetailProvider);
  final totalAmount = orderDetail?.grandTotal.toInt() ?? 0;

  return PaymentNotifier(totalAmount: totalAmount);
});

class PaymentNotifier extends StateNotifier<PaymentState> {
  PaymentNotifier({required int totalAmount})
    : super(PaymentState(totalAmount: totalAmount));

  // Select payment type (cash, ewallet, debit, etc.)
  void selectPaymentType(PaymentTypeModel paymentType) {
    state = state.copyWith(
      selectedPaymentType: paymentType,
      clearPaymentMethod: true,
      clearCashAmount: true,
    );
  }

  // Select specific payment method (for non-cash payments)
  void selectPaymentMethod(PaymentMethodModel paymentMethod) {
    state = state.copyWith(
      selectedPaymentMethod: paymentMethod,
      clearCashAmount: true,
    );
  }

  // Select cash amount (for cash payments)
  void selectCashAmount(int amount) {
    state = state.copyWith(
      selectedCashAmount: amount,
      clearPaymentMethod: true,
    );
  }

  // Clear all selections
  void clearSelection() {
    state = state.copyWith(
      clearPaymentType: true,
      clearPaymentMethod: true,
      clearCashAmount: true,
    );
  }

  // Reset to initial state with new total
  void resetWithNewTotal(int totalAmount) {
    state = PaymentState(totalAmount: totalAmount);
  }

  // Get selected payment info for processing
  Map<String, dynamic> get getPaymentInfo {
    if (!state.isSelectionComplete) {
      throw Exception('Payment selection is not complete');
    }

    if (state.selectedPaymentType!.id == 'cash') {
      return {
        'type': 'cash',
        'method': 'Cash',
        'amount': state.selectedCashAmount,
        'change': state.change,
      };
    } else {
      return {
        'type': state.selectedPaymentType!.id,
        'method': state.selectedPaymentMethod!.methodCode,
        'amount': state.totalAmount,
        'paymentMethodId': state.selectedPaymentMethod!.id,
      };
    }
  }
}

final paymentRepositoryProvider = Provider<PaymentTypeRepository>((ref) {
  return PaymentTypeRepository();
});

// Provider utama untuk payment types
final paymentTypesProvider = FutureProvider<List<PaymentTypeModel>>((
  ref,
) async {
  try {
    final repository = ref.read(paymentRepositoryProvider);
    final types = await repository.getPaymentTypes();

    // Filter only active payment types
    return types.where((type) => type.isActive).toList();
  } catch (e) {
    // Log error if you have logging setup
    // Logger.e('Failed to fetch payment types: $e');
    rethrow;
  }
});

final paymentMethodsProvider =
    Provider.family<List<PaymentMethodModel>, String>((ref, typeId) {
      final paymentTypesAsync = ref.watch(paymentTypesProvider);

      return paymentTypesAsync.when(
        data: (types) {
          final type = types.firstWhere(
            (t) => t.id == typeId,
            orElse:
                () => const PaymentTypeModel(
                  id: '',
                  name: '',
                  icon: '',
                  isActive: false,
                  paymentMethods: [],
                ),
          );
          return type.paymentMethods
              .where((method) => method.isActive)
              .toList();
        },
        loading: () => <PaymentMethodModel>[],
        error: (_, __) => <PaymentMethodModel>[],
      );
    });
