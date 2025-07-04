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

final onlineOrderProvider = FutureProvider.autoDispose<List<OrderDetailModel>>((
  ref,
) async {
  try {
    final onlineOrderRepo = ref.read(onlineOrderRepository);
    final user = await HiveService.getUser();
    final cashier = await HiveService.getCashier();
    print('User outletId and cashierId: ${user?.outletId} and ${cashier?.id}');

    return onlineOrderRepo.fetchPendingOrders(user!.outletId!);
  } on DioException catch (e) {
    print('DioException: ${e.message}');
    throw e.error ?? Exception('Failed to fetch activity: ${e.message}');
  }
});

// final onlineOrderProvider =
//     StateNotifierProvider<OnlineOrderProvider, List<OrderDetailModel>>(
//         (ref) => OnlineOrderProvider());

// final class OnlineOrderProvider extends StateNotifier<List<OrderDetailModel>> {
//   OnlineOrderProvider() : super([]);

//   // Method untuk mengambil data online order
//   Future<void> getOnlineOrders() async {
//     try {
//       final onlineOrders = await OnlineOrderRepository().fetchPendingOrders();
//       state = onlineOrders;
//     } catch (e) {
//       print("Gagal mengambil data online orders: ${e.toString()}");
//     }
//   }

//   // Method untuk menambahkan order detail ke dalam daftar
//   void addOrderDetail(OrderDetailModel orderDetail) {
//     state = [...state, orderDetail];
//   }

//   // Method untuk menghapus order detail dari daftar
//   void removeOrderDetail(OrderDetailModel orderDetail) {
//     state = state.where((order) => order != orderDetail).toList();
//   }
// }
