// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'location_type.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class LocationTypeModelAdapter extends TypeAdapter<LocationTypeModel> {
  @override
  final typeId = 208;

  @override
  LocationTypeModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return LocationTypeModel(
      id: fields[0] as String,
      name: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, LocationTypeModel obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LocationTypeModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_LocationTypeModel _$LocationTypeModelFromJson(Map<String, dynamic> json) =>
    _LocationTypeModel(id: json['id'] as String, name: json['name'] as String);

Map<String, dynamic> _$LocationTypeModelToJson(_LocationTypeModel instance) =>
    <String, dynamic>{'id': instance.id, 'name': instance.name};
