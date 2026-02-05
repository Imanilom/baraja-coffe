import 'package:flutter/widgets.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/edit_order_item.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/repositories/tax_and_service_repository.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'package:collection/collection.dart';
import 'package:uuid/uuid.dart';

// =====================================================
// NOTIFIER EDIT ORDER ITEM
// =====================================================
class OrderEditorNotifier extends StateNotifier<EditOrderItemModel> {
  OrderEditorNotifier(this.ref)
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
  String? _idempotencyKey; // Idempotency key state

  /// dipanggil waktu masuk halaman edit
  Future<void> load(OrderDetailModel order) async {
    // 1) Ambil master menu dari Hive
    final menuBox = Hive.box<MenuItemModel>('menuItemsBox');
    final masterMenus = menuBox.values.toList();

    // 2) Enrich tiap item (menuItem + addons/toppings)
    final enrichedItems =
        order.items.map((it) {
          final fullMenu =
              masterMenus.firstWhereOrNull((m) => m.id == it.menuItem.id) ??
              it.menuItem;

          // 1) Ambil default addons dari master (option.isDefault == true)
          final defaultAddons =
              (fullMenu.addons ?? const <AddonModel>[])
                  .map((ad) {
                    final defaults =
                        (ad.options ?? const <AddonOptionModel>[])
                            .where((o) => o.isDefault == true)
                            .toList();
                    if (defaults.isEmpty) return null;
                    return ad.copyWith(options: defaults);
                  })
                  .whereType<AddonModel>()
                  .toList();

          // 2) Gunakan selected jika ada; kalau kosong → pakai default
          final baseSelectedAddons =
              (it.selectedAddons.isNotEmpty)
                  ? it.selectedAddons
                  : defaultAddons;

          // 3) Resolve ke master agar objek lengkap
          final resolvedAddons = _resolveSelectedAddons(
            fullMenu.addons ?? const [],
            baseSelectedAddons,
          );
          final resolvedToppings = _resolveSelectedToppings(
            fullMenu.toppings ?? const [],
            it.selectedToppings,
          );

          final updated = it.copyWith(
            menuItem: fullMenu,
            selectedAddons: resolvedAddons,
            selectedToppings: resolvedToppings,
            quantity: (it.quantity <= 0) ? 1 : it.quantity,
            notes: it.notes,
            orderType: it.orderType,
          );

          return updated.copyWith(subtotal: updated.countSubTotalPrice());
        }).toList();

    // 3) Susun kembali order
    final enrichedOrder = order.copyWith(items: enrichedItems);

    // 4) Simpan ke state
    state = state.copyWith(
      order: enrichedOrder,
      originalItems: List<OrderItemModel>.from(enrichedItems),
      reason: null,
      error: null,
    );
    _idempotencyKey = null; // New order loaded
  }

  List<ToppingModel> _resolveSelectedToppings(
    List<ToppingModel> masterToppings,
    List<ToppingModel> selected,
  ) {
    if (selected.isEmpty || masterToppings.isEmpty) return selected;
    final selectedIds = selected.map((t) => t.id).toSet();
    final resolved = <ToppingModel>[];
    for (final id in selectedIds) {
      final full = masterToppings.firstWhereOrNull((t) => t.id == id);
      if (full != null) {
        resolved.add(full);
      } else {
        final raw = selected.firstWhereOrNull((t) => t.id == id);
        if (raw != null) resolved.add(raw);
      }
    }
    return resolved;
  }

  List<AddonModel> _resolveSelectedAddons(
    List<AddonModel> masterAddons,
    List<AddonModel> selected,
  ) {
    if (selected.isEmpty || masterAddons.isEmpty) return selected;

    final resolved = <AddonModel>[];
    for (final selAddon in selected) {
      final masterAddon = masterAddons.firstWhereOrNull(
        (a) => a.id == selAddon.id,
      );
      if (masterAddon == null) {
        resolved.add(selAddon);
        continue;
      }

      final selOptionIds =
          (selAddon.options ?? const <AddonOptionModel>[])
              .map((o) => o.id)
              .toSet();
      final fullOptions = <AddonOptionModel>[];

      for (final oid in selOptionIds) {
        final fullOpt = (masterAddon.options ?? const <AddonOptionModel>[])
            .firstWhereOrNull((o) => o.id == oid);
        if (fullOpt != null) {
          fullOptions.add(fullOpt);
        } else {
          final raw = selAddon.options?.firstWhereOrNull((o) => o.id == oid);
          if (raw != null) fullOptions.add(raw);
        }
      }

      resolved.add(masterAddon.copyWith(options: fullOptions));
    }
    return resolved;
  }

  bool get hasItemChanges {
    final curItems = state.order?.items ?? const <OrderItemModel>[];
    final origItems = state.originalItems ?? const <OrderItemModel>[];

    if (curItems.length != origItems.length) return true;

    for (var i = 0; i < curItems.length; i++) {
      if (!_sameItem(curItems[i], origItems[i])) return true;
    }
    return false;
  }

