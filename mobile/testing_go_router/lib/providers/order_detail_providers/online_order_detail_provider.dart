import 'package:flutter/widgets.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/edit_order_item.model.dart';
import 'package:kasirbaraja/models/edit_order_ops.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/repositories/tax_and_service_repository.dart';
// import 'package:barajapos/models/menu_item_model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/repositories/online_order_repository.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:collection/collection.dart';

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

// =====================================================
// NOTIFIER EDIT ORDER ITEM
// =====================================================
class EditOrderItemNotifier extends StateNotifier<EditOrderItemModel> {
  EditOrderItemNotifier(this.ref)
    : _taxSvc = TaxAndServiceRepository(),
      super(
        EditOrderItemModel(
          reason: null,
          order: null,
          originalItems: const [],
          isSubmitting: false,
          error: null,
        ),
      );

  final Ref ref;
  final TaxAndServiceRepository _taxSvc;
  bool _isCalculating = false;

  /// dipanggil waktu masuk halaman edit
  Future<void> load(OrderDetailModel order) async {
    // ambil master menu dari hive
    final masterMenus = Hive.box<MenuItemModel>('menuItemsBox').values.toList();

    // enrich order items supaya menuItem-nya full
    final enrichedItems =
        order.items.map((it) {
          final full = masterMenus.firstWhereOrNull(
            (m) => m.id == it.menuItem.id,
          );
          if (full == null) return it;
          return it.copyWith(menuItem: full);
        }).toList();

    final enrichedOrder = order.copyWith(items: enrichedItems);

    state = state.copyWith(
      order: enrichedOrder,
      originalItems: List<OrderItemModel>.from(enrichedItems),
      reason: null,
      error: null,
    );
  }

  // ====== PUBLIC GETTER utk UI ======
  bool get hasItemChanges {
    final curItems = state.order?.items ?? const <OrderItemModel>[];
    final origItems = state.originalItems ?? const <OrderItemModel>[];

    if (curItems.length != origItems.length) return true;

    for (var i = 0; i < curItems.length; i++) {
      if (!_sameItem(curItems[i], origItems[i])) return true;
    }
    return false;
  }

  // ====== OPERASI ITEM ======

  void editOrderItem(OrderItemModel oldItem, OrderItemModel newItem) {
    final order = state.order;
    if (order == null) return;

    final items = [...order.items];
    final idx = items.indexOf(oldItem);
    if (idx == -1) return;

    items[idx] = newItem;

    state = state.copyWith(order: order.copyWith(items: items));
    _recalc();
  }

  void removeItem(OrderItemModel menuItem) {
    final index = state.order!.items.indexOf(menuItem);

    if (index != -1) {
      final updatedItems = [...state.order!.items]; // clone list
      updatedItems.removeAt(index);

      state = state.copyWith(order: state.order!.copyWith(items: updatedItems));

      print('Item order berhasil dihapus.');
    } else {
      print('Item tidak ditemukan, tidak ada yang dihapus.');
    }

    _recalc();
  }

  void addItem(OrderItemModel item) {
    final order = state.order;
    if (order == null) return;

    final items = [...order.items];

    // kalau item sama → tambah qty, kalau beda → tambah baru
    final idx = items.indexWhere((it) => _sameItem(it, item));
    if (idx != -1) {
      final merged = items[idx].copyWith(
        quantity: items[idx].quantity + item.quantity,
      );
      items[idx] = merged;
    } else {
      items.add(item);
    }

    state = state.copyWith(order: order.copyWith(items: items));
    _recalc();
  }

  // ====== RECALC ======
  Future<void> _recalc() async {
    final order = state.order;
    if (order == null || _isCalculating) return;

    _isCalculating = true;
    try {
      // 1. hitung subtotal per item
      final updatedItems =
          order.items
              .map((it) => it.copyWith(subtotal: it.countSubTotalPrice()))
              .toList();

      // 2. total dari items
      final totalItems = updatedItems.fold<int>(
        0,
        (sum, it) => sum + it.subtotal,
      );

      // 3. total custom amount
      final totalCustom = (order.customAmountItems ?? const []).fold<int>(
        0,
        (s, ca) => s + (ca.amount ?? 0),
      );

      final totalBeforeDiscount = totalItems + totalCustom;
      final discount = order.discounts?.totalDiscount ?? 0;
      final totalAfterDiscount = totalBeforeDiscount - discount;

      int tax = 0;
      int service = 0;
      if (totalAfterDiscount > 0) {
        try {
          final calc = await _taxSvc.calculateOrderTotals(totalAfterDiscount);
          tax = calc.taxAmount;
          service = calc.serviceAmount;
        } catch (_) {}
      }

      final newOrder = order.copyWith(
        items: updatedItems,
        totalBeforeDiscount: totalBeforeDiscount,
        totalAfterDiscount: totalAfterDiscount,
        totalTax: tax,
        totalServiceFee: service,
        grandTotal: totalAfterDiscount + tax + service,
      );

      state = state.copyWith(order: newOrder);
    } finally {
      _isCalculating = false;
    }
  }

