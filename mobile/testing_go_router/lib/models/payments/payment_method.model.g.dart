// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_method.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PaymentMethodModelAdapter extends TypeAdapter<PaymentMethodModel> {
  @override
  final typeId = 21;

  @override
  PaymentMethodModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PaymentMethodModel(
      id: fields[0] as String,
      name: fields[1] as String,
      methodCode: fields[2] as String,
      typeId: (fields[3] as List).cast<String>(),
      isDigital: fields[4] as bool,
      isActive: fields[5] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, PaymentMethodModel obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.methodCode)
      ..writeByte(3)
      ..write(obj.typeId)
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
      other is PaymentMethodModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PaymentMethodModel _$PaymentMethodModelFromJson(Map<String, dynamic> json) =>
    _PaymentMethodModel(
      id: json['id'] as String,
      name: json['name'] as String,
      methodCode: json['payment_method'] as String,
      typeId:
          (json['typeId'] as List<dynamic>).map((e) => e as String).toList(),
      isDigital: json['isDigital'] as bool,
      isActive: json['isActive'] as bool,
    );

Map<String, dynamic> _$PaymentMethodModelToJson(_PaymentMethodModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'payment_method': instance.methodCode,
      'typeId': instance.typeId,
      'isDigital': instance.isDigital,
      'isActive': instance.isActive,
    };
