import 'package:kasirbaraja/models/order_item.model.dart';

enum ItemChangeType { original, added, modified, removed }

class EditableOrderItem {
  final OrderItemModel item;
  final ItemChangeType changeType;
  final bool isOriginal; // Apakah item ini berasal dari order awal?

  EditableOrderItem({
    required this.item,
    required this.changeType,
    required this.isOriginal,
  });

  // Getter untuk ID unik item dalam konteks edit ini
  // Gabungan dari menuItem.id, addon.id, topping.id, notes
  String get uniqueId {
    // Urutkan addon dan topping untuk konsistensi
    final addonIds = (item.selectedAddons.map((a) => a.id).toList()..sort())
        .join('-');
    final toppingIds = (item.selectedToppings.map((t) => t.id).toList()..sort())
        .join('-');
    return '${item.menuItem.id}-$addonIds-$toppingIds-${item.notes}-${item.orderType.name}';
  }

  EditableOrderItem copyWith({
    OrderItemModel? item,
    ItemChangeType? changeType,
    bool? isOriginal,
  }) {
    return EditableOrderItem(
      item: item ?? this.item,
      changeType: changeType ?? this.changeType,
      isOriginal: isOriginal ?? this.isOriginal,
    );
  }
}
