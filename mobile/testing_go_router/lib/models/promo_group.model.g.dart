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
      id: fields[0] as String,
      promoId: fields[1] as String,
      name: fields[2] as String,
      promoType: fields[3] as String,
      description: fields[4] == null ? null : fields[4] as String?,
      lines:
          fields[5] == null
              ? []
              : (fields[5] as List).cast<PromoGroupLineModel>(),
      bundlePrice: (fields[6] as num?)?.toInt(),
      discount: (fields[7] as num?)?.toInt(),
      isActive: fields[8] == null ? false : fields[8] as bool,
      imageUrl: fields[9] as String?,
      tags: fields[10] == null ? [] : (fields[10] as List).cast<String>(),
      sourcePromo: fields[11] as AutoPromoModel?,
    );
  }

  @override
  void write(BinaryWriter writer, PromoGroupModel obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.promoId)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.promoType)
      ..writeByte(4)
      ..write(obj.description)
      ..writeByte(5)
      ..write(obj.lines)
      ..writeByte(6)
      ..write(obj.bundlePrice)
      ..writeByte(7)
      ..write(obj.discount)
      ..writeByte(8)
      ..write(obj.isActive)
      ..writeByte(9)
      ..write(obj.imageUrl)
      ..writeByte(10)
      ..write(obj.tags)
      ..writeByte(11)
      ..write(obj.sourcePromo);
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

class PromoGroupLineModelAdapter extends TypeAdapter<PromoGroupLineModel> {
  @override
  final typeId = 36;

  @override
  PromoGroupLineModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PromoGroupLineModel(
      menuItemId: fields[0] as String,
      menuItemName: fields[1] as String,
      qty: (fields[2] as num).toInt(),
      originalPrice: (fields[3] as num?)?.toInt(),
      categoryId: fields[4] as String?,
      categoryName: fields[5] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, PromoGroupLineModel obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.menuItemId)
      ..writeByte(1)
      ..write(obj.menuItemName)
      ..writeByte(2)
      ..write(obj.qty)
      ..writeByte(3)
      ..write(obj.originalPrice)
      ..writeByte(4)
      ..write(obj.categoryId)
      ..writeByte(5)
      ..write(obj.categoryName);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PromoGroupLineModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PromoGroupModel _$PromoGroupModelFromJson(Map<String, dynamic> json) =>
    _PromoGroupModel(
      id: json['id'] as String,
      promoId: json['promoId'] as String,
      name: json['name'] as String,
      promoType: json['promoType'] as String,
      description: json['description'] as String? ?? null,
      lines:
          (json['lines'] as List<dynamic>?)
              ?.map(
                (e) => PromoGroupLineModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
      bundlePrice: (json['bundlePrice'] as num?)?.toInt(),
      discount: (json['discount'] as num?)?.toInt(),
      isActive: json['isActive'] as bool? ?? false,
      imageUrl: json['imageUrl'] as String?,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
          const [],
      sourcePromo:
          json['sourcePromo'] == null
              ? null
              : AutoPromoModel.fromJson(
                json['sourcePromo'] as Map<String, dynamic>,
              ),
    );

Map<String, dynamic> _$PromoGroupModelToJson(_PromoGroupModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'promoId': instance.promoId,
      'name': instance.name,
      'promoType': instance.promoType,
      'description': instance.description,
      'lines': instance.lines,
      'bundlePrice': instance.bundlePrice,
      'discount': instance.discount,
      'isActive': instance.isActive,
      'imageUrl': instance.imageUrl,
      'tags': instance.tags,
      'sourcePromo': instance.sourcePromo,
    };

_PromoGroupLineModel _$PromoGroupLineModelFromJson(Map<String, dynamic> json) =>
    _PromoGroupLineModel(
      menuItemId: json['menuItemId'] as String,
      menuItemName: json['menuItemName'] as String,
      qty: (json['qty'] as num).toInt(),
      originalPrice: (json['originalPrice'] as num?)?.toInt(),
      categoryId: json['categoryId'] as String?,
      categoryName: json['categoryName'] as String?,
    );

Map<String, dynamic> _$PromoGroupLineModelToJson(
  _PromoGroupLineModel instance,
) => <String, dynamic>{
  'menuItemId': instance.menuItemId,
  'menuItemName': instance.menuItemName,
  'qty': instance.qty,
  'originalPrice': instance.originalPrice,
  'categoryId': instance.categoryId,
  'categoryName': instance.categoryName,
};
