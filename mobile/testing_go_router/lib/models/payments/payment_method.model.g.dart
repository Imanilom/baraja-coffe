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
      icon: fields[2] as String,
      isActive: fields[3] as bool,
      paymentTypes:
          fields[4] == null ? [] : (fields[4] as List).cast<PaymentTypeModel>(),
    );
  }

  @override
  void write(BinaryWriter writer, PaymentMethodModel obj) {
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
      ..write(obj.paymentTypes);
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
      icon: json['icon'] as String,
      isActive: json['isActive'] as bool,
      paymentTypes:
          (json['paymentTypes'] as List<dynamic>?)
              ?.map((e) => PaymentTypeModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <PaymentTypeModel>[],
    );

Map<String, dynamic> _$PaymentMethodModelToJson(_PaymentMethodModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'icon': instance.icon,
      'isActive': instance.isActive,
      'paymentTypes': instance.paymentTypes,
    };
