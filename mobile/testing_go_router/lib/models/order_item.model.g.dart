// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OrderItemModelAdapter extends TypeAdapter<OrderItemModel> {
  @override
  final typeId = 4;

  @override
  OrderItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OrderItemModel(
      menuItem: fields[0] as MenuItemModel,
      selectedToppings:
          fields[1] == null ? [] : (fields[1] as List).cast<ToppingModel>(),
      selectedAddons:
          fields[2] == null ? [] : (fields[2] as List).cast<AddonModel>(),
      quantity: fields[3] == null ? 1 : (fields[3] as num).toInt(),
      notes: fields[4] == null ? '' : fields[4] as String?,
      subtotal: fields[5] == null ? 0 : (fields[5] as num).toInt(),
      orderType: fields[6] == null ? OrderType.dineIn : fields[6] as OrderType,
      orderItemid: fields[7] == null ? null : fields[7] as String?,
      isPrinted: fields[8] == null ? false : fields[8] as bool,
      printedQuantity: fields[9] == null ? 0 : (fields[9] as num).toInt(),
      printBatchIds:
          fields[10] == null ? [] : (fields[10] as List).cast<String>(),
      reservedPromoId: fields[11] == null ? null : fields[11] as String?,
      customDiscount:
          fields[12] == null ? null : fields[12] as CustomDiscountModel?,
    );
  }

  @override
  void write(BinaryWriter writer, OrderItemModel obj) {
    writer
      ..writeByte(13)
      ..writeByte(0)
      ..write(obj.menuItem)
      ..writeByte(1)
      ..write(obj.selectedToppings)
      ..writeByte(2)
      ..write(obj.selectedAddons)
      ..writeByte(3)
      ..write(obj.quantity)
      ..writeByte(4)
      ..write(obj.notes)
      ..writeByte(5)
      ..write(obj.subtotal)
      ..writeByte(6)
      ..write(obj.orderType)
      ..writeByte(7)
      ..write(obj.orderItemid)
      ..writeByte(8)
      ..write(obj.isPrinted)
      ..writeByte(9)
      ..write(obj.printedQuantity)
      ..writeByte(10)
      ..write(obj.printBatchIds)
      ..writeByte(11)
      ..write(obj.reservedPromoId)
      ..writeByte(12)
      ..write(obj.customDiscount);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrderItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_OrderItemModel _$OrderItemModelFromJson(Map<String, dynamic> json) =>
    _OrderItemModel(
      menuItem: MenuItemModel.fromJson(
        json['menuItem'] as Map<String, dynamic>,
      ),
      selectedToppings:
          (json['selectedToppings'] as List<dynamic>?)
              ?.map((e) => ToppingModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      selectedAddons:
          (json['selectedAddons'] as List<dynamic>?)
              ?.map((e) => AddonModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      notes: json['notes'] as String? ?? "",
      subtotal: (json['subtotal'] as num?)?.toInt() ?? 0,
      orderType:
          json['dineType'] == null
              ? OrderType.dineIn
              : OrderTypeExtension.fromString(json['dineType'] as String),
      orderItemid: json['orderItemid'] as String? ?? null,
      isPrinted: json['isPrinted'] as bool? ?? false,
      printedQuantity: (json['printedQuantity'] as num?)?.toInt() ?? 0,
      printBatchIds:
          (json['printBatchIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      reservedPromoId: json['reservedPromoId'] as String? ?? null,
      customDiscount:
          json['customDiscount'] == null
              ? null
              : CustomDiscountModel.fromJson(
                json['customDiscount'] as Map<String, dynamic>,
              ),
    );

Map<String, dynamic> _$OrderItemModelToJson(_OrderItemModel instance) =>
    <String, dynamic>{
      'menuItem': instance.menuItem,
      'selectedToppings': instance.selectedToppings,
      'selectedAddons': instance.selectedAddons,
      'quantity': instance.quantity,
      'notes': instance.notes,
      'subtotal': instance.subtotal,
      'dineType': OrderTypeExtension.orderTypeToJson(instance.orderType),
      'orderItemid': instance.orderItemid,
      'isPrinted': instance.isPrinted,
      'printedQuantity': instance.printedQuantity,
      'printBatchIds': instance.printBatchIds,
      'reservedPromoId': instance.reservedPromoId,
      'customDiscount': instance.customDiscount,
    };
