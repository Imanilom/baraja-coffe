// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'addon_option.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AddonOptionModelAdapter extends TypeAdapter<AddonOptionModel> {
  @override
  final int typeId = 3;

  @override
  AddonOptionModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AddonOptionModel(
      id: fields[0] as String?,
      name: fields[1] as String,
      price: (fields[2] as num).toDouble(),
    );
  }

  @override
  void write(BinaryWriter writer, AddonOptionModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.price);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AddonOptionModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