  // ====== MARK SYNCED (sesudah sukses kirim ke backend) ======
  void markSynced(OrderDetailModel serverOrder) {
    // anggap server sudah kembalikan order final
    state = state.copyWith(
      order: serverOrder,
      originalItems: List<OrderItemModel>.from(serverOrder.items),
    );
  }

  // ====== helper compare ======

  // item benar-benar sama (untuk cek perubahan)
  bool _sameItem(OrderItemModel a, OrderItemModel b) {
    if (a.menuItem.id != b.menuItem.id) return false;
    if ((a.notes ?? '') != (b.notes ?? '')) return false;
    if (a.orderType != b.orderType) return false;
    if (a.quantity != b.quantity) return false;

    // toppings
    final topsA = a.selectedToppings.map((e) => e.id).toList()..sort();
    final topsB = b.selectedToppings.map((e) => e.id).toList()..sort();
    if (!const ListEquality().equals(topsA, topsB)) return false;

    // addons
    if (a.selectedAddons.length != b.selectedAddons.length) return false;
    for (var i = 0; i < a.selectedAddons.length; i++) {
      final aa = a.selectedAddons[i].options?.map((o) => o.id).toList() ?? [];
      final bb = b.selectedAddons[i].options?.map((o) => o.id).toList() ?? [];
      aa.sort();
      bb.sort();
      if (!const ListEquality().equals(aa, bb)) return false;
    }

    return true;
  }

  // signature lebih longgar, buat merge item baru
  bool _sameSignature(OrderItemModel a, OrderItemModel b) {
    return a.menuItem.id == b.menuItem.id &&
        (a.notes ?? '') == (b.notes ?? '') &&
        a.orderType == b.orderType;
  }

  void clearAll() {
    state = state.copyWith(order: null, originalItems: const []);
  }

  //submit update order
  Future<bool> submitEditedOrder() async {
    state = state.copyWith(isSubmitting: true, error: null);

    final editedOrder = {
      'reason': state.reason,
      'items': state.order?.items ?? [],
    };

    if (editedOrder['items'] == []) return false;

    debugPrint('submitEditedOrder: $editedOrder');

    try {
      final result = await OrderService().patchOrderEdit(patchData: state);
      // final updated = await api.patchOrder(...);
      // delay
      await Future.delayed(const Duration(seconds: 3));

      if (result['success'] == true) {
        state = state.copyWith(
          order: null,
          isSubmitting: false,
          originalItems: const [],
        );
      }

      return true;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return false;
    }
  }
}

// provider
final onlineOrderEditorProvider = StateNotifierProvider.autoDispose<
  EditOrderItemNotifier,
  EditOrderItemModel
>((ref) => EditOrderItemNotifier(ref));

// class OnlineOrderEditorState {
//   final OrderDetailModel? order;
//   final List<EditOperation> pendingOps;
//   final bool isSubmitting;
//   final String? error;

//   OnlineOrderEditorState({
//     required this.order,
//     this.pendingOps = const [],
//     this.isSubmitting = false,
//     this.error,
//   });

//   OnlineOrderEditorState copyWith({
//     OrderDetailModel? order,
//     List<EditOperation>? pendingOps,
//     bool? isSubmitting,
//     String? error,
//   }) {
//     return OnlineOrderEditorState(
//       order: order ?? this.order,
//       pendingOps: pendingOps ?? this.pendingOps,
//       isSubmitting: isSubmitting ?? this.isSubmitting,
//       error: error,
//     );
//   }
// }

