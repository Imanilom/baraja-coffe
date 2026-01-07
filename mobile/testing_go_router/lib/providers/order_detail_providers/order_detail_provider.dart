import 'package:flutter/cupertino.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/extensions/order_item_extensions.dart';
import 'package:kasirbaraja/features/promos/promo_engine.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/promo_group.model.dart';
import 'package:kasirbaraja/providers/menu_item_provider.dart';
import 'package:kasirbaraja/providers/promotion_providers/auto_promo_provider.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/repositories/tax_and_service_repository.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:collection/collection.dart';
import 'package:uuid/uuid.dart';

class OrderDetailNotifier extends StateNotifier<OrderDetailModel?> {
  OrderDetailNotifier(this.ref) : super(null);

  final TaxAndServiceRepository _taxAndServiceRepository =
      TaxAndServiceRepository();
  final Ref ref;

  bool _isCalculating = false;

  // ============================================================================
  // ORDER INITIALIZATION
  // ============================================================================

  /// Initialize new order
  void initializeOrder({required OrderType orderType}) {
    debugPrint('Initialize order with type: $orderType');
    if (state != null) return;

    state = OrderDetailModel(
      orderType: orderType,
      items: [],
      selectedPromoIds: [],
    );
  }

  /// Load existing order
  void loadOrder(OrderDetailModel orderDetail) {
    clearOrder();
    state = orderDetail;
    debugPrint('Order loaded: ${orderDetail.orderId}');
  }

  /// Clear current order
  void clearOrder() {
    state = null;
    debugPrint('Order cleared');
  }

  // ============================================================================
  // ORDER PROPERTIES UPDATE
  // ============================================================================

  void updateOrderType(OrderType orderType) {
    if (state != null) {
      state = state!.copyWith(orderType: orderType);
      debugPrint('Order type updated: $orderType');
    }
  }

  void updatePaymentMethod(String paymentMethod, String? paymentType) {
    if (state != null) {
      state = state!.copyWith(paymentMethod: paymentMethod);
      if (paymentType != null) {
        state = state!.copyWith(
          payments: [
            PaymentModel(method: paymentType, amount: state!.grandTotal),
          ],
        );
      }
    }
  }

  void updatePaymentType(String paymentType) {
    if (state != null) {
      state = state!.copyWith(paymentType: paymentType);
    }
  }

  void updateIsOpenBill(bool isOpenBill) {
    if (state != null) {
      state = state!.copyWith(isOpenBill: isOpenBill);
    }
  }

  void updateCustomerDetails({
    String? customerName,
    String? phoneNumber,
    String? tableNumber,
  }) {
    if (state != null) {
      state = state!.copyWith(
        user: customerName ?? state!.user,
        tableNumber: tableNumber ?? state!.tableNumber,
      );
    }
  }

  void updateOrderId() {
    if (state != null) {
      state = state!.copyWith(orderId: const Uuid().v1());
    }
  }

  void addOrderIdToOrderDetail(String orderId) {
    if (state != null) {
      state = state!.copyWith(orderId: orderId);
      debugPrint('Order ID added: $orderId');
    }
  }

  void addPaymentStatusToOrderDetail(String paymentStatus) {
    if (state != null) {
      state = state!.copyWith(paymentStatus: paymentStatus);
      debugPrint('Payment status added: $paymentStatus');
    }
  }

  // ============================================================================
  // ITEM MANAGEMENT
  // ============================================================================

  /// Add single item to order
  void addItemToOrder(OrderItemModel orderItem) {
    if (state == null) return;

    final existingIndex = state!.items.findSimilarItemIndex(orderItem);

    if (existingIndex != -1) {
      // Merge dengan item yang sama
      final updatedItem = state!.items[existingIndex].copyWith(
        quantity: state!.items[existingIndex].quantity + orderItem.quantity,
      );
      final updatedItems = [...state!.items];
      updatedItems[existingIndex] = updatedItem;
      state = state!.copyWith(items: updatedItems);
    } else {
      // Add item baru
      state = state!.copyWith(items: [...state!.items, orderItem]);
    }

    debugPrint('Item added: ${orderItem.menuItem.name} x${orderItem.quantity}');
    _recalculateAll();
  }

