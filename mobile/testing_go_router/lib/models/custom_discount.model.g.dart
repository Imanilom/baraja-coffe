// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'custom_discount.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CustomDiscountModelAdapter extends TypeAdapter<CustomDiscountModel> {
  @override
  final typeId = 37;

  @override
  CustomDiscountModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CustomDiscountModel(
      isActive: fields[0] == null ? false : fields[0] as bool,
      discountType: fields[1] as String?,
      discountValue: fields[2] == null ? 0 : (fields[2] as num).toInt(),
      discountAmount: fields[3] == null ? 0 : (fields[3] as num).toInt(),
      appliedBy: fields[4] as String?,
      appliedAt: fields[5] as DateTime?,
      reason: fields[6] == null ? '' : fields[6] as String,
    );
  }

  @override
  void write(BinaryWriter writer, CustomDiscountModel obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.isActive)
      ..writeByte(1)
      ..write(obj.discountType)
      ..writeByte(2)
      ..write(obj.discountValue)
      ..writeByte(3)
      ..write(obj.discountAmount)
      ..writeByte(4)
      ..write(obj.appliedBy)
      ..writeByte(5)
      ..write(obj.appliedAt)
      ..writeByte(6)
      ..write(obj.reason);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CustomDiscountModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CustomDiscountModel _$CustomDiscountModelFromJson(Map<String, dynamic> json) =>
    _CustomDiscountModel(
      isActive: json['isActive'] as bool? ?? false,
      discountType: json['discountType'] as String?,
      discountValue: (json['discountValue'] as num?)?.toInt() ?? 0,
      discountAmount: (json['discountAmount'] as num?)?.toInt() ?? 0,
      appliedBy: json['appliedBy'] as String?,
      appliedAt:
          json['appliedAt'] == null
              ? null
              : DateTime.parse(json['appliedAt'] as String),
      reason: json['reason'] as String? ?? '',
    );

Map<String, dynamic> _$CustomDiscountModelToJson(
  _CustomDiscountModel instance,
) => <String, dynamic>{
  'isActive': instance.isActive,
  'discountType': instance.discountType,
  'discountValue': instance.discountValue,
  'discountAmount': instance.discountAmount,
  'appliedBy': instance.appliedBy,
  'appliedAt': instance.appliedAt?.toIso8601String(),
  'reason': instance.reason,
};
