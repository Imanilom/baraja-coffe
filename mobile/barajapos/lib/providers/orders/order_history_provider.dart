import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/repositories/order_history_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final orderHistoryRepositoryProvider = Provider<OrderHistoryRepository>((ref) {
  return OrderHistoryRepository();
});

final orderHistoryProvider = StateNotifierProvider<OrderHistoryNotifier,
    AsyncValue<List<OrderDetailModel>>>(
  (ref) => OrderHistoryNotifier(ref.read(orderHistoryRepositoryProvider)),
);

class OrderHistoryNotifier
    extends StateNotifier<AsyncValue<List<OrderDetailModel>>> {
  final OrderHistoryRepository _repository;

  OrderHistoryNotifier(this._repository) : super(const AsyncValue.loading());

  Future<void> getOrderHistory(String cashierId) async {
    print("getOrderHistory cashierId: $cashierId");
    try {
      state = const AsyncValue.loading();
      final data = await _repository.fetchOrderHistory(cashierId);
      state = AsyncValue.data(data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void clearOrderHistory() {
    state = const AsyncValue.data([]);
  }
}
