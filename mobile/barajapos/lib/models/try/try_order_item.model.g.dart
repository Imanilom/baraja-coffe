// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'try_order_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TryOrderItemModelAdapter extends TypeAdapter<TryOrderItemModel> {
  @override
  final int typeId = 10;

  @override
  TryOrderItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TryOrderItemModel(
      menuItem: fields[0] as TryMenuItemModel?,
      selectedToppings: (fields[1] as List).cast<ToppingModel>(),
      selectedAddons: (fields[2] as List?)?.cast<TryAddonModel>(),
      quantity: (fields[3] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, TryOrderItemModel obj) {
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
      other is TryOrderItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TryOrderItemModel _$TryOrderItemModelFromJson(Map<String, dynamic> json) =>
    _TryOrderItemModel(
      menuItem: json['menuItem'] == null
          ? null
          : TryMenuItemModel.fromJson(json['menuItem'] as Map<String, dynamic>),
      selectedToppings: (json['selectedToppings'] as List<dynamic>?)
              ?.map((e) => ToppingModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      selectedAddons: (json['selectedAddons'] as List<dynamic>?)
          ?.map((e) => TryAddonModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
    );

Map<String, dynamic> _$TryOrderItemModelToJson(_TryOrderItemModel instance) =>
    <String, dynamic>{
      'menuItem': instance.menuItem,
      'selectedToppings': instance.selectedToppings,
      'selectedAddons': instance.selectedAddons,
      'quantity': instance.quantity,
    };
