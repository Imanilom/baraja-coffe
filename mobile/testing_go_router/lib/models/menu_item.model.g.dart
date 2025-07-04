// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'menu_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class MenuItemModelAdapter extends TypeAdapter<MenuItemModel> {
  @override
  final typeId = 3;

  @override
  MenuItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return MenuItemModel(
      id: fields[1] as String,
      name: fields[2] as String?,
      originalPrice: (fields[3] as num?)?.toInt(),
      discountedPrice: (fields[4] as num?)?.toInt(),
      description: fields[5] as String?,
      category: fields[6] as String?,
      subCategory: fields[7] as String?,
      imageURL: fields[8] as String?,
      toppings: (fields[9] as List?)?.cast<ToppingModel>(),
      addons: (fields[10] as List?)?.cast<AddonModel>(),
      discountPercentage: (fields[11] as num?)?.toInt(),
      averageRating: (fields[12] as num?)?.toInt(),
      reviewCount: (fields[13] as num?)?.toInt(),
      isAvailable: fields[14] == null ? true : fields[14] as bool?,
    );
  }

  @override
  void write(BinaryWriter writer, MenuItemModel obj) {
    writer
      ..writeByte(14)
      ..writeByte(1)
      ..write(obj.id)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.originalPrice)
      ..writeByte(4)
      ..write(obj.discountedPrice)
      ..writeByte(5)
      ..write(obj.description)
      ..writeByte(6)
      ..write(obj.category)
      ..writeByte(7)
      ..write(obj.subCategory)
      ..writeByte(8)
      ..write(obj.imageURL)
      ..writeByte(9)
      ..write(obj.toppings)
      ..writeByte(10)
      ..write(obj.addons)
      ..writeByte(11)
      ..write(obj.discountPercentage)
      ..writeByte(12)
      ..write(obj.averageRating)
      ..writeByte(13)
      ..write(obj.reviewCount)
      ..writeByte(14)
      ..write(obj.isAvailable);
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
      originalPrice: (json['originalPrice'] as num?)?.toInt(),
      discountedPrice: (json['discountedPrice'] as num?)?.toInt(),
      description: json['description'] as String?,
      category: json['category'] as String?,
      subCategory: json['subCategory'] as String?,
      imageURL: json['imageUrl'] as String?,
      toppings:
          (json['toppings'] as List<dynamic>?)
              ?.map((e) => ToppingModel.fromJson(e as Map<String, dynamic>))
              .toList(),
      addons:
          (json['addons'] as List<dynamic>?)
              ?.map((e) => AddonModel.fromJson(e as Map<String, dynamic>))
              .toList(),
      discountPercentage: (json['discountPercentage'] as num?)?.toInt(),
      averageRating: (json['averageRating'] as num?)?.toInt(),
      reviewCount: (json['reviewCount'] as num?)?.toInt(),
      isAvailable: json['isAvailable'] as bool? ?? true,
    );

Map<String, dynamic> _$MenuItemModelToJson(_MenuItemModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'originalPrice': instance.originalPrice,
      'discountedPrice': instance.discountedPrice,
      'description': instance.description,
      'category': instance.category,
      'subCategory': instance.subCategory,
      'imageUrl': instance.imageURL,
      'toppings': instance.toppings,
      'addons': instance.addons,
      'discountPercentage': instance.discountPercentage,
      'averageRating': instance.averageRating,
      'reviewCount': instance.reviewCount,
      'isAvailable': instance.isAvailable,
    };