  /// Add multiple items to order (untuk promo group)
  void addItemsToOrder(List<OrderItemModel> items) {
    if (state == null) return;

    debugPrint('Adding ${items.length} items to order...');
    var updated = [...state!.items];

    for (final orderItem in items) {
      final idx = updated.findSimilarItemIndex(orderItem);
      if (idx != -1) {
        updated[idx] = updated[idx].copyWith(
          quantity: updated[idx].quantity + orderItem.quantity,
        );
      } else {
        updated.add(orderItem);
      }
    }

    state = state!.copyWith(items: updated);
    _recalculateAll();
  }

  /// Remove item from order
  void removeItem(OrderItemModel menuItem) {
    if (state == null) return;

    final index = state!.items.indexOf(menuItem);
    if (index != -1) {
      final updatedItems = [...state!.items];
      updatedItems.removeAt(index);
      state = state!.copyWith(items: updatedItems);

      debugPrint('Item removed: ${menuItem.menuItem.name}');
      _recalculateAll();
    }
  }

  /// Update item quantity
  void updateItemQuantity(String menuItemId, int quantity) {
    if (state == null) return;

    state = state!.copyWith(
      items:
          state!.items.map((item) {
            if (item.menuItem.id == menuItemId) {
              return item.copyWith(quantity: quantity);
            }
            return item;
          }).toList(),
    );

    _recalculateAll();
  }

  /// Edit existing order item
  void editOrderItem(OrderItemModel oldOrderItem, OrderItemModel newOrderItem) {
    if (state == null) return;

    final indexOldItem = state!.items.indexOf(oldOrderItem);
    if (indexOldItem == -1) return;

    debugPrint('Editing order item...');

    final existingIndex = _findExistingItemIndexExcept(
      newOrderItem,
      indexOldItem,
    );
    final updatedItems = [...state!.items];

    if (existingIndex != -1) {
      // Merge dengan item yang sama
      updatedItems[existingIndex] = updatedItems[existingIndex].copyWith(
        quantity: updatedItems[existingIndex].quantity + newOrderItem.quantity,
      );
      updatedItems.removeAt(indexOldItem);
    } else {
      // Replace item
      updatedItems[indexOldItem] = newOrderItem;
    }

    state = state!.copyWith(items: updatedItems);
    _recalculateAll();
  }

  // ============================================================================
  // CUSTOM AMOUNT MANAGEMENT
  // ============================================================================

  void addCustomAmountItem(CustomAmountItemsModel customAmountItem) {
    if (state == null) return;

    final currentCustomAmounts = state!.customAmountItems ?? [];
    final updatedCustomAmounts = [...currentCustomAmounts, customAmountItem];

    state = state!.copyWith(customAmountItems: updatedCustomAmounts);
    _recalculateAll();

    debugPrint('Custom amount added: ${customAmountItem.name}');
  }

  void removeCustomAmountItem(CustomAmountItemsModel customAmountItem) {
    if (state == null) return;

    final currentCustomAmounts = state!.customAmountItems ?? [];
    final updatedCustomAmounts =
        currentCustomAmounts.where((item) => item != customAmountItem).toList();

    state = state!.copyWith(customAmountItems: updatedCustomAmounts);
    _recalculateAll();

    debugPrint('Custom amount removed');
  }

  // ============================================================================
  // PROMO MANAGEMENT
  // ============================================================================

  /// Select/add promo ID
  void selectAutoPromo(String promoId) {
    if (state == null) return;

    final current = state!.selectedPromoIds;
    if (current.contains(promoId)) return;

    state = state!.copyWith(selectedPromoIds: [...current, promoId]);
    debugPrint('Promo selected: $promoId');
    _recalculateAll();
  }

  /// Deselect/remove promo ID
  void deselectAutoPromo(String promoId) {
    if (state == null) return;

    final updated =
        state!.selectedPromoIds.where((id) => id != promoId).toList();

    state = state!.copyWith(selectedPromoIds: updated);
    debugPrint('Promo deselected: $promoId');
    _recalculateAll();
  }

  /// Update all selected promo IDs
  void updateSelectedPromos(List<String> promoIds) {
    if (state == null) return;

    state = state!.copyWith(selectedPromoIds: promoIds);
    debugPrint('Selected promos updated: $promoIds');
    _recalculateAll();
  }

