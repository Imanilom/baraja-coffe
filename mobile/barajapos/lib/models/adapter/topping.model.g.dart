// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'topping.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ToppingModelAdapter extends TypeAdapter<ToppingModel> {
  @override
  final int typeId = 2;

  @override
  ToppingModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ToppingModel(
      id: fields[0] as String?,
      name: fields[1] as String?,
      price: (fields[2] as num?)?.toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, ToppingModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.price);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ToppingModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ToppingModel _$ToppingModelFromJson(Map<String, dynamic> json) =>
    _ToppingModel(
      id: json['id'] as String?,
      name: json['name'] as String?,
      price: (json['price'] as num?)?.toInt(),
    );

Map<String, dynamic> _$ToppingModelToJson(_ToppingModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'price': instance.price,
    };
