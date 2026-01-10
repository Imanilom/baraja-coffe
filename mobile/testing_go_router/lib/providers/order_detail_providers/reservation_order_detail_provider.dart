import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
// import 'package:barajapos/models/menu_item_model.dart';
import 'package:collection/collection.dart';

class ReservationOrderDetailProvider extends StateNotifier<OrderDetailModel?> {
  ReservationOrderDetailProvider() : super(null);

  /// this method does nothing. Otherwise, it creates a ,new `OrderDetailModel`
  void initializeOrder({required OrderType orderType}) {
    AppLogger.debug('memeriksa apakah order sudah ada...');
    if (state != null) return;
    AppLogger.debug('Initialize order');
    state = OrderDetailModel(orderType: orderType, items: []);
  }

  //update total price
  void updateTotalPrice() {
    if (state != null) {
      AppLogger.debug('Menghitung total harga...');
      final totalPrice =
          state!.totalAfterDiscount + state!.totalTax + state!.totalServiceFee;
      state = state!.copyWith(grandTotal: totalPrice);
    }
  }

  void updateSubTotalPrice() {
    if (state != null) {
      AppLogger.debug('Menghitung total harga...');
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
      AppLogger.debug('Menghitung pajak...');
      final tax = state!.items.fold(
        0,
        (sum, item) => sum + (item.subtotal * 0.1).toInt(), // 10% tax
      );
      state = state!.copyWith(totalTax: tax);
      AppLogger.debug('Tax: $tax');
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
      AppLogger.debug('Order Type: $orderType');
    }
  }

  // Set payment method
  void updatePaymentMethod(String paymentMethod, String? paymentType) {
    AppLogger.debug('Payment Method: $paymentMethod');
    if (state != null) {
      state = state!.copyWith(paymentMethod: paymentMethod);
      if (paymentType != null) {
        state = state!.copyWith(
          payments: [
            PaymentModel(method: paymentType, amount: state!.grandTotal),
          ],
        );
      }
      AppLogger.debug(state);
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

  // Tambahkan menu ke daftar pesanan
  void addItemToOrder(OrderItemModel orderItem) {
    AppLogger.debug('memeriksa apakah menu item sudah ada....');
    // const existingOrderItemIndex = -1;
    for (var item in state!.items) {
      AppLogger.debug(
        'Comparing item id: ${item.menuItem.id} vs ${orderItem.menuItem.id}',
      );
      AppLogger.debug(
        'Toppings equal: ${areToppingsEqual(item.selectedToppings, orderItem.selectedToppings)}',
      );
      AppLogger.debug(
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
      AppLogger.debug('menu item sudah ada, mencoba menambahkan quantity...');
      // Jika menu item sudah ada, tambahkan quantity-nya
      final updatedItem = state!.items[existingOrderItemIndex].copyWith(
        quantity:
            state!.items[existingOrderItemIndex].quantity + orderItem.quantity,
      );
      final updatedItems = [...state!.items];
      updatedItems[existingOrderItemIndex] = updatedItem;
      state = state!.copyWith(items: updatedItems);
    } else {
      AppLogger.debug('menu item belum ada, menambahkannya ke daftar...');
      AppLogger.debug('data orderitem : $orderItem');
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
    AppLogger.info('Item order berhasil ditambahkan.');
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

  void removeItem(OrderItemModel menuItem) {
    final index = state!.items.indexOf(menuItem);

    if (index != -1) {
      final updatedItems = [...state!.items]; // clone list
      updatedItems.removeAt(index);

      state = state!.copyWith(items: updatedItems);

      AppLogger.info('Item order berhasil dihapus.');
    } else {
      AppLogger.warning('Item tidak ditemukan, tidak ada yang dihapus.');
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
    AppLogger.debug('mengubah item order...');
    final indexOldItem = state!.items.indexOf(oldOrderItem);

    if (indexOldItem != -1) {
      AppLogger.debug('item order ditemukan, mengganti item...');

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
        AppLogger.debug('item order ada yang sama, menambahkan quantity...');

        final updatedItem = updatedItems[existingOrderItemIndex].copyWith(
          quantity:
              updatedItems[existingOrderItemIndex].quantity +
              newOrderItem.quantity,
        );

        updatedItems[existingOrderItemIndex] = updatedItem;
        updatedItems.removeAt(indexOldItem); // hapus item lama
      } else {
        AppLogger.debug('tidak ada item yang sama, mengganti item...');
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
      return state!.items.fold(0, (sum, item) => sum + item.subtotal);
    } else {
      return 0;
    }
  }

  // Kirim data orderDetail ke backend
  // Future<bool> submitOrder() async {
  //   final cashier = await HiveService.getCashier();
  //   //update cashier id di order detail model
  //   state = state!.copyWith(cashierId: cashier!.id);
  //   if (state == null) return false;
  //   print('Mengirim data orderDetail ke backend... ${state!.toJson()}');
  //   try {
  //     final order = await OrderService().createOrder(state!);
  //     print('Order ID : $order');
  //     if (order.isNotEmpty) {
  //       return true;
  //     }
  //   } catch (e) {
  //     print('error apa? $e');
  //     return false;
  //   }
  //   return false; // Return false if state is null
  // }
}

// Provider untuk ReservationOrderDetailProvider
final reservationOrderDetailProvider =
    StateNotifierProvider<ReservationOrderDetailProvider, OrderDetailModel?>((
      ref,
    ) {
      return ReservationOrderDetailProvider();
    });
