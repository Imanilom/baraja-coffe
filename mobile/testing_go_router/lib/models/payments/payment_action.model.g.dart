// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_action.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PaymentActionModelAdapter extends TypeAdapter<PaymentActionModel> {
  @override
  final typeId = 18;

  @override
  PaymentActionModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PaymentActionModel(
      name: fields[0] == null ? null : fields[0] as String?,
      method: fields[1] == null ? null : fields[1] as String?,
      url: fields[2] == null ? null : fields[2] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, PaymentActionModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.name)
      ..writeByte(1)
      ..write(obj.method)
      ..writeByte(2)
      ..write(obj.url);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PaymentActionModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PaymentActionModel _$PaymentActionModelFromJson(Map<String, dynamic> json) =>
    _PaymentActionModel(
      name: json['name'] as String? ?? null,
      method: json['method'] as String? ?? null,
      url: json['url'] as String? ?? null,
    );

Map<String, dynamic> _$PaymentActionModelToJson(_PaymentActionModel instance) =>
    <String, dynamic>{
      'name': instance.name,
      'method': instance.method,
      'url': instance.url,
    };
