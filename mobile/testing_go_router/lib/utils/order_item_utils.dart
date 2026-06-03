// lib/utils/order_item_utils.dart
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:collection/collection.dart';

class OrderItemUtils {
  static const listEquality = DeepCollectionEquality.unordered();

  /// Mencari index dari order item yang memiliki karakteristik sama
  /// Mengembalikan index jika ditemukan, atau -1 jika tidak ada
  static int findExistingOrderItemIndex(
    List<OrderItemModel> items,
    OrderItemModel targetItem,
  ) {
    return items.indexWhere(
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

  /// Mencari index dari order item yang memiliki karakteristik sama
  /// tetapi mengecualikan index tertentu (berguna untuk edit)
  static int findExistingOrderItemIndexExcept(
    List<OrderItemModel> items,
    OrderItemModel targetItem,
    int excludeIndex,
  ) {
    for (int i = 0; i < items.length; i++) {
      if (i == excludeIndex) continue; // skip index yang dikecualikan

      final item = items[i];
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

  /// Mengecek apakah dua order item memiliki karakteristik yang sama
  static bool areOrderItemsEqual(OrderItemModel item1, OrderItemModel item2) {
    return item1.menuItem.id == item2.menuItem.id &&
        areToppingsEqual(item1.selectedToppings, item2.selectedToppings) &&
        areAddonsEqual(item1.selectedAddons, item2.selectedAddons) &&
        areNotesEqual(item1.notes, item2.notes);
  }

  /// Mengecek apakah dua list toppings sama
  static bool areToppingsEqual(
    List<ToppingModel> toppings1,
    List<ToppingModel> toppings2,
  ) {
    return listEquality.equals(
      toppings1.map((e) => e.id).toList(),
      toppings2.map((e) => e.id).toList(),
    );
  }

  /// Mengecek apakah dua list addons sama
  static bool areAddonsEqual(
    List<AddonModel> addons1,
    List<AddonModel> addons2,
  ) {
    if (addons1.length != addons2.length) return false;

    for (var i = 0; i < addons1.length; i++) {
      final ids1 = addons1[i].options!.map((e) => e.id).toList()..sort();
      final ids2 = addons2[i].options!.map((e) => e.id).toList()..sort();

      if (!listEquality.equals(ids1, ids2)) return false;
    }

    return true;
  }

  /// Mengecek apakah dua notes sama
  static bool areNotesEqual(String? note1, String? note2) {
    return note1 == note2;
  }

  /// Debug helper untuk mencetak perbandingan order items
  static void debugCompareOrderItems(
    OrderItemModel item1,
    OrderItemModel item2,
  ) {
    AppLogger.debug(
      'Comparing item id: ${item1.menuItem.id} vs ${item2.menuItem.id}',
    );
    AppLogger.debug(
      'Toppings equal: ${areToppingsEqual(item1.selectedToppings, item2.selectedToppings)}',
    );
    AppLogger.debug(
      'Addons equal: ${areAddonsEqual(item1.selectedAddons, item2.selectedAddons)}',
    );
    AppLogger.debug('Notes equal: ${areNotesEqual(item1.notes, item2.notes)}');
  }
}