  /// Toggle promo (select/deselect)
  void togglePromo(String promoId) {
    if (state == null) return;

    final currentIds = state!.selectedPromoIds;
    final newIds =
        currentIds.contains(promoId)
            ? currentIds.where((id) => id != promoId).toList()
            : [...currentIds, promoId];

    updateSelectedPromos(newIds);
  }

  /// Clear all selected promos
  void clearSelectedPromos() {
    if (state == null) return;

    state = state!.copyWith(selectedPromoIds: []);
    _recalculateAll();
    debugPrint('All promos cleared');
  }

  /// Apply promo group (untuk bundling/paket)
  Future<void> applyPromoGroup(PromoGroupModel group) async {
    if (state == null) {
      initializeOrder(orderType: OrderType.dineIn);
    }

    debugPrint('🎯 Applying promo group: ${group.name}');

    // Get menu items
    final menus = await ref.read(menuItemRepository).getLocalMenuItems();
    MenuItemModel? findMenu(String id) =>
        menus.firstWhereOrNull((m) => m.id == id);

    final items = <OrderItemModel>[];

    // Build order items dari group lines
    for (final line in group.lines) {
      final menu = findMenu(line.menuItemId);
      if (menu == null) {
        debugPrint('⚠️ Menu not found: ${line.menuItemId}');
        continue;
      }

      // Get default addons
      final selectedAddons = _getDefaultAddons(menu);

      items.add(
        OrderItemModel(
          menuItem: menu,
          selectedToppings: const [],
          selectedAddons: selectedAddons,
          quantity: line.qty,
          subtotal: 0,
          reservedPromoId: group.promoId,
        ),
      );
    }

    if (items.isEmpty) {
      debugPrint('❌ No items to add from promo group');
      return;
    }

    debugPrint('📦 Adding ${items.length} items from promo group');

    // ✅ PERBAIKAN: Update state SEKALI dengan semua perubahan
    final currentIds = state!.selectedPromoIds;
    final newIds =
        currentIds.contains(group.promoId)
            ? currentIds
            : [...currentIds, group.promoId];

    // Merge items
    var updatedItems = [...state!.items];
    for (final orderItem in items) {
      final idx = updatedItems.findSimilarItemIndex(orderItem);
      if (idx != -1) {
        updatedItems[idx] = updatedItems[idx].copyWith(
          quantity: updatedItems[idx].quantity + orderItem.quantity,
        );
      } else {
        updatedItems.add(orderItem);
      }
    }

    // Update state SEKALI dengan semua perubahan
    state = state!.copyWith(items: updatedItems, selectedPromoIds: newIds);

    debugPrint(
      '✅ State updated: ${updatedItems.length} items, ${newIds.length} promos',
    );

    // Recalculate setelah state lengkap
    await _recalculateAll();

    debugPrint('✅ Promo group applied successfully');
  }

  /// Auto-select eligible promos
  Future<void> autoSelectEligiblePromos() async {
    if (state == null) return;

    try {
      debugPrint('Auto-selecting eligible promos...');

      final allPromos =
          await ref.read(autoPromoRepository).getLocalAutoPromos();
      final now = DateTime.now();

      final menuItems = await ref.read(menuItemRepository).getLocalMenuItems();
      MenuItemModel? findMenuItemById(String id) =>
          menuItems.firstWhereOrNull((m) => m.id == id);

      final eligibleIds = <String>[];

      for (final promo in allPromos) {
        if (!_isPromoValidNow(promo, now)) continue;

        final isEligible = _checkPromoEligibility(promo, state!, now);

        if (isEligible && _shouldAutoSelect(promo.promoType)) {
          eligibleIds.add(promo.id);
        }
      }

      if (eligibleIds.isNotEmpty) {
        updateSelectedPromos(eligibleIds);
        debugPrint('Auto-selected ${eligibleIds.length} promos');
      }
    } catch (e) {
      debugPrint('Error auto-selecting promos: $e');
    }
  }

  // ============================================================================
  // PAYMENT MANAGEMENT
  // ============================================================================

  void setPayments(List<PaymentModel> payments) {
    if (state == null) return;
    state = state!.copyWith(payments: payments);
  }

  void addPayment(PaymentModel payment) {
    if (state == null) return;
    final current = state!.payments;
    state = state!.copyWith(payments: [...current, payment]);
  }

