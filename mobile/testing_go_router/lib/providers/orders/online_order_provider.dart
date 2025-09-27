import 'package:dio/dio.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/repositories/online_order_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/models/online_order/confirm_order.model.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'package:kasirbaraja/models/payments/process_payment_request.dart';

// Provider untuk SavedOrderDetailProvider
final onlineOrderRepository = Provider<OnlineOrderRepository>(
  (ref) => OnlineOrderRepository(),
);
final onlineOrderService = Provider<OrderService>((ref) => OrderService());

class OnlineOrderDetailNotifier extends AsyncNotifier<List<OrderDetailModel>?> {
  @override
  Future<List<OrderDetailModel>> build() async {
    return _fetchPendingOrder();
  }

  Future<List<OrderDetailModel>> _fetchPendingOrder() async {
    try {
      final onlineOrderRepo = ref.read(onlineOrderRepository);
      final user = await HiveService.getUser();
      final cashier = await HiveService.getCashier();
      final onlineOrders = await onlineOrderRepo.fetchPendingOrders(
        user!.outletId!,
      );

      return onlineOrders;
    } on DioException catch (e) {
      throw e.error ?? Exception('Failed to fetch online orders: ${e.message}');
    }
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    try {
      final data = await _fetchPendingOrder();
      state = AsyncValue.data(data);
      // state = AsyncValue.guard(data);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

final onlineOrderProvider =
    AsyncNotifierProvider<OnlineOrderDetailNotifier, List<OrderDetailModel>?>(
      () => OnlineOrderDetailNotifier(),
    );

// State untuk konfirmasi order
class OrderConfirmationState {
  final bool isLoading;
  final ConfirmOrderResponse? response;
  final String? error;

  OrderConfirmationState({this.isLoading = false, this.response, this.error});

  OrderConfirmationState copyWith({
    bool? isLoading,
    ConfirmOrderResponse? response,
    String? error,
  }) {
    return OrderConfirmationState(
      isLoading: isLoading ?? this.isLoading,
      response: response ?? this.response,
      error: error ?? this.error,
    );
  }
}

// Notifier untuk konfirmasi order
class OrderConfirmationNotifier extends StateNotifier<OrderConfirmationState> {
  final Ref ref;

  OrderConfirmationNotifier(this.ref) : super(OrderConfirmationState());

  Future<void> confirmOrder(WidgetRef ref, ConfirmOrderRequest request) async {
    // Reset state dan set loading
    state = OrderConfirmationState(isLoading: true);

    try {
      final apiService = ref.read(onlineOrderService);
      final response = await apiService.confirmPaidOrder(ref, request);

      // Update state dengan response
      state = OrderConfirmationState(response: response);
    } catch (e) {
      // Update state dengan error
      state = OrderConfirmationState(error: e.toString());
    }
  }

  void resetState() {
    state = OrderConfirmationState();
  }
}

// Provider untuk order confirmation
final orderConfirmationProvider =
    StateNotifierProvider<OrderConfirmationNotifier, OrderConfirmationState>((
      ref,
    ) {
      return OrderConfirmationNotifier(ref);
    });

final processPaymentProvider =
    StateNotifierProvider<ProcessPaymentNotifier, ProcessPaymentState>((ref) {
      return ProcessPaymentNotifier(ref);
    });

class ProcessPaymentState {
  final bool isLoading;
  final ProcessPaymentResponse? response;
  final String? error;

  ProcessPaymentState({this.isLoading = false, this.response, this.error});

  ProcessPaymentState copyWith({
    bool? isLoading,
    ProcessPaymentResponse? response,
    String? error,
  }) {
    return ProcessPaymentState(
      isLoading: isLoading ?? this.isLoading,
      response: response ?? this.response,
      error: error ?? this.error,
    );
  }
}

class ProcessPaymentNotifier extends StateNotifier<ProcessPaymentState> {
  final Ref ref;
  ProcessPaymentNotifier(this.ref) : super(ProcessPaymentState());

  Future<void> processPayment(
    WidgetRef ref,
    ProcessPaymentRequest request,
  ) async {
    state = ProcessPaymentState(isLoading: true);

    try {
      final apiService = ref.read(onlineOrderService);
      final response = await apiService.processPaymentOrder(request);

      state = ProcessPaymentState(response: response);
    } catch (e) {
      state = ProcessPaymentState(error: e.toString());
    }
  }

  void resetState() {
    state = ProcessPaymentState();
  }
}

final processPaymentRequestProvider = StateNotifierProvider<
  ProcessPaymentRequestNotifier,
  ProcessPaymentRequest?
>((ref) {
  return ProcessPaymentRequestNotifier();
});

class ProcessPaymentRequestNotifier
    extends StateNotifier<ProcessPaymentRequest?> {
  ProcessPaymentRequestNotifier() : super(null);

  void initialState(String orderId) {
    state = ProcessPaymentRequest(
      orderId: orderId,
      cashierId: '',
      selectedPaymentId: [],
      paymentType: '',
      paymentMethod: '',
    );
  }

  void addCashierId(String cashierId) {
    if (state == null) {
      initialState('');
    }
    state = state!.copyWith(cashierId: cashierId);
  }

  void selectedPayment(String orderId, String paymentId) {
    if (state == null) {
      initialState(orderId);
    }
    //cek order id yang sama
    if (state!.orderId != orderId) {
      initialState(orderId);
    }
    state = state!.copyWith(
      selectedPaymentId: [...state!.selectedPaymentId!, paymentId],
    );
    print('Payment selected $paymentId');
  }

  void selectedPaymentType(String? orderId, String paymentType) {
    // if (state == null) {
    //   initialState(orderId);
    // }
    // //cek order id yang sama
    // if (state!.orderId != orderId) {
    //   initialState(orderId);
    // }
    state = state!.copyWith(paymentType: paymentType);
  }

  void selectedPaymentMethod(String? orderId, String paymentMethod) {
    // if (state == null) {
    //   initialState(orderId);
    // }
    // //cek order id yang sama
    // if (state!.orderId != orderId) {
    //   initialState(orderId);
    // }
    state = state!.copyWith(paymentMethod: paymentMethod);
  }

  //add payment type and payment method
  void addPaymentTypeAndMethod(String paymentType, String paymentMethod) {
    state = state!.copyWith(
      paymentType: paymentType,
      paymentMethod: paymentMethod,
    );
  }

  void resetState() {
    state = null;
  }
}
