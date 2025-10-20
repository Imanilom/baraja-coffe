import 'package:kasirbaraja/models/edit_order_ops.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/repositories/online_order_repository.dart';
import 'package:kasirbaraja/services/hive_service.dart';

class OnlineOrderDetailProvider extends StateNotifier<OrderDetailModel?> {
  OnlineOrderDetailProvider() : super(null);

  //ini harusnya buat List savedOrderDetail
  void savedOnlineOrderDetail(OrderDetailModel orderDetail) {
    print(orderDetail);
    state = orderDetail;
  }

  void clearOnlineOrderDetail() {
    state = null;
  }

  //memindahkan state saved order detail ke order detail provider
  // void moveToOrderDetail(OrderDetailModel orderDetail, WidgetRef ref) {
  //   if (state!.items.isNotEmpty) {
  //     ref
  //         .read(orderDetailProvider.notifier)
  //         .addOrderFromSavedOrderDetail(orderDetail);
  //     state = null;
  //   }
  // }

  // Hitung total harga dari daftar pesanan
  int get subTotalPrice {
    if (state != null) {
      return state!.items.fold(0, (sum, item) => sum + item.subtotal);
    } else {
      return 0;
    }
  }

  Future<bool> submitOnlineOrder() async {
    final cashier = await HiveService.getCashier();
    //update cashier id di order detail model
    state = state!.copyWith(cashierId: cashier!.id);
    if (state == null) return false;
    print('Mengirim data orderDetail ke backend... ${state!.toJson()}');
    try {
      // final order = await OrderService().createOrder(state!);
      // print('Order ID : $order');
      // if (order.isNotEmpty) {
      //   return true;
      // }
    } catch (e) {
      print('error apa? $e');
      return false;
    }
    return false; // Return false if state is null
  }
}

// Provider untuk OnlineOrderDetailProvider
final onlineOrderDetailProvider =
    StateNotifierProvider<OnlineOrderDetailProvider, OrderDetailModel?>((ref) {
      return OnlineOrderDetailProvider();
    });

//get online order detail from API
class OnlineOrderDetailNotifier extends AsyncNotifier<OrderDetailModel?> {
  @override
  Future<OrderDetailModel?> build() async {
    return null;
  }
}

final onlineOrderDetailNotifierProvider =
    AsyncNotifierProvider<OnlineOrderDetailNotifier, OrderDetailModel?>(
      () => OnlineOrderDetailNotifier(),
    );

class OnlineOrderEditorState {
  final OrderDetailModel? order;
  final List<EditOperation> pendingOps;
  final bool isSubmitting;
  final String? error;

  OnlineOrderEditorState({
    required this.order,
    this.pendingOps = const [],
    this.isSubmitting = false,
    this.error,
  });

  OnlineOrderEditorState copyWith({
    OrderDetailModel? order,
    List<EditOperation>? pendingOps,
    bool? isSubmitting,
    String? error,
  }) {
    return OnlineOrderEditorState(
      order: order ?? this.order,
      pendingOps: pendingOps ?? this.pendingOps,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }
}

class OnlineOrderEditorNotifier extends StateNotifier<OnlineOrderEditorState> {
  final Ref ref;
  OnlineOrderEditorNotifier(this.ref)
    : super(OnlineOrderEditorState(order: null));

  void load(OrderDetailModel order) {
    state = OnlineOrderEditorState(order: order);
  }

  // ====== Operasi lokal (optimistik UI) ======

  void addItem({
    required String menuItemId,
    int qty = 1,
    List<SelectedAddon> addons = const [],
    List<SelectedTopping> toppings = const [],
    String notes = '',
    String dineType = 'Dine-In',
  }) {
    final op = EditOperation.add(
      item: EditAddItem(
        menuItem: menuItemId,
        quantity: max(1, qty),
        selectedAddons: addons,
        selectedToppings: toppings,
        notes: notes,
        dineType: dineType,
      ),
    );

    // (Opsional) update UI lokal: tambahkan item pseudo ke state.order (tanpa id)
    // Bisa juga cukup tampilkan ops di drawer "Perubahan" sebelum submit.
    state = state.copyWith(pendingOps: [...state.pendingOps, op]);
  }

  void updateItem({
    required String itemId,
    int? qty,
    String? notes,
    String? dineType,
    List<SelectedAddon>? addons,
    List<SelectedTopping>? toppings,
    bool oos = false,
  }) {
    final patch = EditUpdatePatch(
      quantity: qty,
      notes: notes,
      dineType: dineType,
      selectedAddons: addons,
      selectedToppings: toppings,
    );
    final op = EditOperation.update(itemId: itemId, patch: patch, oos: oos);
    state = state.copyWith(pendingOps: [...state.pendingOps, op]);
  }

  void removeItem({required String itemId, bool oos = false}) {
    final op = EditOperation.remove(itemId: itemId, oos: oos);
    state = state.copyWith(pendingOps: [...state.pendingOps, op]);
  }

  void clearPendingOps() {
    state = state.copyWith(pendingOps: []);
  }

  // ====== Submit ke backend ======
  Future<void> submitEdits({required String reason}) async {
    final order = state.order;
    if (order == null || state.pendingOps.isEmpty) return;

    state = state.copyWith(isSubmitting: true, error: null);
    final repo = OrderService();
    final user = await HiveService.getUser();
    final idempotencyKey = 'edit-${DateTime.now().millisecondsSinceEpoch}';

    try {
      final updated = await repo.editOrder(
        orderMongoId: order.id!, // _id string dari order (Mongo _id)
        body: EditOrderOpsRequest(reason: reason, operations: state.pendingOps),
        idempotencyKey: idempotencyKey,
        bearer: user?.token,
      );

      // Sinkron ke state editor & juga list provider utama, bila ada
      state = state.copyWith(
        order: updated,
        pendingOps: [],
        isSubmitting: false,
      );
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      rethrow;
    }
  }
}

// Provider editor per order
final onlineOrderEditorProvider = StateNotifierProvider.autoDispose<
  OnlineOrderEditorNotifier,
  OnlineOrderEditorState
>((ref) {
  return OnlineOrderEditorNotifier(ref);
});