  void updatePaymentAmount(int paymentAmount) {
    if (state != null) {
      if (state?.paymentType?.toLowerCase() == 'cash' ||
          state?.paymentType?.toLowerCase() == 'tunai') {
        state = state!.copyWith(paymentAmount: paymentAmount);
      } else {
        state = state!.copyWith(paymentAmount: state!.grandTotal);
      }
    }
  }

  void updateChangeAmount(int changeAmount) {
    if (state != null) {
      state = state!.copyWith(changeAmount: changeAmount);
    }
  }

  void updateIsSplitPayment(bool isSplitPayment) {
    if (state != null) {
      state = state!.copyWith(isSplitPayment: isSplitPayment);
    }
  }

  // ============================================================================
  // CALCULATION ENGINE
  // ============================================================================

  Future<void> _recalculateAll() async {
    if (state == null || _isCalculating) {
      debugPrint(
        '⏭️ Skipping recalculation: state=${state != null}, calculating=$_isCalculating',
      );
      return;
    }

    _isCalculating = true;

    try {
      debugPrint('🔄 Starting recalculation...');
      debugPrint(
        '📊 Current state: ${state!.items.length} items, ${state!.selectedPromoIds.length} selected promos',
      );

      // 1) Update subtotal setiap item
      final updatedItems =
          state!.items
              .map((it) => it.copyWith(subtotal: it.countSubTotalPrice()))
              .toList();

      // 2) Total dari items
      final totalFromItems = updatedItems.fold<int>(
        0,
        (s, it) => s + it.subtotal,
      );

      // 3) Total dari custom amounts
      final totalFromCustomAmounts = (state!.customAmountItems ?? []).fold<int>(
        0,
        (s, it) => s + (it.amount ?? 0),
      );

      // 4) Total before discount
      final totalBeforeDiscount = totalFromItems + totalFromCustomAmounts;

      debugPrint('💰 Total before discount: $totalBeforeDiscount');

      // 5) Get selected promos
      final allPromos =
          await ref.read(autoPromoRepository).getLocalAutoPromos();
      final selectedIds = state!.selectedPromoIds;

      debugPrint(
        '🎫 All promos: ${allPromos.length}, Selected IDs: $selectedIds',
      );

      final selectedPromos =
          allPromos.where((p) => selectedIds.contains(p.id)).toList();

      debugPrint(
        '✅ Selected promos: ${selectedPromos.map((p) => p.name).toList()}',
      );

      // 6) Get menu items for lookup
      final menuItems = await ref.read(menuItemRepository).getLocalMenuItems();
      MenuItemModel? findMenuItemById(String id) =>
          menuItems.firstWhereOrNull((m) => m.id == id);

      final now = DateTime.now();

      // 7) Apply promo engine
      debugPrint('🚀 Applying promo engine...');

      final orderAfterPromo = PromoEngine.apply(
        state!.copyWith(
          items: updatedItems,
          totalBeforeDiscount: totalBeforeDiscount,
        ),
        selectedPromos,
        now,
        findMenuItemById,
        allowStackingOnTotal: false,
      );

      debugPrint(
        '🎉 Applied promos: ${orderAfterPromo.appliedPromos?.length ?? 0}',
      );

      if (orderAfterPromo.appliedPromos != null) {
        for (final p in orderAfterPromo.appliedPromos!) {
          debugPrint(
            '  - ${p.promoName}: discount=${p.discount}, affected=${p.affectedItems.length}, free=${p.freeItems.length}',
          );
        }
      }

      // 8) Calculate discounts
      final autoDiscount = PromoEngine.sumAutoDiscount(
        orderAfterPromo.appliedPromos,
      );

      final existingDiscounts = state!.discounts ?? DiscountModel();
      final newDiscounts = existingDiscounts.copyWith(
        autoPromoDiscount: autoDiscount,
      );

      final manualDiscount = newDiscounts.manualDiscount;
      final voucherDiscount = newDiscounts.voucherDiscount;
      final totalDiscount = autoDiscount + manualDiscount + voucherDiscount;

      final totalAfterDiscount = (totalBeforeDiscount - totalDiscount).clamp(
        0,
        1 << 31,
      );

      debugPrint('🎁 Auto discount: $autoDiscount');
      debugPrint('💸 Total discount: $totalDiscount');

      // 9) Calculate tax & service
      int totalTax = 0;
      int totalServiceFee = 0;

      final isBazaarOrder = _isBazaarOrder(orderAfterPromo.items);

      if (totalAfterDiscount > 0 && !isBazaarOrder) {
        try {
          final result = await _taxAndServiceRepository.calculateOrderTotals(
            totalAfterDiscount,
          );
          totalTax = result.taxAmount;
          totalServiceFee = result.serviceAmount;
        } catch (e) {
          debugPrint('❌ Error calculating tax/service: $e');
        }
      }

      final grandTotal = totalAfterDiscount + totalTax + totalServiceFee;

      // 10) Update state once
      state = state!.copyWith(
        items: orderAfterPromo.items,
        appliedPromos: orderAfterPromo.appliedPromos,
        discounts: newDiscounts,
        totalBeforeDiscount: totalBeforeDiscount,
        totalAfterDiscount: totalAfterDiscount,
        totalTax: totalTax,
        totalServiceFee: totalServiceFee,
        grandTotal: grandTotal,
      );

      debugPrint('✅ Recalculation complete: grandTotal=$grandTotal');
    } catch (e, stackTrace) {
      debugPrint('❌ Error in recalculation: $e');
      debugPrint('Stack trace: $stackTrace');
    } finally {
      _isCalculating = false;
    }
  }

