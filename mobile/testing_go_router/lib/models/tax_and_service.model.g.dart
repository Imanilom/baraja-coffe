// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tax_and_service.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TaxAndServiceModelAdapter extends TypeAdapter<TaxAndServiceModel> {
  @override
  final typeId = 14;

  @override
  TaxAndServiceModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TaxAndServiceModel(
      id: fields[0] as String?,
      type: fields[1] as String?,
      name: fields[2] as String?,
      description: fields[3] == null ? '' : fields[3] as String?,
      percentage: fields[4] == null ? 0 : (fields[4] as num?)?.toInt(),
      fixedFee: fields[5] == null ? 0 : (fields[5] as num?)?.toInt(),
      isActive: fields[6] as bool?,
      appliesToOutlets:
          fields[7] == null
              ? null
              : (fields[7] as List?)?.cast<OutletInfoModel>(),
    );
  }

  @override
  void write(BinaryWriter writer, TaxAndServiceModel obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.type)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.description)
      ..writeByte(4)
      ..write(obj.percentage)
      ..writeByte(5)
      ..write(obj.fixedFee)
      ..writeByte(6)
      ..write(obj.isActive)
      ..writeByte(7)
      ..write(obj.appliesToOutlets);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TaxAndServiceModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TaxAndServiceModel _$TaxAndServiceModelFromJson(Map<String, dynamic> json) =>
    _TaxAndServiceModel(
      id: json['_id'] as String?,
      type: json['type'] as String?,
      name: json['name'] as String?,
      description: json['description'] as String? ?? '',
      percentage: (json['percentage'] as num?)?.toInt() ?? 0,
      fixedFee: (json['fixedFee'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool?,
      appliesToOutlets:
          (json['appliesToOutlets'] as List<dynamic>?)
              ?.map((e) => OutletInfoModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          null,
    );

Map<String, dynamic> _$TaxAndServiceModelToJson(_TaxAndServiceModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'type': instance.type,
      'name': instance.name,
      'description': instance.description,
      'percentage': instance.percentage,
      'fixedFee': instance.fixedFee,
      'isActive': instance.isActive,
      'appliesToOutlets': instance.appliesToOutlets,
    };
