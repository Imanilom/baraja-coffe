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
      discount: fields[3] == null ? 0 : (fields[3] as num?)?.toInt(),
      affectedItems:
          fields[4] == null
              ? []
              : (fields[4] as List).cast<AffectedItemModel>(),
      freeItems:
          fields[5] == null ? [] : (fields[5] as List).cast<FreeItemModel>(),
      id: fields[6] == null ? null : fields[6] as String?,
      appliedCount: fields[7] == null ? 1 : (fields[7] as num?)?.toInt(),
      bundleSets: fields[8] == null ? 1 : (fields[8] as num?)?.toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, AppliedPromosModel obj) {
    writer
      ..writeByte(9)
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
      ..write(obj.id)
      ..writeByte(7)
      ..write(obj.appliedCount)
      ..writeByte(8)
      ..write(obj.bundleSets);
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

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppliedPromosModel _$AppliedPromosModelFromJson(Map<String, dynamic> json) =>
    _AppliedPromosModel(
      promoId: json['promoId'] as String,
      promoName: json['promoName'] as String,
      promoType: json['promoType'] as String,
      discount: (json['discount'] as num?)?.toInt() ?? 0,
      affectedItems:
          (json['affectedItems'] as List<dynamic>?)
              ?.map(
                (e) => AffectedItemModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
      freeItems:
          (json['freeItems'] as List<dynamic>?)
              ?.map((e) => FreeItemModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      id: json['_id'] as String? ?? null,
      appliedCount: (json['appliedCount'] as num?)?.toInt() ?? 1,
      bundleSets: (json['bundleSets'] as num?)?.toInt() ?? 1,
    );

Map<String, dynamic> _$AppliedPromosModelToJson(_AppliedPromosModel instance) =>
    <String, dynamic>{
      'promoId': instance.promoId,
      'promoName': instance.promoName,
      'promoType': instance.promoType,
      'discount': instance.discount,
      'affectedItems': instance.affectedItems,
      'freeItems': instance.freeItems,
      '_id': instance.id,
      'appliedCount': instance.appliedCount,
      'bundleSets': instance.bundleSets,
    };
