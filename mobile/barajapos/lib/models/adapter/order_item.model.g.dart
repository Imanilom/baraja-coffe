// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OrderItemModelAdapter extends TypeAdapter<OrderItemModel> {
  @override
  final int typeId = 4;

  @override
  OrderItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OrderItemModel(
      menuItem: fields[0] as MenuItemModel,
      selectedToppings: (fields[1] as List).cast<ToppingModel>(),
      selectedAddons: (fields[2] as List).cast<AddonModel>(),
      quantity: (fields[3] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, OrderItemModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.menuItem)
      ..writeByte(1)
      ..write(obj.selectedToppings)
      ..writeByte(2)
      ..write(obj.selectedAddons)
      ..writeByte(3)
      ..write(obj.quantity);
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
      menuItem:
          MenuItemModel.fromJson(json['menuItem'] as Map<String, dynamic>),
      selectedToppings: (json['selectedToppings'] as List<dynamic>?)
              ?.map((e) => ToppingModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      selectedAddons: (json['selectedAddons'] as List<dynamic>?)
              ?.map((e) => AddonModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
    );

Map<String, dynamic> _$OrderItemModelToJson(_OrderItemModel instance) =>
    <String, dynamic>{
      'menuItem': instance.menuItem,
      'selectedToppings': instance.selectedToppings,
      'selectedAddons': instance.selectedAddons,
      'quantity': instance.quantity,
    };
