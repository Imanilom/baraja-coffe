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
      label: fields[1] as String,
      isDefault: fields[2] as bool?,
      price: (fields[3] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, AddonOptionModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.label)
      ..writeByte(2)
      ..write(obj.isDefault)
      ..writeByte(3)
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
