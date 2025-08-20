// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'outlet_info.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OutletInfoModelAdapter extends TypeAdapter<OutletInfoModel> {
  @override
  final typeId = 23;

  @override
  OutletInfoModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OutletInfoModel(
      id: fields[0] as String?,
      name: fields[1] == null ? null : fields[1] as String?,
      address: fields[2] == null ? null : fields[2] as String?,
      city: fields[3] == null ? null : fields[3] as String?,
      contactNumber: fields[4] == null ? null : fields[4] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, OutletInfoModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.address)
      ..writeByte(3)
      ..write(obj.city)
      ..writeByte(4)
      ..write(obj.contactNumber);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OutletInfoModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_OutletInfoModel _$OutletInfoModelFromJson(Map<String, dynamic> json) =>
    _OutletInfoModel(
      id: json['_id'] as String?,
      name: json['name'] as String? ?? null,
      address: json['address'] as String? ?? null,
      city: json['city'] as String? ?? null,
      contactNumber: json['contactNumber'] as String? ?? null,
    );

Map<String, dynamic> _$OutletInfoModelToJson(_OutletInfoModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'address': instance.address,
      'city': instance.city,
      'contactNumber': instance.contactNumber,
    };
