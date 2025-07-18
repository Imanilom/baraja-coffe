// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'va_number.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class VANumberModelAdapter extends TypeAdapter<VANumberModel> {
  @override
  final typeId = 19;

  @override
  VANumberModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return VANumberModel(
      bank: fields[0] as String,
      vaNumber: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, VANumberModel obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.bank)
      ..writeByte(1)
      ..write(obj.vaNumber);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is VANumberModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_VANumberModel _$VANumberModelFromJson(Map<String, dynamic> json) =>
    _VANumberModel(
      bank: json['bank'] as String,
      vaNumber: json['va_number'] as String,
    );

Map<String, dynamic> _$VANumberModelToJson(_VANumberModel instance) =>
    <String, dynamic>{'bank': instance.bank, 'va_number': instance.vaNumber};
