import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/repositories/order_history_repository.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
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

    return fetchOrderHistory();
  }

  //fetch order history
  Future<List<OrderDetailModel>> fetchOrderHistory() async {
    try {
      final device = await HiveService.getDevice();
      if (device?.id == null) {
        throw Exception('Device not found');
      }

      final orderHistory = await _repository.fetchOrderHistory(device!.id);

      return orderHistory;
    } catch (e) {
      AppLogger.error("Gagal mengambil data order history", error: e);
      rethrow;
    }
  }

  Future<void> refreshHistory() async {
    final device = await HiveService.getDevice();
    if (device?.id == null) {
      state = AsyncError(Exception('Device not found'), StackTrace.current);
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => _repository.fetchOrderHistory(device!.id),
    );
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
