// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tax_service_detail.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TaxServiceDetailModelAdapter extends TypeAdapter<TaxServiceDetailModel> {
  @override
  final typeId = 17;

  @override
  TaxServiceDetailModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TaxServiceDetailModel(
      type: fields[0] as String,
      name: fields[1] as String?,
      amount: (fields[2] as num).toDouble(),
    );
  }

  @override
  void write(BinaryWriter writer, TaxServiceDetailModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.type)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.amount);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TaxServiceDetailModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TaxServiceDetailModel _$TaxServiceDetailModelFromJson(
  Map<String, dynamic> json,
) => _TaxServiceDetailModel(
  type: json['type'] as String,
  name: json['name'] as String?,
  amount: (json['amount'] as num).toDouble(),
);

Map<String, dynamic> _$TaxServiceDetailModelToJson(
  _TaxServiceDetailModel instance,
) => <String, dynamic>{
  'type': instance.type,
  'name': instance.name,
  'amount': instance.amount,
};