// // ===== NOTIFIER =====
// class OnlineOrderEditorNotifier extends StateNotifier<OnlineOrderEditorState> {
//   OnlineOrderEditorNotifier(this.ref)
//     : _taxSvc = TaxAndServiceRepository(),
//       super(OnlineOrderEditorState(order: null));

//   final Ref ref;
//   final TaxAndServiceRepository _taxSvc;

//   bool _isCalculating = false;

//   void load(OrderDetailModel order) {
//     state = OnlineOrderEditorState(order: order);
//   }

//   void clearPendingOps() => state = state.copyWith(pendingOps: []);
//   void clearAll() => state = OnlineOrderEditorState(order: null);

//   // ---------- ADD ----------
//   /// Tambah 1 item:
//   /// - jika ada item serupa → tambah qty pada item yang ada (local) + buat op: update (qty baru)
//   /// - jika tidak serupa → push item baru + buat op: add
//   void addItem(OrderItemModel newItem) {
//     final cur = state.order;
//     if (cur == null) return;

//     // qty minimal 1
//     newItem = newItem.copyWith(quantity: max(1, newItem.quantity));

//     final items = [...cur.items];
//     final idx = findSimilarIndex(items, newItem);

//     if (idx != -1) {
//       final base = items[idx];
//       final merged = base.copyWith(quantity: base.quantity + newItem.quantity);
//       items[idx] = merged;

//       // pending op: UPDATE qty item yang sama (pakai itemId dari base)
//       final targetItemId = base.menuItem.id; // PENTING: _id item
//       final patch = EditUpdatePatch(quantity: merged.quantity);
//       final op = EditOperation.update(
//         itemId: targetItemId,
//         patch: patch,
//         oos: false,
//       );
//       state = state.copyWith(
//         order: cur.copyWith(items: items),
//         pendingOps: [...state.pendingOps, op],
//       );
//     } else {
//       // push item baru
//       final updated = [...items, newItem];
//       final op = _opFromAddModel(newItem);
//       state = state.copyWith(
//         order: cur.copyWith(items: updated),
//         pendingOps: [...state.pendingOps, op],
//       );
//     }

//     _recalculateAll();
//   }

//   // helper bikin op.add dari OrderItemModel
//   EditOperation _opFromAddModel(OrderItemModel it) {
//     return EditOperation.add(
//       item: EditAddItem(
//         menuItem: it.menuItem.id,
//         quantity: it.quantity,
//         selectedAddons: [
//           for (final ad in it.selectedAddons)
//             SelectedAddon(
//               id: ad.id!,
//               options: [
//                 for (final o in (ad.options ?? const []))
//                   SelectedAddonOption(id: o.id!),
//               ],
//             ),
//         ],
//         selectedToppings: [
//           for (final t in it.selectedToppings) SelectedTopping(id: t.id!),
//         ],
//         notes: it.notes ?? '',
//         dineType: it.orderType.value,
//       ),
//     );
//   }

//   // ---------- ADD MULTIPLE ----------
//   void addItems(List<OrderItemModel> addList) {
//     for (final it in addList) {
//       addItem(it);
//     }
//   }

//   // ---------- UPDATE (ganti isi item) ----------
//   /// Ubah 1 item existing (by reference `oldItem` → `newItem`):
//   /// - jika newItem serupa dengan item lain → gabungkan (hapus old, tambah qty di target)
//   /// - jika tidak serupa → replace di posisi lama
//   /// pendingOps:
//   /// - gabung → UPDATE qty pada target + REMOVE old
//   /// - replace → UPDATE detail pada old (selectedAddons/selectedToppings/qty/notes/dineType)
//   void editOrderItem(
//     OrderItemModel oldItem,
//     OrderItemModel newItem, {
//     bool oos = false,
//   }) {
//     final cur = state.order;
//     if (cur == null) return;

//     final items = [...cur.items];
//     final idxOld = items.indexOf(oldItem);
//     if (idxOld == -1) return;

//     final idxSimilar = findSimilarIndexExcept(items, newItem, idxOld);

//     if (idxSimilar != -1) {
//       // gabung ke target
//       final target = items[idxSimilar];
//       final merged = target.copyWith(
//         quantity: target.quantity + newItem.quantity,
//       );
//       items[idxSimilar] = merged;
//       items.removeAt(idxOld);

//       // pending ops:
//       final ops = <EditOperation>[];

