// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'custom_amount_items.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CustomAmountItemsModelAdapter
    extends TypeAdapter<CustomAmountItemsModel> {
  @override
  final typeId = 28;

  @override
  CustomAmountItemsModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CustomAmountItemsModel(
      amount: fields[0] == null ? 0 : (fields[0] as num).toInt(),
      name: fields[1] == null ? 'Custom Amount' : fields[1] as String?,
      description: fields[2] == null ? null : fields[2] as String?,
      orderType:
          fields[3] == null
              ? OrderTypeModel.dineIn
              : fields[3] as OrderTypeModel?,
    );
  }

  @override
  void write(BinaryWriter writer, CustomAmountItemsModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.amount)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.description)
      ..writeByte(3)
      ..write(obj.orderType);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CustomAmountItemsModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CustomAmountItemsModel _$CustomAmountItemsModelFromJson(
  Map<String, dynamic> json,
) => _CustomAmountItemsModel(
  amount: (json['amount'] as num?)?.toInt() ?? 0,
  name: json['name'] as String? ?? 'Custom Amount',
  description: json['description'] as String? ?? null,
  orderType:
      json['orderType'] == null
          ? OrderTypeModel.dineIn
          : OrderTypeModel.fromString(json['orderType'] as String),
);

Map<String, dynamic> _$CustomAmountItemsModelToJson(
  _CustomAmountItemsModel instance,
) => <String, dynamic>{
  'amount': instance.amount,
  'name': instance.name,
  'description': instance.description,
  'orderType': OrderTypeModel.toJsonString(instance.orderType),
};
