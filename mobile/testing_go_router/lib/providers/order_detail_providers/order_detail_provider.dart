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
  void initializeOrder({required String orderType}) {
    print('memeriksa apakah order sudah ada...');
    if (state != null) return;
    print('Initialize order');
    state = OrderDetailModel(orderType: orderType, items: []);
  }

  //update total price

  void updateTotalPrice() {
    if (state != null) {
      print('Menghitung total harga...');
      final totalPrice = state!.subTotalPrice! + (state!.tax ?? 0);
      state = state!.copyWith(totalPrice: totalPrice);
    }
  }

  void updateSubTotalPrice() {
    if (state != null) {
      print('Menghitung total harga...');
      final subTotalPrice = state!.items.fold(
        0.0,
        (sum, item) => sum + item.calculateSubTotalPrice(),
      );
      state = state!.copyWith(subTotalPrice: subTotalPrice);
    }
  }

  // membuat tax
  void updateTax() {
    if (state != null) {
      print('Menghitung pajak...');
      final tax = state!.items.fold(
        0.0,
        (sum, item) => sum + item.calculateSubTotalPrice() * 0.1, // 10% tax
      );
      state = state!.copyWith(tax: tax);
      print('Tax: $tax');
    }
  }

  void addOrderFromSavedOrderDetail(OrderDetailModel orderDetail) {
    clearOrder();
    state = orderDetail;
  }

  // Set order type (dine-in, take away, delivery)
  void updateOrderType(String orderType) {
    if (state != null) {
      state = state!.copyWith(orderType: orderType);
      print('Order Type: $orderType');
    }
  }

  // Set payment method
  void updatePaymentMethod(String paymentMethod) {
    print('Payment Method: $paymentMethod');
    if (state != null) {
      state = state!.copyWith(paymentMethod: paymentMethod);
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
        customerName: customerName ?? state!.customerName,
        phoneNumber: phoneNumber ?? state!.phoneNumber,
        tableNumber: tableNumber ?? state!.tableNumber,
      );
    }
  }

  // Tambahkan menu ke daftar pesanan
  void addItemToOrder(OrderItemModel orderItem) {
    print('memeriksa apakah menu item sudah ada....');
    // const existingOrderItemIndex = -1;
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
    }
    final existingOrderItemIndex = state!.items.indexWhere(
      (item) =>
          item.menuItem.id == orderItem.menuItem.id &&
          areToppingsEqual(item.selectedToppings, orderItem.selectedToppings) &&
          areAddonsEqual(item.selectedAddons, orderItem.selectedAddons),
    ); //letak errornya disiini
    // print('mendapatkan index: $existingOrderItemIndex');
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
    // final addons1Ids = addons1.map((addon) => addon.options.first.id).toList();
    // final addons2Ids = addons2.map((addon) => addon.options.first.id).toList();
    // // print('addons1Ids: $addons1Ids');
    // // print('addons2Ids: $addons2Ids');
    // return listEquality.equals(
    //   addons1Ids,
    //   addons2Ids,
    // );
    if (addons1.length != addons2.length) return false;

    for (var i = 0; i < addons1.length; i++) {
      // final ids1 = addons1[i].options.map((e) => e.id).toList();
      // final ids2 = addons2[i].options.map((e) => e.id).toList();
      final ids1 = addons1[i].options!.map((e) => e.id).toList()..sort();
      final ids2 = addons2[i].options!.map((e) => e.id).toList()..sort();

      if (!listEquality.equals(ids1, ids2)) return false;
    }

    return true;
  }

  // bool _areToppingsEqual(
  //     List<ToppingModel> toppings1, List<ToppingModel> toppings2) {
  //   if (toppings1.length != toppings2.length) return false;
  //   for (var i = 0; i < toppings1.length; i++) {
  //     if (toppings1[i].id != toppings2[i].id) return false;
  //   }
  //   return true;
  // }

  // bool _areAddonsEqual(List<AddonModel> addons1, List<AddonModel> addons2) {
  //   if (addons1.length != addons2.length) return false;
  //   for (var i = 0; i < addons1.length; i++) {
  //     if (addons1[i].options.first.id != addons2[i].options.first.id) {
  //       return false;
  //     }
  //   }
  //   return true;
  // }

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

      final existingOrderItemIndex = state!.items.indexWhere(
        (item) =>
            item.menuItem.id == newOrderItem.menuItem.id &&
            areToppingsEqual(
              item.selectedToppings,
              newOrderItem.selectedToppings,
            ) &&
            areAddonsEqual(item.selectedAddons, newOrderItem.selectedAddons),
      );

      final updatedItems = [...state!.items]; // buat salinan

      if (existingOrderItemIndex != -1 &&
          existingOrderItemIndex != indexOldItem) {
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
    }
  }

  // Kosongkan daftar pesanan
  void clearOrder() {
    state = null;
  }

  // Hitung total harga dari daftar pesanan
  int get subTotalPrice {
    if (state != null) {
      return state!.items.fold(
        0,
        (sum, item) => sum + item.calculateSubTotalPrice(),
      );
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
    print('Mengirim data orderDetail ke backend...');
    try {
      final order = await OrderService().createOrder(state!);
      print('Order ID: $order');
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
