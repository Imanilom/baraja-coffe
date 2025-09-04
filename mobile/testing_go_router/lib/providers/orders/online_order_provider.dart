import 'package:dio/dio.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/repositories/online_order_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';
// import 'package:barajapos/models/try/try_order_detail.model.dart';

// Provider untuk SavedOrderDetailProvider
final onlineOrderRepository = Provider<OnlineOrderRepository>(
  (ref) => OnlineOrderRepository(),
);

// final onlineOrderProvider = FutureProvider.autoDispose<List<OrderDetailModel>>((
//   ref,
// ) async {
//   try {
//     final onlineOrderRepo = ref.read(onlineOrderRepository);
//     final user = await HiveService.getUser();
//     final cashier = await HiveService.getCashier();
//     final onlineOrders = await onlineOrderRepo.fetchPendingOrders(
//       user!.outletId!,
//     );
//     print('User outletId and cashierId: ${user.outletId} and ${cashier?.id}');
//     return onlineOrders;
//   } on DioException catch (e) {
//     print('DioException: ${e.message}');
//     throw e.error ?? Exception('Failed to fetch online orders: ${e.message}');
//   }
// });

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