//       ops.add(
//         EditOperation.update(
//           itemId: target.menuItem.id,
//           patch: EditUpdatePatch(quantity: merged.quantity),
//           oos: oos,
//         ),
//       );
//       ops.add(EditOperation.remove(itemId: oldItem.menuItem.id, oos: oos));

//       state = state.copyWith(
//         order: cur.copyWith(items: items),
//         pendingOps: [...state.pendingOps, ...ops],
//       );
//     } else {
//       // replace di posisi lama
//       items[idxOld] = newItem;

//       // pending op: UPDATE detail pada oldItemId
//       final patch = EditUpdatePatch(
//         quantity: newItem.quantity,
//         notes: newItem.notes,
//         dineType: newItem.orderType.value,
//         selectedAddons: [
//           for (final ad in newItem.selectedAddons)
//             SelectedAddon(
//               id: ad.id!,
//               options: [
//                 for (final o in (ad.options ?? const []))
//                   SelectedAddonOption(id: o.id!),
//               ],
//             ),
//         ],
//         selectedToppings: [
//           for (final t in newItem.selectedToppings) SelectedTopping(id: t.id!),
//         ],
//       );
//       final op = EditOperation.update(
//         itemId: oldItem.menuItem.id,
//         patch: patch,
//         oos: oos,
//       );
//       state = state.copyWith(
//         order: cur.copyWith(items: items),
//         pendingOps: [...state.pendingOps, op],
//       );
//     }

//     _recalculateAll();
//   }

//   // ---------- UPDATE QTY SAJA ----------
//   void updateItemQuantity(String itemId, int newQty, {bool oos = false}) {
//     final cur = state.order;
//     if (cur == null) return;
//     final items = [...cur.items];

//     final idx = items.indexWhere((it) => it.menuItem.id == itemId);
//     if (idx == -1) return;

//     final updated = items[idx].copyWith(quantity: max(1, newQty));
//     items[idx] = updated;

//     final op = EditOperation.update(
//       itemId: itemId,
//       patch: EditUpdatePatch(quantity: updated.quantity),
//       oos: oos,
//     );

//     state = state.copyWith(
//       order: cur.copyWith(items: items),
//       pendingOps: [...state.pendingOps, op],
//     );

//     _recalculateAll();
//   }

//   // ---------- REMOVE ----------
//   void removeItemById(String itemId, {bool oos = false}) {
//     final cur = state.order;
//     if (cur == null) return;
//     final items = [...cur.items];
//     final idx = items.indexWhere((it) => it.menuItem.id == itemId);
//     if (idx == -1) return;

//     items.removeAt(idx);

//     final op = EditOperation.remove(itemId: itemId, oos: oos);
//     state = state.copyWith(
//       order: cur.copyWith(items: items),
//       pendingOps: [...state.pendingOps, op],
//     );

//     _recalculateAll();
//   }

//   // ---------- RECALC ----------
//   Future<void> _recalculateAll() async {
//     final cur = state.order;
//     if (cur == null || _isCalculating) return;

//     _isCalculating = true;
//     try {
//       // 1) refresh subtotal tiap item (pakai fungsi client)
//       final updatedItems =
//           cur.items
//               .map((it) => it.copyWith(subtotal: it.countSubTotalPrice()))
//               .toList();

//       // 2) total dari items
//       final totalFromItems = updatedItems.fold<int>(
//         0,
//         (s, it) => s + it.subtotal,
//       );

//       // 3) custom amounts (kalau ada di modelmu)
//       final totalFromCustom = (cur.customAmountItems ?? const []).fold<int>(
//         0,
//         (s, ca) => s + (ca.amount ?? 0),
//       );

//       final totalBeforeDiscount = totalFromItems + totalFromCustom;

//       // 4) diskon
//       final discountAmount = cur.discounts?.totalDiscount ?? 0;
//       final totalAfterDiscount = totalBeforeDiscount - discountAmount;

//       print('Total before discount: $totalBeforeDiscount');
//       print('Discount amount: $discountAmount');
//       print('Total after discount: $totalAfterDiscount');
//       // 5) tax + service
//       int totalTax = 0;
//       int totalService = 0;
//       if (totalAfterDiscount > 0) {
//         try {
//           print('Calculating tax and service for amount: $totalAfterDiscount');
//           final result = await _taxSvc.calculateOrderTotals(totalAfterDiscount);
//           print('Tax calculation result: $result');
//           totalTax = result.taxAmount;
//           totalService = result.serviceAmount;
//         } catch (e) {
//           // ignore, biarkan 0
//         }
//       }

