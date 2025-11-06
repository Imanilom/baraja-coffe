// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'affected_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AffectedItemModelAdapter extends TypeAdapter<AffectedItemModel> {
  @override
  final typeId = 10;

  @override
  AffectedItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AffectedItemModel(
      menuItem: fields[0] as String,
      menuItemName: fields[1] as String,
      quantity: (fields[2] as num).toInt(),
      originalSubtotal: (fields[3] as num).toInt(),
      discountAmount: (fields[4] as num).toInt(),
      discountedSubtotal: (fields[5] as num).toInt(),
      discountPercentage: fields[6] == null ? 0 : (fields[6] as num?)?.toInt(),
      id: fields[7] == null ? null : fields[7] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, AffectedItemModel obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.menuItem)
      ..writeByte(1)
      ..write(obj.menuItemName)
      ..writeByte(2)
      ..write(obj.quantity)
      ..writeByte(3)
      ..write(obj.originalSubtotal)
      ..writeByte(4)
      ..write(obj.discountAmount)
      ..writeByte(5)
      ..write(obj.discountedSubtotal)
      ..writeByte(6)
      ..write(obj.discountPercentage)
      ..writeByte(7)
      ..write(obj.id);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AffectedItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AffectedItemModel _$AffectedItemModelFromJson(Map<String, dynamic> json) =>
    _AffectedItemModel(
      menuItem: json['menuItem'] as String,
      menuItemName: json['menuItemName'] as String,
      quantity: (json['quantity'] as num).toInt(),
      originalSubtotal: (json['originalSubtotal'] as num).toInt(),
      discountAmount: (json['discountAmount'] as num).toInt(),
      discountedSubtotal: (json['discountedSubtotal'] as num).toInt(),
      discountPercentage: (json['discountPercentage'] as num?)?.toInt() ?? 0,
      id: json['_id'] as String? ?? null,
    );

Map<String, dynamic> _$AffectedItemModelToJson(_AffectedItemModel instance) =>
    <String, dynamic>{
      'menuItem': instance.menuItem,
      'menuItemName': instance.menuItemName,
      'quantity': instance.quantity,
      'originalSubtotal': instance.originalSubtotal,
      'discountAmount': instance.discountAmount,
      'discountedSubtotal': instance.discountedSubtotal,
      'discountPercentage': instance.discountPercentage,
      '_id': instance.id,
    };
