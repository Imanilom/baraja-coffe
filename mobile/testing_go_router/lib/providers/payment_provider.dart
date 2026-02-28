import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/repositories/payment_method_repository.dart';
import 'package:kasirbaraja/models/payments/process_payment_request.dart';

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
  void selectPaymentType(PaymentTypeModel paymentType, bool isDownPayment) {
    state = state.copyWith(
      selectedPaymentType: paymentType,
      clearCashAmount: true,
      isDownPayment: isDownPayment,
    );
  }

  // Select specific payment method (for non-cash payments)
  void selectPaymentMethod(
    PaymentMethodModel paymentMethod,
    bool isDownPayment,
  ) {
    state = state.copyWith(
      selectedPaymentMethod: paymentMethod,
      clearPaymentMethod: true,
      clearCashAmount: true,
      isDownPayment: isDownPayment,
    );
  }

  // Select cash amount (for cash payments)
  void selectCashAmount(int amount, bool isDownPayment) {
    state = state.copyWith(
      selectedCashAmount: amount,
      clearPaymentMethod: true,
      isDownPayment: isDownPayment,
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
        'type': state.selectedPaymentMethod!.id,
        'method': state.selectedPaymentType!.typeCode,
        'amount': state.totalAmount,
        'paymentMethodId': state.selectedPaymentMethod!.id,
      };
    }
  }

  // 🔽 set mode full/DP (sinkron dengan ChoiceChip kamu)
  void setSettlementMode(bool isDownPayment) {
    state = state.copyWith(
      isDownPayment: isDownPayment,
      clearDownPayment: isDownPayment ? false : true,
      clearCashAmount: true,
      clearPaymentMethod: true,
      clearPaymentType: true,
    );
  }

  // 🔽 set nominal DP
  void selectDownPayment(int amount) {
    state = state.copyWith(
      selectedDownPayment: amount,
      clearCashAmount: true,
      clearPaymentMethod: true,
      clearPaymentType: true,
      isDownPayment: true,
    );
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

final paymentRepositoryProvider = Provider<PaymentMethodRepository>((ref) {
  return PaymentMethodRepository();
});

final paymentMethodsProvider = FutureProvider<List<PaymentMethodModel>>((
  ref,
) async {
  try {
    final repository = ref.read(paymentRepositoryProvider);
    final methods = await repository.getLocalPaymentMethods();
    return methods.where((m) => m.isActive).toList();
  } catch (e) {
    rethrow;
  }
});

final paymentTypesProvider = Provider.family<List<PaymentTypeModel>, String>((
  ref,
  typeId,
) {
  final paymentMethodsAsync = ref.watch(paymentMethodsProvider);

  return paymentMethodsAsync.when(
    data: (methods) {
      final method = methods.firstWhere(
        (t) => t.id == typeId,
        orElse:
            () => PaymentMethodModel(
              id: '',
              name: '',
              icon: '',
              isActive: false,
              paymentTypes: [],
            ),
      );
      return method.paymentTypes.where((type) => type.isActive).toList();
    },
    loading: () => <PaymentTypeModel>[],
    error: (_, __) => <PaymentTypeModel>[],
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
    state = state.copyWith(selectedType: type);
  }

  void selectPaymentMethod(PaymentMethodModel method) {
    state = state.copyWith(
      selectedMethod: method,
      selectedType: null, // Reset method when type changes
    );
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

  Future<ProcessPaymentResponse> processPayment(
    WidgetRef ref,
    ProcessPaymentRequest request,
  ) async {
    try {
      setProcessing(true);

      final apiService = ref.read(onlineOrderService);
      final response = await apiService.processPaymentOrder(request);
      AppLogger.debug('Payment Response: ${response.data?.isFullyPaid}');
      setProcessing(false);
      final result = {
        "success": response.success,
        "orderStatus": response.data?.orderStatus,
        "isFullyPaid": response.data?.isFullyPaid,
      };
      AppLogger.debug('Result Tuple: $result');
      return response; // Success
    } catch (e) {
      setProcessing(false);
      return ProcessPaymentResponse(
        success: false,
        message: e.toString(),
      ); // Failed
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
