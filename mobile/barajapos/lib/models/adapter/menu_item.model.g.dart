// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'menu_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class MenuItemModelAdapter extends TypeAdapter<MenuItemModel> {
  @override
  final int typeId = 3;

  @override
  MenuItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return MenuItemModel(
      id: fields[1] as String,
      name: fields[2] as String?,
      price: (fields[3] as num?)?.toInt(),
      description: fields[4] as String?,
      categories: (fields[5] as List?)?.cast<String>(),
      imageURL: fields[6] as String?,
      toppings: (fields[7] as List?)?.cast<ToppingModel>(),
      addons: (fields[8] as List?)?.cast<AddonModel>(),
    );
  }

  @override
  void write(BinaryWriter writer, MenuItemModel obj) {
    writer
      ..writeByte(8)
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
      ..write(obj.imageURL)
      ..writeByte(7)
      ..write(obj.toppings)
      ..writeByte(8)
      ..write(obj.addons);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MenuItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_MenuItemModel _$MenuItemModelFromJson(Map<String, dynamic> json) =>
    _MenuItemModel(
      id: json['_id'] as String,
      name: json['name'] as String?,
      price: (json['price'] as num?)?.toInt(),
      description: json['description'] as String?,
      categories: (json['category'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      imageURL: json['imageURL'] as String?,
      toppings: (json['toppings'] as List<dynamic>?)
          ?.map((e) => ToppingModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      addons: (json['addons'] as List<dynamic>?)
          ?.map((e) => AddonModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$MenuItemModelToJson(_MenuItemModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'price': instance.price,
      'description': instance.description,
      'category': instance.categories,
      'imageURL': instance.imageURL,
      'toppings': instance.toppings,
      'addons': instance.addons,
    };
