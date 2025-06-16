import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/repositories/online_order_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/try/try_order_detail.model.dart';

// Provider untuk SavedOrderDetailProvider
final onlineOrderRepository =
    Provider<OnlineOrderRepository>((ref) => OnlineOrderRepository());

final onlineOrderProvider = FutureProvider<List<OrderDetailModel>>((ref) async {
  final onlineOrderRepo = ref.read(onlineOrderRepository);
  return onlineOrderRepo.fetchPendingOrders();
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
