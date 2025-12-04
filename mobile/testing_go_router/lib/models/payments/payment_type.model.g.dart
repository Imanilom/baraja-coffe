// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_type.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PaymentTypeModelAdapter extends TypeAdapter<PaymentTypeModel> {
  @override
  final typeId = 22;

  @override
  PaymentTypeModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PaymentTypeModel(
      id: fields[0] as String,
      name: fields[1] as String,
      typeCode: fields[2] as String,
      methodIds: (fields[3] as List).cast<String>(),
      isDigital: fields[4] as bool,
      isActive: fields[5] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, PaymentTypeModel obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.typeCode)
      ..writeByte(3)
      ..write(obj.methodIds)
      ..writeByte(4)
      ..write(obj.isDigital)
      ..writeByte(5)
      ..write(obj.isActive);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PaymentTypeModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PaymentTypeModel _$PaymentTypeModelFromJson(Map<String, dynamic> json) =>
    _PaymentTypeModel(
      id: json['id'] as String,
      name: json['name'] as String,
      typeCode: json['typeCode'] as String,
      methodIds:
          (json['methodIds'] as List<dynamic>).map((e) => e as String).toList(),
      isDigital: json['isDigital'] as bool,
      isActive: json['isActive'] as bool,
    );

Map<String, dynamic> _$PaymentTypeModelToJson(_PaymentTypeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'typeCode': instance.typeCode,
      'methodIds': instance.methodIds,
      'isDigital': instance.isDigital,
      'isActive': instance.isActive,
    };
