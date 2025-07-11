// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'try_menu_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TryMenuItemModelAdapter extends TypeAdapter<TryMenuItemModel> {
  @override
  final int typeId = 11;

  @override
  TryMenuItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TryMenuItemModel(
      id: fields[1] as String,
      name: fields[2] as String?,
      price: (fields[3] as num?)?.toInt(),
      description: fields[4] as String?,
      categories: (fields[5] as List?)?.cast<String>(),
      imageURL: fields[6] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, TryMenuItemModel obj) {
    writer
      ..writeByte(6)
      ..writeByte(1)
      ..write(obj.id)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.price)
      ..writeByte(4)
      ..write(obj.description)
      ..writeByte(5)
      ..write(obj.categories)
      ..writeByte(6)
      ..write(obj.imageURL);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TryMenuItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TryMenuItemModel _$TryMenuItemModelFromJson(Map<String, dynamic> json) =>
    _TryMenuItemModel(
      id: json['_id'] as String,
      name: json['name'] as String? ?? '',
      price: (json['price'] as num?)?.toInt() ?? 0,
      description: json['description'] as String? ?? '',
      categories: (json['category'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      imageURL: json['imageURL'] as String? ?? '',
    );

Map<String, dynamic> _$TryMenuItemModelToJson(_TryMenuItemModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'price': instance.price,
      'description': instance.description,
      'category': instance.categories,
      'imageURL': instance.imageURL,
    };
