// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_status.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OrderStatusModelAdapter extends TypeAdapter<OrderStatusModel> {
  @override
  final typeId = 207;

  @override
  OrderStatusModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OrderStatusModel(id: fields[0] as String, name: fields[1] as String);
  }

  @override
  void write(BinaryWriter writer, OrderStatusModel obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrderStatusModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_OrderStatusModel _$OrderStatusModelFromJson(Map<String, dynamic> json) =>
    _OrderStatusModel(id: json['id'] as String, name: json['name'] as String);

Map<String, dynamic> _$OrderStatusModelToJson(_OrderStatusModel instance) =>
    <String, dynamic>{'id': instance.id, 'name': instance.name};
