import 'package:flutter/cupertino.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/extentions/order_item_extensions.dart';
import 'package:kasirbaraja/features/promos/promo_engine.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/promo_group.model.dart';
import 'package:kasirbaraja/providers/menu_item_provider.dart';
import 'package:kasirbaraja/providers/promotion_providers/auto_promo_provider.dart';
import 'package:kasirbaraja/repositories/menu_item_repository.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/repositories/tax_and_service_repository.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
//menu item model
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:collection/collection.dart';
import 'package:uuid/uuid.dart';

class OrderDetailNotifier extends StateNotifier<OrderDetailModel?> {
  OrderDetailNotifier(this.ref) : super(null);

  final TaxAndServiceRepository _taxAndServiceRepository =
      TaxAndServiceRepository();
  final Ref ref;

  bool _isCalculating = false;

  /// this method does nothing. Otherwise, it creates a ,new `OrderDetailModel`
  void initializeOrder({required OrderType orderType}) {
    print('memeriksa apakah order sudah ada...');
    if (state != null) return;
    print('Initialize order');
    state = OrderDetailModel(orderType: orderType, items: []);
  }

  void addOrderFromSavedOrderDetail(OrderDetailModel orderDetail) {
    clearOrder();
    state = orderDetail;
  }

  // Set order type (dine-in, take away, delivery)
  void updateOrderType(OrderType orderType) {
    if (state != null) {
      state = state!.copyWith(orderType: orderType);
      print('Order Type: $orderType');
    }
  }

  // Set payment method
  void updatePaymentMethod(String paymentMethod, String? paymentType) {
    print('Payment Method: $paymentMethod');
    if (state != null) {
      state = state!.copyWith(paymentMethod: paymentMethod);
      if (paymentType != null) {
        state = state!.copyWith(
          payments: [
            PaymentModel(method: paymentType, amount: state!.grandTotal),
          ],
        );
      }
      print(state);
    }
  }

  //update paymentType
  void updatePaymentType(String paymentType) {
    if (state != null) {
      state = state!.copyWith(paymentType: paymentType);
    }
  }

  void updatePayment(OrderDetailModel updatedOrder) {
    state = updatedOrder;
  }

  void updateIsOpenBill(bool isOpenBill) {
    if (state != null) {
      state = state!.copyWith(isOpenBill: isOpenBill);
    }
  }

  // Set customer name, phone number, dan table number
  void updateCustomerDetails({
    String? customerName,
    String? phoneNumber,
    String? tableNumber,
  }) {
    if (state != null) {
      state = state!.copyWith(
        user: customerName ?? state!.user,
        // phoneNumber: phoneNumber ?? state!.phoneNumber,
        tableNumber: tableNumber ?? state!.tableNumber,
      );
    }
  }

  /// Fungsi reusable untuk mencari index item yang sama
  /// berdasarkan menuItem id, toppings, addons, dan notes
  int findExistingOrderItemIndex(OrderItemModel targetItem) {
    if (state == null) return -1;

    return state!.items.indexWhere(
      (item) =>
          item.menuItem.id == targetItem.menuItem.id &&
          areToppingsEqual(
            item.selectedToppings,
            targetItem.selectedToppings,
          ) &&
          areAddonsEqual(item.selectedAddons, targetItem.selectedAddons) &&
          areNotesEqual(item.notes, targetItem.notes),
    );
  }

  /// Fungsi reusable untuk mencari index item yang sama
  /// tetapi mengecualikan index tertentu (berguna untuk edit)
  int findExistingOrderItemIndexExcept(
    OrderItemModel targetItem,
    int excludeIndex,
  ) {
    if (state == null) return -1;

    for (int i = 0; i < state!.items.length; i++) {
      if (i == excludeIndex) continue; // skip index yang dikecualikan

      final item = state!.items[i];
      if (item.menuItem.id == targetItem.menuItem.id &&
          areToppingsEqual(
            item.selectedToppings,
            targetItem.selectedToppings,
          ) &&
          areAddonsEqual(item.selectedAddons, targetItem.selectedAddons) &&
          areNotesEqual(item.notes, targetItem.notes)) {
        return i;
      }
    }

    return -1;
  }

