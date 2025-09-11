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
      name: fields[2] == null ? '' : fields[2] as String?,
      originalPrice: fields[3] == null ? 0 : (fields[3] as num?)?.toInt(),
      discountedPrice: fields[4] == null ? 0 : (fields[4] as num?)?.toInt(),
      description: fields[5] == null ? '' : fields[5] as String?,
      mainCategory: fields[6] == null ? '' : fields[6] as String?,
      subCategory: fields[7] == null ? '' : fields[7] as String?,
      imageURL: fields[8] == null ? '' : fields[8] as String?,
      toppings:
          fields[9] == null ? [] : (fields[9] as List?)?.cast<ToppingModel>(),
      addons:
          fields[10] == null ? [] : (fields[10] as List?)?.cast<AddonModel>(),
      discountPercentage:
          fields[11] == null ? 0 : (fields[11] as num?)?.toInt(),
      averageRating: fields[12] == null ? 0 : (fields[12] as num?)?.toInt(),
      reviewCount: fields[13] == null ? 0 : (fields[13] as num?)?.toInt(),
      isAvailable: fields[14] == null ? true : fields[14] as bool?,
      workstation: fields[15] == null ? '' : fields[15] as String?,
      stock: fields[16] == null ? 0 : (fields[16] as num?)?.toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, MenuItemModel obj) {
    writer
      ..writeByte(16)
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
      ..write(obj.mainCategory)
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
      ..write(obj.isAvailable)
      ..writeByte(15)
      ..write(obj.workstation)
      ..writeByte(16)
      ..write(obj.stock);
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
      id: json['id'] as String,
      name: json['name'] as String? ?? "",
      originalPrice: (json['originalPrice'] as num?)?.toInt() ?? 0,
      discountedPrice: (json['discountedPrice'] as num?)?.toInt() ?? 0,
      description: json['description'] as String? ?? "",
      mainCategory: json['mainCategory'] as String? ?? "",
      subCategory: json['subCategory'] as String? ?? "",
      imageURL: json['imageUrl'] as String? ?? "",
      toppings:
          (json['toppings'] as List<dynamic>?)
              ?.map((e) => ToppingModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      addons:
          (json['addons'] as List<dynamic>?)
              ?.map((e) => AddonModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      discountPercentage: (json['discountPercentage'] as num?)?.toInt() ?? 0,
      averageRating: (json['averageRating'] as num?)?.toInt() ?? 0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      isAvailable: json['isAvailable'] as bool? ?? true,
      workstation: json['workstation'] as String? ?? "",
      stock: (json['availableStock'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$MenuItemModelToJson(_MenuItemModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'originalPrice': instance.originalPrice,
      'discountedPrice': instance.discountedPrice,
      'description': instance.description,
      'mainCategory': instance.mainCategory,
      'subCategory': instance.subCategory,
      'imageUrl': instance.imageURL,
      'toppings': instance.toppings,
      'addons': instance.addons,
      'discountPercentage': instance.discountPercentage,
      'averageRating': instance.averageRating,
      'reviewCount': instance.reviewCount,
      'isAvailable': instance.isAvailable,
      'workstation': instance.workstation,
      'availableStock': instance.stock,
    };