//       print('Total tax: $totalTax');
//       print('Total service: $totalService');

//       final grandTotal = totalAfterDiscount + totalTax + totalService;

//       state = state.copyWith(
//         order: cur.copyWith(
//           items: updatedItems,
//           totalBeforeDiscount: totalBeforeDiscount,
//           totalAfterDiscount: totalAfterDiscount,
//           totalTax: totalTax,
//           totalServiceFee: totalService,
//           grandTotal: grandTotal,
//         ),
//       );
//     } finally {
//       _isCalculating = false;
//     }
//   }

//   // ---------- SUBMIT ----------
//   Future<void> submitEdits({required String reason}) async {
//     final order = state.order;
//     if (order == null || state.pendingOps.isEmpty) return;

//     state = state.copyWith(isSubmitting: true, error: null);
//     final api = OrderService();
//     final user = await HiveService.getUser();
//     final idempotencyKey = 'edit-${DateTime.now().millisecondsSinceEpoch}';

//     try {
//       // Kirim PATCH & refresh order dari server
//       // final updated = await api.patchOrder(
//       //   orderMongoId: order.id!,
//       //   body: EditOrderOpsRequest(reason: reason, operations: state.pendingOps),
//       //   idempotencyKey: idempotencyKey,
//       //   bearer: user?.token,
//       // );

//       // state = state.copyWith(order: updated, pendingOps: [], isSubmitting: false);
//       state = state.copyWith(pendingOps: [], isSubmitting: false); // sementara
//     } catch (e) {
//       state = state.copyWith(isSubmitting: false, error: e.toString());
//       rethrow;
//     }
//   }

//   final _listEq = const DeepCollectionEquality.unordered();

//   // bandingkan toppings by id
//   bool toppingsEqual(List<ToppingModel> a, List<ToppingModel> b) {
//     return _listEq.equals(
//       a.map((e) => e.id).toList(),
//       b.map((e) => e.id).toList(),
//     );
//   }

//   // bandingkan addons by options.id (abaikan urutan)
//   bool addonsEqual(List<AddonModel> a, List<AddonModel> b) {
//     if (a.length != b.length) return false;
//     // Normalisasi ke set optionId (tiap grup addon)
//     List<Set<String>> toSets(List<AddonModel> xs) =>
//         xs
//             .map(
//               (ad) => ad.options?.map((o) => o.id ?? '').toSet() ?? <String>{},
//             )
//             .toList();
//     final sa = toSets(a)..sort((x, y) => x.length.compareTo(y.length));
//     final sb = toSets(b)..sort((x, y) => x.length.compareTo(y.length));
//     if (sa.length != sb.length) return false;
//     for (var i = 0; i < sa.length; i++) {
//       if (!(sa[i].length == sb[i].length && sa[i].containsAll(sb[i]))) {
//         return false;
//       }
//     }
//     return true;
//   }

//   bool notesEqual(String? a, String? b) => (a ?? '') == (b ?? '');

//   bool sameSignature(OrderItemModel x, OrderItemModel y) {
//     return x.menuItem.id == y.menuItem.id &&
//         toppingsEqual(x.selectedToppings, y.selectedToppings) &&
//         addonsEqual(x.selectedAddons, y.selectedAddons) &&
//         notesEqual(x.notes, y.notes) &&
//         x.orderType == y.orderType;
//   }

//   int findSimilarIndex(List<OrderItemModel> items, OrderItemModel target) {
//     return items.indexWhere((it) => sameSignature(it, target));
//   }

//   int findSimilarIndexExcept(
//     List<OrderItemModel> items,
//     OrderItemModel target,
//     int exclude,
//   ) {
//     for (var i = 0; i < items.length; i++) {
//       if (i == exclude) continue;
//       if (sameSignature(items[i], target)) return i;
//     }
//     return -1;
//   }
// }

// // ===== Provider =====
// final onlineOrderEditorProvider = StateNotifierProvider.autoDispose<
//   OnlineOrderEditorNotifier,
//   OnlineOrderEditorState
// >((ref) {
//   return OnlineOrderEditorNotifier(ref);
// });
