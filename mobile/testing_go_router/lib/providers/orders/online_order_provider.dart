import 'package:dio/dio.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/repositories/online_order_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/models/online_order/confirm_order.model.dart';
import 'package:kasirbaraja/services/order_service.dart';

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
