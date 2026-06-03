// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_type.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OrderTypeModelAdapter extends TypeAdapter<OrderTypeModel> {
  @override
  final typeId = 205;

  @override
  OrderTypeModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OrderTypeModel(
      id: fields[0] as String,
      name: fields[1] as String,
      shortName: fields[2] as String,
    );
  }

  @override
  void write(BinaryWriter writer, OrderTypeModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.shortName);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrderTypeModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ItemOrderTypeModelAdapter extends TypeAdapter<ItemOrderTypeModel> {
  @override
  final typeId = 206;

  @override
  ItemOrderTypeModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ItemOrderTypeModel(
      id: fields[0] as String,
      name: fields[1] as String,
      shortName: fields[2] as String,
    );
  }

  @override
  void write(BinaryWriter writer, ItemOrderTypeModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.shortName);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ItemOrderTypeModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_OrderTypeModel _$OrderTypeModelFromJson(Map<String, dynamic> json) =>
    _OrderTypeModel(
      id: json['id'] as String,
      name: json['name'] as String,
      shortName: json['shortName'] as String,
    );

Map<String, dynamic> _$OrderTypeModelToJson(_OrderTypeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'shortName': instance.shortName,
    };

_ItemOrderTypeModel _$ItemOrderTypeModelFromJson(Map<String, dynamic> json) =>
    _ItemOrderTypeModel(
      id: json['id'] as String,
      name: json['name'] as String,
      shortName: json['shortName'] as String,
    );

Map<String, dynamic> _$ItemOrderTypeModelToJson(_ItemOrderTypeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'shortName': instance.shortName,
    };
