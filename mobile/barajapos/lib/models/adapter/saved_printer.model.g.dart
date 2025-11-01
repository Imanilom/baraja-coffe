// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_printer.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class SavedPrinterModelAdapter extends TypeAdapter<SavedPrinterModel> {
  @override
  final int typeId = 13;

  @override
  SavedPrinterModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return SavedPrinterModel(
      name: fields[0] as String,
      id: fields[1] as String,
      role: fields[2] as String,
    );
  }

  @override
  void write(BinaryWriter writer, SavedPrinterModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.name)
      ..writeByte(1)
      ..write(obj.id)
      ..writeByte(2)
      ..write(obj.role);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SavedPrinterModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SavedPrinterModel _$SavedPrinterModelFromJson(Map<String, dynamic> json) =>
    _SavedPrinterModel(
      name: json['name'] as String,
      id: json['id'] as String,
      role: json['role'] as String,
    );

Map<String, dynamic> _$SavedPrinterModelToJson(_SavedPrinterModel instance) =>
    <String, dynamic>{
      'name': instance.name,
      'id': instance.id,
      'role': instance.role,
    };
