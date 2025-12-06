// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'discount.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class DiscountModelAdapter extends TypeAdapter<DiscountModel> {
  @override
  final typeId = 9;

  @override
  DiscountModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DiscountModel(
      autoPromoDiscount: fields[0] == null ? 0 : (fields[0] as num).toInt(),
      manualDiscount: fields[1] == null ? 0 : (fields[1] as num).toInt(),
      voucherDiscount: fields[2] == null ? 0 : (fields[2] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, DiscountModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.autoPromoDiscount)
      ..writeByte(1)
      ..write(obj.manualDiscount)
      ..writeByte(2)
      ..write(obj.voucherDiscount);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DiscountModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_DiscountModel _$DiscountModelFromJson(Map<String, dynamic> json) =>
    _DiscountModel(
      autoPromoDiscount: (json['autoPromoDiscount'] as num?)?.toInt() ?? 0,
      manualDiscount: (json['manualDiscount'] as num?)?.toInt() ?? 0,
      voucherDiscount: (json['voucherDiscount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$DiscountModelToJson(_DiscountModel instance) =>
    <String, dynamic>{
      'autoPromoDiscount': instance.autoPromoDiscount,
      'manualDiscount': instance.manualDiscount,
      'voucherDiscount': instance.voucherDiscount,
    };
