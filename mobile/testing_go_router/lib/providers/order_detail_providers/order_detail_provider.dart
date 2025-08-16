import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/enums/payment_method.dart';
import 'package:kasirbaraja/extentions/order_item_extensions.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';
import 'package:collection/collection.dart';

class OrderDetailNotifier extends StateNotifier<OrderDetailModel?> {
  OrderDetailNotifier() : super(null);

  /// this method does nothing. Otherwise, it creates a ,new `OrderDetailModel`
  void initializeOrder({required OrderType orderType}) {
    print('memeriksa apakah order sudah ada...');
    if (state != null) return;
    print('Initialize order');
    state = OrderDetailModel(orderType: orderType, items: []);
  }

  //update total price

  void updateTotalPrice() {
    if (state != null) {
      print('Menghitung total harga...');
      final totalPrice =
          state!.totalAfterDiscount + state!.totalTax + state!.totalServiceFee;
      state = state!.copyWith(grandTotal: totalPrice);
    }
  }

  void updateSubTotalPrice() {
    if (state != null) {
      print('Menghitung total harga...');
      final totalBeforeDiscount = state!.items.fold(
        0,
        (sum, item) => sum + item.countSubTotalPrice(),
      );
      state = state!.copyWith(totalBeforeDiscount: totalBeforeDiscount);

      final totalAfterDiscount =
          totalBeforeDiscount -
          (state!.discounts != null ? state!.discounts!.totalDiscount : 0);
      state = state!.copyWith(totalAfterDiscount: totalAfterDiscount);
    }
  }

  // membuat tax
  void updateTax() {
    if (state != null) {
      print('Menghitung pajak...');
      final tax = state!.items.fold(
        0,
        (sum, item) => sum + (item.subtotal * 0.1).toInt(), // 10% tax
      );
      state = state!.copyWith(totalTax: tax);
      print('Tax: $tax');
    }
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
          payment: PaymentModel(method: paymentType, amount: state!.grandTotal),
        );
      }
      print(state);
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
    print('memeriksa apakah menu item sudah ada....');

    for (var item in state!.items) {
      print(
        'Comparing item id: ${item.menuItem.id} vs ${orderItem.menuItem.id}',
      );
      print(
        'Toppings equal: ${areToppingsEqual(item.selectedToppings, orderItem.selectedToppings)}',
      );
      print(
        'Addons equal: ${areAddonsEqual(item.selectedAddons, orderItem.selectedAddons)}',
      );
      print('Notes equal: ${areNotesEqual(item.notes, orderItem.notes)}');
    }

    // Menggunakan fungsi reusable
    // final existingOrderItemIndex = findExistingOrderItemIndex(orderItem);
    print('Mencari index item yang sama pada extension...');
    final existingOrderItemIndex = state!.items.findSimilarItemIndex(orderItem);

    if (existingOrderItemIndex != -1) {
      print('menu item sudah ada, mencoba menambahkan quantity...');
      // Jika menu item sudah ada, tambahkan quantity-nya
      final updatedItem = state!.items[existingOrderItemIndex].copyWith(
        quantity:
            state!.items[existingOrderItemIndex].quantity + orderItem.quantity,
      );
      final updatedItems = [...state!.items];
      updatedItems[existingOrderItemIndex] = updatedItem;
      state = state!.copyWith(items: updatedItems);
    } else {
      print('menu item belum ada, menambahkannya ke daftar...');
      print('data orderitem : $orderItem');
      //simpan orderItem ke dalam daftar pesanan
      state = state!.copyWith(items: [...state!.items, orderItem]);
    }

    //menghitung item sub total price
    state = state!.copyWith(
      items:
          state!.items
              .map((item) => item.copyWith(subtotal: item.countSubTotalPrice()))
              .toList(),
    );

    updateSubTotalPrice();
    updateTax();
    updateTotalPrice();
    print('Item order berhasil ditambahkan.');
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
      //menghitung item sub total price
      state = state!.copyWith(
        items:
            state!.items
                .map(
                  (item) => item.copyWith(subtotal: item.countSubTotalPrice()),
                )
                .toList(),
      );

      updateSubTotalPrice();
      updateTax();
      updateTotalPrice();
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
  Future<bool> submitOrder() async {
    final cashier = await HiveService.getCashier();
    //update cashier id di order detail model
    state = state!.copyWith(cashierId: cashier!.id);
    if (state == null) return false;
    print('Mengirim data orderDetail ke backend... ${state!.toJson()}');
    try {
      final order = await OrderService().createOrder(state!);
      print('Order ID : $order');
      if (order.isNotEmpty) {
        return true;
      }
    } catch (e) {
      print('error apa? $e');
      return false;
    }
    return false; // Return false if state is null
  }
}

// Provider untuk OrderDetailNotifier
final orderDetailProvider =
    StateNotifierProvider<OrderDetailNotifier, OrderDetailModel?>((ref) {
      return OrderDetailNotifier();
    });
