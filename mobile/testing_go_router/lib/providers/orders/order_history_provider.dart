import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/repositories/order_history_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final orderHistoryRepositoryProvider = Provider<OrderHistoryRepository>((ref) {
  return OrderHistoryRepository();
});

final orderHistoryProvider =
    AsyncNotifierProvider<OrderHistoryNotifier, List<OrderDetailModel>>(
      OrderHistoryNotifier.new,
    );

class OrderHistoryNotifier extends AsyncNotifier<List<OrderDetailModel>> {
  // late final OrderHistoryRepository _repository;
  OrderHistoryRepository get _repository =>
      ref.read(orderHistoryRepositoryProvider);

  @override
  Future<List<OrderDetailModel>> build() async {
    // _repository = ref.read(orderHistoryRepositoryProvider);
    // final cashierId = ref.read(authCashierProvider).value?.id ?? '';
    return await _repository.fetchOrderHistory();
  }

  Future<void> refreshHistory() async {
    final cashierId = ref.read(authCashierProvider).value?.id ?? '';
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _repository.fetchOrderHistory());
  }
}

// final orderHistoryProviders = StateNotifierProvider<
//   OrderHistorysNotifier,
//   AsyncValue<List<OrderDetailModel>>
// >((ref) => OrderHistorysNotifier(ref.read(orderHistoryRepositoryProvider)));

// class OrderHistorysNotifier
//     extends StateNotifier<AsyncValue<List<OrderDetailModel>>> {
//   final OrderHistoryRepository _repository;

//   OrderHistoryNotifier(this._repository) : super(const AsyncValue.loading());

//   Future<void> getOrderHistory(String cashierId) async {
//     print("getOrderHistory cashierId: $cashierId");
//     try {
//       state = const AsyncValue.loading();
//       final data = await _repository.fetchOrderHistory(cashierId);
//       state = AsyncValue.data(data);
//     } catch (e, stack) {
//       state = AsyncValue.error(e, stack);
//     }
//   }

//   void clearOrderHistory() {
//     state = const AsyncValue.data([]);
//   }
// }