  void _printCalculationSummary() {
    debugPrint('═══════════════════════════════════════');
    debugPrint('CALCULATION SUMMARY');
    debugPrint('═══════════════════════════════════════');
    debugPrint('Selected promo IDs: ${state!.selectedPromoIds}');
    debugPrint(
      'Applied promos: ${(state!.appliedPromos ?? []).map((p) => '${p.promoName}(${p.promoId}) disc:${p.discount}').toList()}',
    );
    debugPrint('Before discount: ${state!.totalBeforeDiscount}');
    debugPrint('Auto discount: ${state!.discounts?.autoPromoDiscount ?? 0}');
    debugPrint('Manual discount: ${state!.discounts?.manualDiscount ?? 0}');
    debugPrint('Voucher discount: ${state!.discounts?.voucherDiscount ?? 0}');
    debugPrint('After discount: ${state!.totalAfterDiscount}');
    debugPrint('Tax: ${state!.totalTax}');
    debugPrint('Service: ${state!.totalServiceFee}');
    debugPrint('Grand total: ${state!.grandTotal}');
    debugPrint('═══════════════════════════════════════');
  }

  // ============================================================================
  // ORDER SUBMISSION
  // ============================================================================

  Future<bool> submitOrder() async {
    if (state == null) return false;

    try {
      final cashier = await HiveService.getCashier();
      state = state!.copyWith(cashier: cashier);

      // Ensure latest calculation
      await _recalculateAll();

      final payload = state!;
      final order = await OrderService().createOrder(payload);

      addOrderIdToOrderDetail(order['orderId']);
      addPaymentStatusToOrderDetail(order['paymentStatus'] ?? '');

      debugPrint('Order submitted successfully: ${order['orderId']}');
      return order.isNotEmpty;
    } catch (e) {
      debugPrint('Error submitting order: $e');
      rethrow;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  int _findExistingItemIndexExcept(
    OrderItemModel targetItem,
    int excludeIndex,
  ) {
    if (state == null) return -1;

    for (int i = 0; i < state!.items.length; i++) {
      if (i == excludeIndex) continue;

      final item = state!.items[i];
      if (item.menuItem.id == targetItem.menuItem.id &&
          _areToppingsEqual(
            item.selectedToppings,
            targetItem.selectedToppings,
          ) &&
          _areAddonsEqual(item.selectedAddons, targetItem.selectedAddons) &&
          item.notes == targetItem.notes) {
        return i;
      }
    }

    return -1;
  }

  bool _areToppingsEqual(List<ToppingModel> t1, List<ToppingModel> t2) {
    if (t1.length != t2.length) return false;
    final ids1 = t1.map((e) => e.id).toSet();
    final ids2 = t2.map((e) => e.id).toSet();
    return ids1.difference(ids2).isEmpty && ids2.difference(ids1).isEmpty;
  }

  bool _areAddonsEqual(List<AddonModel> a1, List<AddonModel> a2) {
    if (a1.length != a2.length) return false;
    for (var i = 0; i < a1.length; i++) {
      final ids1 = (a1[i].options ?? []).map((e) => e.id).toSet();
      final ids2 = (a2[i].options ?? []).map((e) => e.id).toSet();
      if (ids1.difference(ids2).isNotEmpty ||
          ids2.difference(ids1).isNotEmpty) {
        return false;
      }
    }
    return true;
  }

  List<AddonModel> _getDefaultAddons(MenuItemModel menu) {
    return (menu.addons ?? [])
        .map((addon) {
          final defaultOptions =
              (addon.options ?? []).where((o) => o.isDefault == true).toList();

          return AddonModel(
            id: addon.id,
            name: addon.name,
            type: addon.type,
            options: defaultOptions.isEmpty ? null : defaultOptions,
          );
        })
        .where((a) => (a.options ?? []).isNotEmpty)
        .toList();
  }

  bool _isBazaarOrder(List<OrderItemModel> items) {
    if (items.isEmpty) return false;
    return items.every((item) {
      final mainCategory = item.menuItem.mainCategory?.toLowerCase();
      return mainCategory == 'bazar';
    });
  }

  bool _isPromoValidNow(AutoPromoModel promo, DateTime now) {
    if (!promo.isActive) return false;

    final validFrom = promo.validFrom;
    final validTo = promo.validTo;
    return now.isAfter(validFrom) && now.isBefore(validTo);
  }

  bool _shouldAutoSelect(String promoType) {
    return promoType == 'product_specific' ||
        promoType == 'discount_on_quantity' ||
        promoType == 'discount_on_total';
  }

  bool _checkPromoEligibility(
    AutoPromoModel promo,
    OrderDetailModel order,
    DateTime now,
  ) {
    if (promo.activeHours.isEnabled) {
      if (!_isWithinActiveHours(promo.activeHours, now)) return false;
    }

    switch (promo.promoType) {
      case 'product_specific':
        final productIds = promo.conditions.products.map((p) => p.id).toSet();
        return order.items.any((item) => productIds.contains(item.menuItem.id));

      case 'bundling':
        for (final bundleItem in promo.conditions.bundleProducts) {
          final found = order.items.where(
            (item) => item.menuItem.id == bundleItem.product.id,
          );
          final totalQty = found.fold(0, (sum, item) => sum + item.quantity);
          if (totalQty < bundleItem.quantity) return false;
        }
        return promo.conditions.bundleProducts.isNotEmpty;

      case 'discount_on_quantity':
        final minQty = promo.conditions.minQuantity ?? 0;
        final totalQty = order.items.fold(
          0,
          (sum, item) => sum + item.quantity,
        );
        return totalQty >= minQty;

      case 'discount_on_total':
        final minTotal = promo.conditions.minTotal ?? 0;
        return order.totalBeforeDiscount >= minTotal;

      case 'buy_x_get_y':
        final buyProductId = promo.conditions.buyProduct?.id;
        if (buyProductId == null) return false;
        return order.items.any((item) => item.menuItem.id == buyProductId);

      default:
        return false;
    }
  }

  bool _isWithinActiveHours(ActiveHoursModel activeHours, DateTime now) {
    final currentDay = now.weekday % 7;
    final currentTime =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    for (final schedule in activeHours.schedule) {
      if (schedule.dayOfWeek == currentDay) {
        if (_isTimeBetween(currentTime, schedule.startTime, schedule.endTime)) {
          return true;
        }
      }
    }
    return false;
  }

  bool _isTimeBetween(String current, String start, String end) {
    return current.compareTo(start) >= 0 && current.compareTo(end) <= 0;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  int get subTotalPrice => state?.totalBeforeDiscount ?? 0;

  int get totalPaid =>
      (state?.payments ?? []).fold(0, (sum, p) => sum + p.amount);

  int get remaining =>
      state == null ? 0 : (state!.grandTotal - totalPaid).clamp(0, 1 << 31);

  bool get isFullyPaid => remaining == 0;
}

// Provider
final orderDetailProvider =
    StateNotifierProvider<OrderDetailNotifier, OrderDetailModel?>((ref) {
      return OrderDetailNotifier(ref);
    });