  void editOrderItem(OrderItemModel oldItem, OrderItemModel newItem) {
    final order = state.order;
    if (order == null) return;

    final items = [...order.items];

    final oldIdx = items.indexOf(oldItem);
    if (oldIdx == -1) return;

    final dupIdx = items.indexWhere((it) => _sameItem(it, newItem));

    if (dupIdx != -1 && dupIdx != oldIdx) {
      final merged = items[dupIdx].copyWith(
        quantity: items[dupIdx].quantity + newItem.quantity,
      );
      items[dupIdx] = merged;
      items.removeAt(oldIdx);
    } else {
      items[oldIdx] = newItem;
    }

    state = state.copyWith(order: order.copyWith(items: items));
    _idempotencyKey = null; // Cart changed
    _recalc();
  }

  void removeItem(OrderItemModel menuItem) {
    final index = state.order!.items.indexOf(menuItem);

    if (index != -1) {
      final updatedItems = [...state.order!.items];
      updatedItems.removeAt(index);
      state = state.copyWith(order: state.order!.copyWith(items: updatedItems));
      _idempotencyKey = null; // Cart changed
      AppLogger.info('Item order berhasil dihapus.');
    } else {
      AppLogger.warning('Item tidak ditemukan, tidak ada yang dihapus.');
    }

    _recalc();
  }

  Future<bool> deleteExistingItem(OrderItemModel item) async {
    // 1. Validasi
    final orderId = state.order?.orderId;
    final menuItemId = item.menuItem.id;

    if (orderId == null || menuItemId == null) {
      AppLogger.error('Cannot delete item: Missing orderId or menuItemId');
      return false;
    }

    state = state.copyWith(isSubmitting: true, error: null);

    try {
      // 2. Call API
      // Note: Backend might need specific endpoint or parameters
      // Using existing deleteOrderItemAtOrder
      await OrderService().deleteOrderItemAtOrder(
        orderId: orderId,
        menuItemId: menuItemId,
      );

      // 3. Update local state
      // Instead of full reload, just remove locally and recalculate
      final currentOrder = state.order;
      if (currentOrder != null) {
        final updatedItems = List<OrderItemModel>.from(currentOrder.items);
        updatedItems.removeWhere((it) => it.orderItemid == item.orderItemid);

        final updatedOriginals =
            state.originalItems != null
                ? List<OrderItemModel>.from(state.originalItems!)
                : <OrderItemModel>[];
        updatedOriginals.removeWhere(
          (it) => it.orderItemid == item.orderItemid,
        );

        state = state.copyWith(
          order: currentOrder.copyWith(items: updatedItems),
          originalItems: updatedOriginals,
          isSubmitting: false,
        );
        _recalc();
      }

      return true;
    } catch (e) {
      AppLogger.error('Failed to delete existing item', error: e);
      state = state.copyWith(
        isSubmitting: false,
        error: 'Gagal menghapus item: $e',
      );
      return false;
    }
  }

  void addItem(OrderItemModel item) {
    final order = state.order;
    if (order == null) return;

    final items = [...order.items];

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
    _idempotencyKey = null; // Cart changed
    _recalc();
  }

  Future<void> _recalc() async {
    final order = state.order;
    if (order == null || _isCalculating) return;

    _isCalculating = true;
    try {
      final updatedItems =
          order.items
              .map((it) => it.copyWith(subtotal: it.countSubTotalPrice()))
              .toList();

      final totalItems = updatedItems.fold<int>(
        0,
        (sum, it) => sum + it.subtotal,
      );

      final totalCustom = (order.customAmountItems ?? const []).fold<int>(
        0,
        (s, ca) => s + ca.amount,
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

  void markSynced(OrderDetailModel serverOrder) {
    state = state.copyWith(
      order: serverOrder,
      originalItems: List<OrderItemModel>.from(serverOrder.items),
    );
  }

  bool _sameItem(OrderItemModel a, OrderItemModel b) {
    if (a.orderItemid != b.orderItemid) return false;
    if (a.menuItem.id != b.menuItem.id) return false;
    if ((a.notes ?? '') != (b.notes ?? '')) return false;
    if (a.orderType != b.orderType) return false;
    if (a.quantity != b.quantity) return false;

    final topsA = a.selectedToppings.map((e) => e.id).toList()..sort();
    final topsB = b.selectedToppings.map((e) => e.id).toList()..sort();
    if (!const ListEquality().equals(topsA, topsB)) return false;

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

  void clearAll() {
    state = state.copyWith(order: null, originalItems: const []);
  }

  Future<bool> submitEditedOrder() async {
    state = state.copyWith(isSubmitting: true, error: null);

    final editedOrder = {
      'reason': state.reason,
      'items': state.order?.items ?? [],
    };

    if ((editedOrder['items'] as List).isEmpty) return false;

    debugPrint('submitEditedOrder: $editedOrder');

    try {
      // Generate idempotency key if not exists (new intent)
      _idempotencyKey ??= const Uuid().v4();
      AppLogger.debug('Using Idempotency Key for Edit: $_idempotencyKey');

      final result = await OrderService().patchOrderEdit(
        patchData: state,
        idempotencyKey: _idempotencyKey,
      );
      // Simulasikan delay agar user merasa diproses
      await Future.delayed(const Duration(seconds: 1));

      if (result['success'] == true) {
        state = state.copyWith(
          order: null,
          isSubmitting: false,
          originalItems: const [],
        );
        _idempotencyKey = null; // Reset on success
        return true;
      }

      return false;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return false;
    }
  }
}

// provider
final orderEditorProvider =
    StateNotifierProvider.autoDispose<OrderEditorNotifier, EditOrderItemModel>(
      (ref) => OrderEditorNotifier(ref),
    );
