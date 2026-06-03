// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'free_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class FreeItemModelAdapter extends TypeAdapter<FreeItemModel> {
  @override
  final typeId = 34;

  @override
  FreeItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return FreeItemModel(
      menuItem: fields[0] as String,
      menuItemName: fields[1] as String,
      quantity: (fields[2] as num).toInt(),
      id: fields[3] as String,
    );
  }

  @override
  void write(BinaryWriter writer, FreeItemModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.menuItem)
      ..writeByte(1)
      ..write(obj.menuItemName)
      ..writeByte(2)
      ..write(obj.quantity)
      ..writeByte(3)
      ..write(obj.id);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FreeItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_FreeItemModel _$FreeItemModelFromJson(Map<String, dynamic> json) =>
    _FreeItemModel(
      menuItem: json['menuItem'] as String,
      menuItemName: json['menuItemName'] as String,
      quantity: (json['quantity'] as num).toInt(),
      id: json['id'] as String,
    );

Map<String, dynamic> _$FreeItemModelToJson(_FreeItemModel instance) =>
    <String, dynamic>{
      'menuItem': instance.menuItem,
      'menuItemName': instance.menuItemName,
      'quantity': instance.quantity,
      'id': instance.id,
    };