  // Tambahkan menu ke daftar pesanan
  void addItemToOrder(OrderItemModel orderItem) {
    // Menggunakan fungsi reusable
    // final existingOrderItemIndex = findExistingOrderItemIndex(orderItem);
    final existingOrderItemIndex = state!.items.findSimilarItemIndex(orderItem);

    if (existingOrderItemIndex != -1) {
      // Jika menu item sudah ada, tambahkan quantity-nya
      final updatedItem = state!.items[existingOrderItemIndex].copyWith(
        quantity:
            state!.items[existingOrderItemIndex].quantity + orderItem.quantity,
      );
      final updatedItems = [...state!.items];
      updatedItems[existingOrderItemIndex] = updatedItem;
      state = state!.copyWith(items: updatedItems);
    } else {
      //simpan orderItem ke dalam daftar pesanan
      state = state!.copyWith(items: [...state!.items, orderItem]);
    }

    _recalculateAll();
    print('Item order berhasil ditambahkan.');
  }

  Future<void> applyPromoGroup(WidgetRef ref, PromoGroupModel group) async {
    final notifier = ref.read(orderDetailProvider.notifier);

    var order = ref.read(orderDetailProvider);
    if (order == null) {
      notifier.initializeOrder(orderType: OrderType.dineIn);
      order = ref.read(orderDetailProvider);
    }
    if (order == null) return;

    // Ambil menu
    final menus = await ref.read(menuItemRepository).getLocalMenuItems();
    MenuItemModel? findMenu(String id) =>
        menus.firstWhereOrNull((m) => m.id == id);

    final items = <OrderItemModel>[];

    for (final line in group.lines) {
      final menu = findMenu(line.menuItemId);
      if (menu == null) continue;

      final selectedAddons =
          (menu.addons ?? [])
              .map((addon) {
                final defaultOptions =
                    (addon.options ?? [])
                        .where((o) => o.isDefault == true)
                        .toList();

                return AddonModel(
                  id: addon.id,
                  name: addon.name,
                  type: addon.type,
                  options: defaultOptions.isEmpty ? null : defaultOptions,
                );
              })
              .where((a) => (a.options ?? []).isNotEmpty)
              .toList();

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

    // ✅ batch update: promo dipilih + item masuk, lalu recalc sekali
    notifier.selectAutoPromo(group.promoId);

    if (items.isNotEmpty) {
      notifier.addItemsToOrder(items); // ini akan trigger _recalculateAll()
    } else {
      // kalau tidak ada items, baru recalc manual (opsional)
      notifier._recalculateAll();
    }
  }

  void selectAutoPromo(String promoId) {
    if (state == null) return;

    final cur = state!.selectedPromoIds;
    if (cur.contains(promoId)) return;

    state = state!.copyWith(selectedPromoIds: [...cur, promoId]);
    // _recalculateAll();
  }

  // helper merge mirip addItemsToOrder tapi "silent"
  List<OrderItemModel> _mergeItems(
    List<OrderItemModel> base,
    List<OrderItemModel> add,
  ) {
    final updated = [...base];

    for (final orderItem in add) {
      final idx = updated.findSimilarItemIndex(orderItem);
      if (idx != -1) {
        updated[idx] = updated[idx].copyWith(
          quantity: updated[idx].quantity + orderItem.quantity,
        );
      } else {
        updated.add(orderItem);
      }
    }

    return updated;
  }

  void addItemsToOrder(List<OrderItemModel> items) {
    print('Menambahkan beberapa item ke order...${items.length}');
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

  static const listEquality = DeepCollectionEquality.unordered();

  bool areToppingsEqual(
    List<ToppingModel> toppings1,
    List<ToppingModel> toppings2,
  ) {
    return listEquality.equals(
      toppings1.map((e) => e.id).toList(),
      toppings2.map((e) => e.id).toList(),
    );
  }

  bool areAddonsEqual(List<AddonModel> addons1, List<AddonModel> addons2) {
    if (addons1.length != addons2.length) return false;

    for (var i = 0; i < addons1.length; i++) {
      final ids1 = addons1[i].options!.map((e) => e.id).toList()..sort();
      final ids2 = addons2[i].options!.map((e) => e.id).toList()..sort();

      if (!listEquality.equals(ids1, ids2)) return false;
    }

    return true;
  }

  // apakah note pada order item sama
  bool areNotesEqual(String? note1, String? note2) {
    return note1 == note2;
  }

  void removeItem(OrderItemModel menuItem) {
    final index = state!.items.indexOf(menuItem);

    if (index != -1) {
      final updatedItems = [...state!.items]; // clone list
      updatedItems.removeAt(index);

      state = state!.copyWith(items: updatedItems);

      print('Item order berhasil dihapus.');
    } else {
      print('Item tidak ditemukan, tidak ada yang dihapus.');
    }

    _recalculateAll();
  }

  void updateItemQuantity(String menuItemId, int quantity) {
    if (state != null) {
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
  }

  void editOrderItem(OrderItemModel oldOrderItem, OrderItemModel newOrderItem) {
    print('mengubah item order...');
    final indexOldItem = state!.items.indexOf(oldOrderItem);

    if (indexOldItem != -1) {
      print('item order ditemukan, mengganti item...');

      // Menggunakan fungsi reusable dengan pengecualian index lama
      final existingOrderItemIndex = findExistingOrderItemIndexExcept(
        newOrderItem,
        indexOldItem,
      );

      final updatedItems = [...state!.items]; // buat salinan

      if (existingOrderItemIndex != -1) {
        print('item order ada yang sama, menambahkan quantity...');

        final updatedItem = updatedItems[existingOrderItemIndex].copyWith(
          quantity:
              updatedItems[existingOrderItemIndex].quantity +
              newOrderItem.quantity,
        );

        updatedItems[existingOrderItemIndex] = updatedItem;
        updatedItems.removeAt(indexOldItem); // hapus item lama
      } else {
        print('tidak ada item yang sama, mengganti item...');
        updatedItems[indexOldItem] = newOrderItem;
      }

      state = state!.copyWith(items: updatedItems);
      _recalculateAll();
      print('Item order berhasil diubah.');
    }
  }

  // Kosongkan daftar pesanan
  void clearOrder() {
    state = null;
  }

  // Hitung total harga dari daftar pesanan
  int get subTotalPrice {
    if (state != null) {
      return state!.items.fold(0, (sum, item) => sum + item.subtotal);
    } else {
      return 0;
    }
  }

  // Future<void> submitOrder(WidgetRef ref) async {
  //   final current = state;
  //   if (current == null) {
  //     throw Exception('Order kosong');
  //   }

  //   final cashier = await HiveService.getCashier();
  //   state = current.copyWith(cashier: cashier);

  //   try {
  //     final order = await OrderService().createOrder(state!);

  //     final orderId = order['orderId']?.toString();
  //     final paymentStatus = order['paymentStatus']?.toString() ?? '';

  //     if (orderId == null || orderId.isEmpty) {
  //       throw Exception('OrderId tidak valid dari server');
  //     }

  //     // Update local state dengan hasil dari backend
  //     addOrderIdToOrderDetail(orderId);
  //     addPaymentStatusToOrderDetail(paymentStatus);

  //     // Kalau perlu: update status order jadi "OPEN_BILL" dll
  //     // state = state!.copyWith(status: OrderStatus.openBill);
  //   } catch (e) {
  //     debugPrint('submitOrder error: $e');
  //     rethrow;
  //   }
  // }

  // TODO: boleh dihapus jika fungsi sama bisa
  // Kirim data orderDetail atau openbill ke backend
  Future<bool> submitOrder(WidgetRef ref) async {
    if (state == null) return false;

    final cashier = await HiveService.getCashier();
    state = state!.copyWith(cashier: cashier);

    // pastikan total/promo terbaru sudah dihitung
    await _recalculateAll();

    // ambil snapshot yang akan dikirim
    final payload = state!;

    try {
      final order = await OrderService().createOrder(payload);
      // print('Order submitted: $order');

      final orderDetails = ref.read(orderDetailProvider.notifier);
      orderDetails.addOrderIdToOrderDetail(order['orderId']);
      orderDetails.addPaymentStatusToOrderDetail(order['paymentStatus'] ?? '');

      if (order.isNotEmpty) {
        //update menu items
        return true;
      }
    } catch (e) {
      debugPrint('error apa? $e');
      // return false;
      rethrow;
    }
    return false; // Return false if state is null
  }

  Future<void> _recalculateAll() async {
    if (state == null || _isCalculating) return;
    _isCalculating = true;

    try {
      // 1) Update subtotal item
      final updatedItems =
          state!.items
              .map((it) => it.copyWith(subtotal: it.countSubTotalPrice()))
              .toList();

      // 2) Total items
      final totalFromItems = updatedItems.fold<int>(
        0,
        (s, it) => s + it.subtotal,
      );

      // 3) Total custom amounts
      final totalFromCustomAmounts = (state!.customAmountItems ?? []).fold<int>(
        0,
        (s, it) => s + (it.amount ?? 0),
      );

      // 4) Total before discount
      final totalBeforeDiscount = totalFromItems + totalFromCustomAmounts;

      // 4b) ambil promo yang dipilih (selectedPromoIds)
      final allPromos =
          await ref.read(autoPromoRepository).getLocalAutoPromos();
      final selectedIds = state!.selectedPromoIds;

      final selectedPromos =
          allPromos.where((p) => selectedIds.contains(p.id)).toList();

      // menu items (buat buy_x_get_y cari nama)
      final menuItems = await ref.read(menuItemRepository).getLocalMenuItems();
      MenuItemModel? findMenuItemById(String id) =>
          menuItems.firstWhereOrNull((m) => m.id == id);

      final now = DateTime.now();

      // ✅ apply engine
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

      // ✅ auto discount dari appliedPromos.discount
      final autoDiscount = PromoEngine.sumAutoDiscount(
        orderAfterPromo.appliedPromos,
      );

      // ✅ simpan ke DiscountModel (single source of truth)
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

      // 6) tax & service
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
          debugPrint('Error calculating tax/service: $e');
        }
      }

      final grandTotal = totalAfterDiscount + totalTax + totalServiceFee;

      // 8) update state (sekali)
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

      // --- DEBUG LOG (biar kamu ga nebak-nebak lagi) ---
      debugPrint('Calculation completed:');
      debugPrint('- Selected promo ids: ${state!.selectedPromoIds}');
      debugPrint(
        '- Applied promos: ${(state!.appliedPromos ?? []).map((p) => '${p.promoName}(${p.promoId}) disc:${p.discount}').toList()}',
      );
      debugPrint('- Before discount: $totalBeforeDiscount');
      debugPrint('- Auto discount: $autoDiscount');
      debugPrint('- Manual discount: $manualDiscount');
      debugPrint('- Voucher discount: $voucherDiscount');
      debugPrint('- Total discount: $totalDiscount');
      debugPrint('- After discount: $totalAfterDiscount');
      debugPrint('- Tax: $totalTax');
      debugPrint('- Service: $totalServiceFee');
      debugPrint('- Grand total: $grandTotal');
    } catch (e) {
      debugPrint('Error in recalculation: $e');
    } finally {
      _isCalculating = false;
    }
  }

  // Future<void> _recalculateAll() async {
  //   if (state == null || _isCalculating) return;

  //   _isCalculating = true;

  //   try {
  //     // 1. Update subtotal setiap item
  //     final updatedItems =
  //         state!.items
  //             .map((item) => item.copyWith(subtotal: item.countSubTotalPrice()))
  //             .toList();

  //     // 2. Hitung total from order items
  //     final totalFromItems = updatedItems.fold(
  //       0,
  //       (sum, item) => sum + item.subtotal,
  //     );

  //     // 3. Hitung total from custom amounts
  //     final totalFromCustomAmounts = (state!.customAmountItems ?? []).fold(
  //       0,
  //       (sum, item) => sum + (item.amount ?? 0),
  //     );

  //     // 4. Total before discount = items + custom amounts
  //     final totalBeforeDiscount = totalFromItems + totalFromCustomAmounts;

  //     // 5. Hitung total after discount
  //     final discountAmount = state!.discounts?.totalDiscount ?? 0;
  //     final totalAfterDiscount = totalBeforeDiscount - discountAmount;

  //     // 6. Hitung tax dan service (jika ada outlet ID)
  //     int totalTax = 0;
  //     int totalServiceFee = 0;

  //     if (totalAfterDiscount > 0) {
  //       try {
  //         final result = await _taxAndServiceRepository.calculateOrderTotals(
  //           totalAfterDiscount,
  //         );
  //         totalTax = result.taxAmount;
  //         totalServiceFee = result.serviceAmount;
  //       } catch (e) {
  //         print('Error calculating tax and service: $e');
  //       }
  //     }

  //     // 7. Hitung grand total
  //     final grandTotal = totalAfterDiscount + totalTax + totalServiceFee;

  //     // 8. Update state sekali saja
  //     state = state!.copyWith(
  //       items: updatedItems,
  //       totalBeforeDiscount: totalBeforeDiscount,
  //       totalAfterDiscount: totalAfterDiscount,
  //       totalTax: totalTax,
  //       totalServiceFee: totalServiceFee,
  //       grandTotal: grandTotal,
  //     );

  //     print('Calculation completed:');
  //     print('- Total from items: $totalFromItems');
  //     print('- Total from custom amounts: $totalFromCustomAmounts');
  //     print('- Before discount: $totalBeforeDiscount');
  //     print('- After discount: $totalAfterDiscount');
  //     print('- Tax: $totalTax');
  //     print('- Service: $totalServiceFee');
  //     print('- Grand total: $grandTotal');
  //   } catch (e) {
  //     print('Error in recalculation: $e');
  //   } finally {
  //     _isCalculating = false;
  //   }
  // }

  //add orderId to orderDetail
  void addOrderIdToOrderDetail(String orderId) {
    if (state != null) {
      state = state!.copyWith(orderId: orderId);
      print('success add Order ID: $orderId');
    }
  }

  void addPaymentStatusToOrderDetail(String paymentStatus) {
    if (state != null) {
      state = state!.copyWith(paymentStatus: paymentStatus);
      print('success add Payment Status: $paymentStatus');
    }
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

  // Future<void> updateOrderId() async {
  //   final orderId = await generateOrderId(tableNumber: state?.tableNumber);
  //   print('sedang update Order ID: $orderId');
  //   print('state: $state');
  //   if (state != null) {
  //     state = state!.copyWith(orderId: orderId);
  //     print('success update Order ID: ${state?.orderId}');
  //   }
  // }

  void updateOrderId() {
    if (state != null) {
      //isis orderid menggunakan UUID
      state = state!.copyWith(orderId: Uuid().v1());
    }
  }

  // Method untuk menambahkan custom amount
  void addCustomAmountItem(CustomAmountItemsModel customAmountItem) {
    if (state == null) return;

    final currentCustomAmounts = state!.customAmountItems ?? [];
    final updatedCustomAmounts = [...currentCustomAmounts, customAmountItem];

    state = state!.copyWith(customAmountItems: updatedCustomAmounts);

    // Recalculate totals karena ada tambahan custom amount
    _recalculateAll();

    print('Custom amount berhasil ditambahkan: ${customAmountItem.name}');
  }

  // Method untuk menghapus custom amount
  void removeCustomAmountItem(CustomAmountItemsModel customAmountItem) {
    if (state == null) return;

    final currentCustomAmounts = state!.customAmountItems ?? [];
    final updatedCustomAmounts =
        currentCustomAmounts.where((item) => item != customAmountItem).toList();

    state = state!.copyWith(customAmountItems: updatedCustomAmounts);

    _recalculateAll();

    print('Custom amount berhasil dihapus');
  }

  bool _isBazaarOrder(List<OrderItemModel> items) {
    if (items.isEmpty) return false;

    return items.every((item) {
      // ✏️ SESUAIKAN FIELD INI dengan punya kamu:
      // misal: item.menuItem.categoryName, item.menuItem.mainCategory, dll.
      // final category = item.menuItem.category?.toLowerCase();
      final mainCategory = item.menuItem.mainCategory?.toLowerCase();

      return mainCategory == 'bazar';
    });
  }

  void setPayments(List<PaymentModel> payments) {
    if (state == null) return;
    state = state!.copyWith(payments: payments);
  }

  void addPayment(PaymentModel payment) {
    if (state == null) return;
    final current = state!.payments;
    state = state!.copyWith(payments: [...current, payment]);
  }

  int get totalPaid =>
      (state?.payments ?? []).fold(0, (sum, p) => sum + p.amount);

  int get remaining =>
      state == null ? 0 : (state!.grandTotal - totalPaid).clamp(0, 1 << 31);

  bool get isFullyPaid => remaining == 0;

  int _autoPromoDiscount(OrderDetailModel? s) {
    if (s == null) return 0;
    final promos = s.appliedPromos ?? [];
    return promos.fold(0, (sum, p) {
      final affected = p.affectedItems.fold(
        0,
        (a, it) => a + it.discountAmount,
      );
      return sum + affected;
    });
  }

  int _manualDiscount(OrderDetailModel? s) => s?.discounts?.totalDiscount ?? 0;

  int totalDiscount(OrderDetailModel? s) =>
      _manualDiscount(s) + _autoPromoDiscount(s);
}

// Provider untuk OrderDetailNotifier
final orderDetailProvider =
    StateNotifierProvider<OrderDetailNotifier, OrderDetailModel?>((ref) {
      return OrderDetailNotifier(ref);
    });
