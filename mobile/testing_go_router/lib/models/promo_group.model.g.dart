// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'promo_group.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PromoGroupModelAdapter extends TypeAdapter<PromoGroupModel> {
  @override
  final typeId = 35;

  @override
  PromoGroupModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PromoGroupModel(
      promoId: fields[1] as String,
      title: fields[2] as String,
      subtitle: fields[3] as String,
      promoType: fields[4] as String,
      lines: (fields[5] as List).cast<PromoGroupLine>(),
      times: fields[6] == null ? 1 : (fields[6] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, PromoGroupModel obj) {
    writer
      ..writeByte(6)
      ..writeByte(1)
      ..write(obj.promoId)
      ..writeByte(2)
      ..write(obj.title)
      ..writeByte(3)
      ..write(obj.subtitle)
      ..writeByte(4)
      ..write(obj.promoType)
      ..writeByte(5)
      ..write(obj.lines)
      ..writeByte(6)
      ..write(obj.times);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PromoGroupModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class PromoGroupLineAdapter extends TypeAdapter<PromoGroupLine> {
  @override
  final typeId = 36;

  @override
  PromoGroupLine read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PromoGroupLine(
      menuItemId: fields[1] as String,
      qty: (fields[2] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, PromoGroupLine obj) {
    writer
      ..writeByte(2)
      ..writeByte(1)
      ..write(obj.menuItemId)
      ..writeByte(2)
      ..write(obj.qty);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PromoGroupLineAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PromoGroupModel _$PromoGroupModelFromJson(Map<String, dynamic> json) =>
    _PromoGroupModel(
      promoId: json['promoId'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String,
      promoType: json['promoType'] as String,
      lines:
          (json['lines'] as List<dynamic>)
              .map((e) => PromoGroupLine.fromJson(e as Map<String, dynamic>))
              .toList(),
      times: (json['times'] as num?)?.toInt() ?? 1,
    );

Map<String, dynamic> _$PromoGroupModelToJson(_PromoGroupModel instance) =>
    <String, dynamic>{
      'promoId': instance.promoId,
      'title': instance.title,
      'subtitle': instance.subtitle,
      'promoType': instance.promoType,
      'lines': instance.lines,
      'times': instance.times,
    };

_PromoGroupLine _$PromoGroupLineFromJson(Map<String, dynamic> json) =>
    _PromoGroupLine(
      menuItemId: json['menuItemId'] as String,
      qty: (json['qty'] as num).toInt(),
    );

Map<String, dynamic> _$PromoGroupLineToJson(_PromoGroupLine instance) =>
    <String, dynamic>{'menuItemId': instance.menuItemId, 'qty': instance.qty};
