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
      icon: fields[2] as String,
      isActive: fields[3] as bool,
      paymentMethods: (fields[4] as List).cast<PaymentMethodModel>(),
    );
  }

  @override
  void write(BinaryWriter writer, PaymentTypeModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.icon)
      ..writeByte(3)
      ..write(obj.isActive)
      ..writeByte(4)
      ..write(obj.paymentMethods);
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
      icon: json['icon'] as String,
      isActive: json['isActive'] as bool,
      paymentMethods:
          (json['paymentMethods'] as List<dynamic>)
              .map(
                (e) => PaymentMethodModel.fromJson(e as Map<String, dynamic>),
              )
              .toList(),
    );

Map<String, dynamic> _$PaymentTypeModelToJson(_PaymentTypeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'icon': instance.icon,
      'isActive': instance.isActive,
      'paymentMethods': instance.paymentMethods,
    };
