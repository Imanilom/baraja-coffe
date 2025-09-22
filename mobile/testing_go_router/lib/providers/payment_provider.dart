import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/repositories/payment_type_repository.dart';
import 'package:kasirbaraja/models/payments/process_payment_request.dart';
import 'package:kasirbaraja/services/order_service.dart';

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

  void clearOnBack() {
    state = state.copyWith(
      clearPaymentType: true,
      clearPaymentMethod: true,
      clearCashAmount: true,
      clearDownPayment: true,
      isDownPayment: false,
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

  // 🔽 set mode full/DP (sinkron dengan ChoiceChip kamu)
  void setSettlementMode(bool isDownPayment) {
    state = state.copyWith(isDownPayment: isDownPayment);
  }

  // 🔽 set nominal DP
  void selectDownPayment(int amount) {
    state = state.copyWith(selectedDownPayment: amount);
  }

  // 🔽 bersihkan DP
  void clearDownPayment() {
    state = state.copyWith(selectedDownPayment: null);
  }

  // ⬇️ Hitung info pembayaran (full vs DP)
  // total = grand total order
  Map<String, dynamic> getPaymentInfoComputed(int total) {
    final isDP = state.isDownPayment;
    final int harusDibayarSekarang =
        isDP ? (state.selectedDownPayment ?? 0) : total;

    // uang yang diserahkan (hanya relevan untuk cash)
    final bayarCash =
        state.selectedPaymentType?.id == 'cash'
            ? (state.selectedCashAmount ?? 0)
            : harusDibayarSekarang;

    final change =
        (bayarCash - harusDibayarSekarang) > 0
            ? (bayarCash - harusDibayarSekarang)
            : 0;

    final outstanding =
        (total - harusDibayarSekarang) > 0 ? (total - harusDibayarSekarang) : 0;

    return {
      'type':
          state
              .selectedPaymentType
              ?.id, // cash / ewallet / debit / banktransfer
      'method':
          state
              .selectedPaymentMethod
              ?.id, // id metode spesifik (mis. OVO/QRIS/BRI)
      'amount': harusDibayarSekarang, // yang dianggap "dibayar sekarang"
      'tendered': bayarCash, // uang tunai yang diserahkan (kalau cash)
      'change': change,
      'isDownPayment': isDP,
      'downPayment': isDP ? harusDibayarSekarang : 0, // nominal DP
      'outstanding': outstanding, // sisa tagihan
    };
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
    final types = await repository.getLocalPaymentTypes();

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

// Provider untuk menyimpan payment process state
final paymentProcessProvider =
    StateNotifierProvider<PaymentProcessNotifier, PaymentProcessState>((ref) {
      return PaymentProcessNotifier(ref);
    });

class PaymentProcessState {
  final PaymentTypeModel? selectedType;
  final PaymentMethodModel? selectedMethod;
  final int? amount;
  final String notes;
  final bool isProcessing;

  PaymentProcessState({
    this.selectedType,
    this.selectedMethod,
    this.amount,
    this.notes = '',
    this.isProcessing = false,
  });

  PaymentProcessState copyWith({
    PaymentTypeModel? selectedType,
    PaymentMethodModel? selectedMethod,
    int? amount,
    String? notes,
    bool? isProcessing,
  }) {
    return PaymentProcessState(
      selectedType: selectedType ?? this.selectedType,
      selectedMethod: selectedMethod ?? this.selectedMethod,
      amount: amount ?? this.amount,
      notes: notes ?? this.notes,
      isProcessing: isProcessing ?? this.isProcessing,
    );
  }
}

class PaymentProcessNotifier extends StateNotifier<PaymentProcessState> {
  final Ref ref;
  PaymentProcessNotifier(this.ref) : super(PaymentProcessState());

  void selectPaymentType(PaymentTypeModel type) {
    state = state.copyWith(
      selectedType: type,
      selectedMethod: null, // Reset method when type changes
    );
  }

  void selectPaymentMethod(PaymentMethodModel method) {
    state = state.copyWith(selectedMethod: method);
  }

  void setAmount(int amount) {
    state = state.copyWith(amount: amount);
  }

  void setNotes(String notes) {
    state = state.copyWith(notes: notes);
  }

  void setProcessing(bool isProcessing) {
    state = state.copyWith(isProcessing: isProcessing);
  }

  void reset() {
    state = PaymentProcessState();
  }

  Future<bool> processPayment(
    WidgetRef ref,
    ProcessPaymentRequest request,
  ) async {
    try {
      setProcessing(true);

      final apiService = ref.read(onlineOrderService);
      final response = await apiService.processPaymentOrder(request);

      setProcessing(false);
      return true; // Success
    } catch (e) {
      setProcessing(false);
      return false; // Failed
    }
  }
}

// Service untuk payment API calls
class PaymentService {
  // Simulasi service method
  static Future<List<PaymentTypeModel>> fetchPaymentTypes() async {
    // TODO: Implementasi actual API call
    // final response = await http.get(Uri.parse('$baseUrl/payment-types'));
    // return PaymentResponseModel.fromJson(jsonDecode(response.body)).paymentTypes;

    await Future.delayed(const Duration(milliseconds: 500));
    throw UnimplementedError('Implement actual API call');
  }

  static Future<Map<String, dynamic>> processPayment({
    required String paymentId,
    required String paymentTypeId,
    required String paymentMethodId,
    required int amount,
    String? notes,
  }) async {
    // TODO: Implementasi actual API call
    // final response = await http.post(
    //   Uri.parse('$baseUrl/process-payment'),
    //   headers: {'Content-Type': 'application/json'},
    //   body: jsonEncode({
    //     'paymentId': paymentId,
    //     'paymentTypeId': paymentTypeId,
    //     'paymentMethodId': paymentMethodId,
    //     'amount': amount,
    //     'notes': notes,
    //   }),
    // );
    // return jsonDecode(response.body);

    await Future.delayed(const Duration(seconds: 2));
    return {
      'success': true,
      'transactionId': 'TXN${DateTime.now().millisecondsSinceEpoch}',
      'message': 'Payment processed successfully',
    };
  }
}
