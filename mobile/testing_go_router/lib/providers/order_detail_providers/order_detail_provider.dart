import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/extentions/order_item_extensions.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/repositories/tax_and_service_repository.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';
import 'package:collection/collection.dart';
import 'package:uuid/uuid.dart';

class OrderDetailNotifier extends StateNotifier<OrderDetailModel?> {
  OrderDetailNotifier() : super(null);

  final TaxAndServiceRepository _taxAndServiceRepository =
      TaxAndServiceRepository();

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

  // Kirim data orderDetail ke backend
  Future<bool> submitOrder(PaymentState paymentData, WidgetRef ref) async {
    final cashier = await HiveService.getCashier();

    state = state!.copyWith(cashier: cashier);
    print('statedtdt: $state');
    if (state == null) return false;

    try {
      final order = await OrderService().createOrder(state!, paymentData);
      print('Order submitted: $order');

      final orderDetails = ref.read(orderDetailProvider.notifier);
      orderDetails.addOrderIdToOrderDetail(order['orderId']);
      orderDetails.addPaymentStatusToOrderDetail(order['paymentStatus'] ?? '');

      if (order.isNotEmpty) {
        //update menu items
        return true;
      }
    } catch (e) {
      print('error apa? $e');
      return false;
    }
    return false; // Return false if state is null
  }

  Future<void> _recalculateAll() async {
    if (state == null || _isCalculating) return;

    _isCalculating = true;

    try {
      // 1. Update subtotal setiap item
      final updatedItems =
          state!.items
              .map((item) => item.copyWith(subtotal: item.countSubTotalPrice()))
              .toList();

      // 2. Hitung total dari order items
      final totalFromItems = updatedItems.fold<int>(
        0,
        (sum, item) => sum + item.subtotal,
      );

      // 3. Hitung total dari custom amounts
      final totalFromCustomAmounts = (state!.customAmountItems ?? []).fold<int>(
        0,
        (sum, item) => sum + (item.amount ?? 0),
      );

      // 4. Total sebelum diskon = items + custom amounts
      final totalBeforeDiscount = totalFromItems + totalFromCustomAmounts;

      // 5. Hitung total setelah diskon
      final discountAmount = state!.discounts?.totalDiscount ?? 0;
      final totalAfterDiscount = totalBeforeDiscount - discountAmount;

      // 6. Hitung tax dan service
      int totalTax = 0;
      int totalServiceFee = 0;

      // 🔹 Cek dulu: apakah order ini full kategori BAZAR?
      final isBazaarOrder = _isBazaarOrder(updatedItems);

      if (totalAfterDiscount > 0 && !isBazaarOrder) {
        // 💰 Mode normal → tetap hitung tax & service
        try {
          final result = await _taxAndServiceRepository.calculateOrderTotals(
            totalAfterDiscount,
          );
          totalTax = result.taxAmount;
          totalServiceFee = result.serviceAmount;
        } catch (e) {
          print('Error calculating tax and service: $e');
        }
      } else {
        // 🧾 Mode BAZAR → tanpa tax & service
        totalTax = 0;
        totalServiceFee = 0;
        if (isBazaarOrder) {
          print('Order ini kategori BAZAR → TANPA tax & service');
        }
      }

      // 7. Hitung grand total
      final grandTotal = totalAfterDiscount + totalTax + totalServiceFee;

      // 8. Update state sekali saja
      state = state!.copyWith(
        items: updatedItems,
        totalBeforeDiscount: totalBeforeDiscount,
        totalAfterDiscount: totalAfterDiscount,
        totalTax: totalTax,
        totalServiceFee: totalServiceFee,
        grandTotal: grandTotal,
      );

      print('Calculation completed:');
      print('- Total from items: $totalFromItems');
      print('- Total from custom amounts: $totalFromCustomAmounts');
      print('- Before discount: $totalBeforeDiscount');
      print('- After discount: $totalAfterDiscount');
      print('- Is bazaar order: $isBazaarOrder');
      print('- Tax: $totalTax');
      print('- Service: $totalServiceFee');
      print('- Grand total: $grandTotal');
    } catch (e) {
      print('Error in recalculation: $e');
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
}

// Provider untuk OrderDetailNotifier
final orderDetailProvider =
    StateNotifierProvider<OrderDetailNotifier, OrderDetailModel?>((ref) {
      return OrderDetailNotifier();
    });
