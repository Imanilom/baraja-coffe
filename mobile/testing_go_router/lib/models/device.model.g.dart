// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'device.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class DeviceModelAdapter extends TypeAdapter<DeviceModel> {
  @override
  final typeId = 25;

  @override
  DeviceModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DeviceModel(
      id: fields[0] as String,
      outlet: fields[1] as String,
      deviceId: fields[2] as String,
      deviceName: fields[3] as String,
      deviceType: fields[4] as String,
      location: fields[5] as String,
      assignedAreas:
          fields[6] == null ? [] : (fields[6] as List).cast<String>(),
      assignedTables:
          fields[7] == null ? [] : (fields[7] as List).cast<String>(),
      orderTypes: fields[8] == null ? [] : (fields[8] as List).cast<String>(),
      isOnline: fields[9] == null ? false : fields[9] as bool,
      currentUser: fields[10] == null ? null : fields[10] as String?,
      isAvailable: fields[11] == null ? true : fields[11] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, DeviceModel obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.outlet)
      ..writeByte(2)
      ..write(obj.deviceId)
      ..writeByte(3)
      ..write(obj.deviceName)
      ..writeByte(4)
      ..write(obj.deviceType)
      ..writeByte(5)
      ..write(obj.location)
      ..writeByte(6)
      ..write(obj.assignedAreas)
      ..writeByte(7)
      ..write(obj.assignedTables)
      ..writeByte(8)
      ..write(obj.orderTypes)
      ..writeByte(9)
      ..write(obj.isOnline)
      ..writeByte(10)
      ..write(obj.currentUser)
      ..writeByte(11)
      ..write(obj.isAvailable);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DeviceModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_DeviceModel _$DeviceModelFromJson(Map<String, dynamic> json) => _DeviceModel(
  id: json['_id'] as String,
  outlet: json['outlet'] as String,
  deviceId: json['deviceId'] as String,
  deviceName: json['deviceName'] as String,
  deviceType: json['deviceType'] as String,
  location: json['location'] as String,
  assignedAreas:
      (json['assignedAreas'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  assignedTables:
      (json['assignedTables'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  orderTypes:
      (json['orderTypes'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  isOnline: json['isOnline'] as bool? ?? false,
  currentUser: json['currentUser'] as String? ?? null,
  isAvailable: json['isAvailable'] as bool? ?? true,
);

Map<String, dynamic> _$DeviceModelToJson(_DeviceModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'outlet': instance.outlet,
      'deviceId': instance.deviceId,
      'deviceName': instance.deviceName,
      'deviceType': instance.deviceType,
      'location': instance.location,
      'assignedAreas': instance.assignedAreas,
      'assignedTables': instance.assignedTables,
      'orderTypes': instance.orderTypes,
      'isOnline': instance.isOnline,
      'currentUser': instance.currentUser,
      'isAvailable': instance.isAvailable,
    };
