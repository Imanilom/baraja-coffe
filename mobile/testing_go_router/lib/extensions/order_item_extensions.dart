// lib/extensions/order_item_extensions.dart
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:collection/collection.dart';

extension OrderItemListExtensions on List<OrderItemModel> {
  static const listEquality = DeepCollectionEquality.unordered();

  /// Mencari index dari order item yang memiliki karakteristik sama
  int findSimilarItemIndex(OrderItemModel targetItem) {
    return indexWhere((item) => item.isSimilarTo(targetItem));
  }

  /// Mencari index dari order item yang memiliki karakteristik sama
  /// tetapi mengecualikan index tertentu
  int findSimilarItemIndexExcept(OrderItemModel targetItem, int excludeIndex) {
    for (int i = 0; i < length; i++) {
      if (i == excludeIndex) continue;

      if (this[i].isSimilarTo(targetItem)) {
        return i;
      }
    }

    return -1;
  }

  /// Mengecek apakah ada item yang similar dengan target item
  bool hasSimilarItem(OrderItemModel targetItem) {
    return findSimilarItemIndex(targetItem) != -1;
  }

  /// Debug helper untuk semua items
  void debugPrintAllItems() {
    for (int i = 0; i < length; i++) {
      AppLogger.debug(
        'Item $i: ${this[i].menuItem.name} - ${this[i].menuItem.id}',
      );
    }
  }
}

extension OrderItemModelExtensions on OrderItemModel {
  static const listEquality = DeepCollectionEquality.unordered();

  /// Mengecek apakah order item ini similar dengan order item lain
  bool isSimilarTo(OrderItemModel other) {
    return menuItem.id == other.menuItem.id &&
        _areToppingsEqual(selectedToppings, other.selectedToppings) &&
        _areAddonsEqual(selectedAddons, other.selectedAddons) &&
        _areNotesEqual(notes, other.notes) &&
        _areOrderItemOrderTypeEqual(orderType, other.orderType);
  }

  /// Mengecek apakah dua list toppings sama
  bool _areToppingsEqual(
    List<ToppingModel> toppings1,
    List<ToppingModel> toppings2,
  ) {
    return listEquality.equals(
      toppings1.map((e) => e.id).toList(),
      toppings2.map((e) => e.id).toList(),
    );
  }

  /// Mengecek apakah dua list addons sama
  bool _areAddonsEqual(List<AddonModel> a1, List<AddonModel> a2) {
    if (a1.length != a2.length) return false;

    Map<String, List<String>> m1 = {
      for (final a in a1)
        a.id!: (a.options ?? []).map((o) => o.id!).toList()..sort(),
    };
    Map<String, List<String>> m2 = {
      for (final a in a2)
        a.id!: (a.options ?? []).map((o) => o.id!).toList()..sort(),
    };

    return const DeepCollectionEquality().equals(m1, m2);
  }

  /// Mengecek apakah dua notes sama
  bool _areNotesEqual(String? note1, String? note2) {
    return note1 == note2;
  }

  bool _areOrderItemOrderTypeEqual(OrderType orderType1, OrderType orderType2) {
    return orderType1 == orderType2;
  }

  /// Debug helper untuk mencetak detail item ini
  void debugPrint() {
    AppLogger.debug('OrderItem: ${menuItem.name} (${menuItem.id})');
    AppLogger.debug(
      'Toppings: ${selectedToppings.map((e) => e.name).join(", ")}',
    );
    AppLogger.debug('Addons: ${selectedAddons.map((e) => e.name).join(", ")}');
    AppLogger.debug('Notes: $notes');
    AppLogger.debug('Quantity: $quantity');
  }

  /// Debug helper untuk membandingkan dengan item lain
  void debugCompareWith(OrderItemModel other) {
    AppLogger.debug('Comparing items:');
    AppLogger.debug('  This: ${menuItem.name} (${menuItem.id})');
    AppLogger.debug('  Other: ${other.menuItem.name} (${other.menuItem.id})');
    AppLogger.debug('  Menu ID equal: ${menuItem.id == other.menuItem.id}');
    AppLogger.debug(
      '  Toppings equal: ${_areToppingsEqual(selectedToppings, other.selectedToppings)}',
    );
    AppLogger.debug(
      '  Addons equal: ${_areAddonsEqual(selectedAddons, other.selectedAddons)}',
    );
    AppLogger.debug('  Notes equal: ${_areNotesEqual(notes, other.notes)}');
    AppLogger.debug('  Overall similar: ${isSimilarTo(other)}');
  }
}
