// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'menu_stock.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class MenuStockModelAdapter extends TypeAdapter<MenuStockModel> {
  @override
  final typeId = 29;

  @override
  MenuStockModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return MenuStockModel(
      calculatedStock: fields[0] == null ? 0 : (fields[0] as num?)?.toInt(),
      manualStock: fields[1] == null ? 0 : (fields[1] as num?)?.toInt(),
      effectiveStock: fields[2] == null ? 0 : (fields[2] as num?)?.toInt(),
      currentStock: fields[3] == null ? 0 : (fields[3] as num?)?.toInt(),
      isAvailable: fields[4] == null ? false : fields[4] as bool?,
      lastCalculatedAt: fields[5] == null ? null : fields[5] as String?,
      lastAdjustedAt: fields[6] == null ? null : fields[6] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, MenuStockModel obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.calculatedStock)
      ..writeByte(1)
      ..write(obj.manualStock)
      ..writeByte(2)
      ..write(obj.effectiveStock)
      ..writeByte(3)
      ..write(obj.currentStock)
      ..writeByte(4)
      ..write(obj.isAvailable)
      ..writeByte(5)
      ..write(obj.lastCalculatedAt)
      ..writeByte(6)
      ..write(obj.lastAdjustedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MenuStockModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_MenuStockModel _$MenuStockModelFromJson(Map<String, dynamic> json) =>
    _MenuStockModel(
      calculatedStock: (json['calculatedStock'] as num?)?.toInt() ?? 0,
      manualStock: (json['manualStock'] as num?)?.toInt() ?? 0,
      effectiveStock: (json['effectiveStock'] as num?)?.toInt() ?? 0,
      currentStock: (json['currentStock'] as num?)?.toInt() ?? 0,
      isAvailable: json['isAvailable'] as bool? ?? false,
      lastCalculatedAt: json['lastCalculatedAt'] as String? ?? null,
      lastAdjustedAt: json['lastAdjustedAt'] as String? ?? null,
    );

Map<String, dynamic> _$MenuStockModelToJson(_MenuStockModel instance) =>
    <String, dynamic>{
      'calculatedStock': instance.calculatedStock,
      'manualStock': instance.manualStock,
      'effectiveStock': instance.effectiveStock,
      'currentStock': instance.currentStock,
      'isAvailable': instance.isAvailable,
      'lastCalculatedAt': instance.lastCalculatedAt,
      'lastAdjustedAt': instance.lastAdjustedAt,
    };
