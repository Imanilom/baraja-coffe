// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'applied_promos.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AppliedPromosModelAdapter extends TypeAdapter<AppliedPromosModel> {
  @override
  final typeId = 8;

  @override
  AppliedPromosModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AppliedPromosModel(
      promoId: fields[0] as String,
      promoName: fields[1] as String,
      promoType: fields[2] as String,
      discount: (fields[3] as num).toInt(),
      affectedItems:
          fields[4] == null ? [] : (fields[4] as List).cast<AffectedItem>(),
      freeItems: fields[5] == null ? [] : (fields[5] as List).cast<FreeItem>(),
      id: fields[6] as String,
    );
  }

  @override
  void write(BinaryWriter writer, AppliedPromosModel obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.promoId)
      ..writeByte(1)
      ..write(obj.promoName)
      ..writeByte(2)
      ..write(obj.promoType)
      ..writeByte(3)
      ..write(obj.discount)
      ..writeByte(4)
      ..write(obj.affectedItems)
      ..writeByte(5)
      ..write(obj.freeItems)
      ..writeByte(6)
      ..write(obj.id);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AppliedPromosModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class AffectedItemAdapter extends TypeAdapter<AffectedItem> {
  @override
  final typeId = 10;

  @override
  AffectedItem read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AffectedItem(
      menuItem: fields[0] as String,
      menuItemName: fields[1] as String,
      quantity: (fields[2] as num).toInt(),
      originalSubtotal: (fields[3] as num).toInt(),
      discountAmount: (fields[4] as num).toInt(),
      discountedSubtotal: (fields[5] as num).toInt(),
      discountPercentage: (fields[6] as num).toInt(),
      id: fields[7] as String,
    );
  }

  @override
  void write(BinaryWriter writer, AffectedItem obj) {
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
      other is AffectedItemAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppliedPromosModel _$AppliedPromosModelFromJson(Map<String, dynamic> json) =>
    _AppliedPromosModel(
      promoId: json['promoId'] as String,
      promoName: json['promoName'] as String,
      promoType: json['promoType'] as String,
      discount: (json['discount'] as num).toInt(),
      affectedItems:
          (json['affectedItems'] as List<dynamic>?)
              ?.map((e) => AffectedItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      freeItems:
          (json['freeItems'] as List<dynamic>?)
              ?.map((e) => FreeItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      id: json['id'] as String,
    );

Map<String, dynamic> _$AppliedPromosModelToJson(_AppliedPromosModel instance) =>
    <String, dynamic>{
      'promoId': instance.promoId,
      'promoName': instance.promoName,
      'promoType': instance.promoType,
      'discount': instance.discount,
      'affectedItems': instance.affectedItems,
      'freeItems': instance.freeItems,
      'id': instance.id,
    };

_AffectedItem _$AffectedItemFromJson(Map<String, dynamic> json) =>
    _AffectedItem(
      menuItem: json['menuItem'] as String,
      menuItemName: json['menuItemName'] as String,
      quantity: (json['quantity'] as num).toInt(),
      originalSubtotal: (json['originalSubtotal'] as num).toInt(),
      discountAmount: (json['discountAmount'] as num).toInt(),
      discountedSubtotal: (json['discountedSubtotal'] as num).toInt(),
      discountPercentage: (json['discountPercentage'] as num).toInt(),
      id: json['id'] as String,
    );

Map<String, dynamic> _$AffectedItemToJson(_AffectedItem instance) =>
    <String, dynamic>{
      'menuItem': instance.menuItem,
      'menuItemName': instance.menuItemName,
      'quantity': instance.quantity,
      'originalSubtotal': instance.originalSubtotal,
      'discountAmount': instance.discountAmount,
      'discountedSubtotal': instance.discountedSubtotal,
      'discountPercentage': instance.discountPercentage,
      'id': instance.id,
    };

_FreeItem _$FreeItemFromJson(Map<String, dynamic> json) => _FreeItem(
  menuItem: json['menuItem'] as String,
  menuItemName: json['menuItemName'] as String,
  quantity: (json['quantity'] as num).toInt(),
  id: json['id'] as String,
);

Map<String, dynamic> _$FreeItemToJson(_FreeItem instance) => <String, dynamic>{
  'menuItem': instance.menuItem,
  'menuItemName': instance.menuItemName,
  'quantity': instance.quantity,
  'id': instance.id,
};
