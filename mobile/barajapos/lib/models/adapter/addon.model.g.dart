// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'addon.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AddonModelAdapter extends TypeAdapter<AddonModel> {
  @override
  final int typeId = 1;

  @override
  AddonModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AddonModel(
      id: fields[0] as String?,
      name: fields[1] as String?,
      type: fields[2] as String?,
      options: (fields[3] as List?)?.cast<AddonOptionModel>(),
    );
  }

  @override
  void write(BinaryWriter writer, AddonModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.type)
      ..writeByte(3)
      ..write(obj.options);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AddonModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AddonModel _$AddonModelFromJson(Map<String, dynamic> json) => _AddonModel(
      id: json['id'] as String?,
      name: json['name'] as String?,
      type: json['type'] as String?,
      options: (json['options'] as List<dynamic>?)
          ?.map((e) => AddonOptionModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$AddonModelToJson(_AddonModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'type': instance.type,
      'options': instance.options,
    };
