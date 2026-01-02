// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auto_promo.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AutoPromoModelAdapter extends TypeAdapter<AutoPromoModel> {
  @override
  final typeId = 11;

  @override
  AutoPromoModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AutoPromoModel(
      id: fields[0] as String,
      name: fields[1] as String,
      promoType: fields[2] as String,
      discount: fields[3] == null ? 0 : (fields[3] as num?)?.toInt(),
      bundlePrice: fields[4] == null ? 0 : (fields[4] as num?)?.toInt(),
      conditions: fields[5] == null ? null : fields[5] as Conditions?,
      activeHours: fields[6] == null ? null : fields[6] as ActiveHours?,
      outlet: fields[7] as Outlet,
      createdBy: fields[8] as String,
      validFrom: fields[9] as DateTime,
      validTo: fields[10] as DateTime,
      isActive: fields[11] == null ? false : fields[11] as bool?,
      createdAt: fields[12] as DateTime,
      updatedAt: fields[13] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, AutoPromoModel obj) {
    writer
      ..writeByte(14)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.promoType)
      ..writeByte(3)
      ..write(obj.discount)
      ..writeByte(4)
      ..write(obj.bundlePrice)
      ..writeByte(5)
      ..write(obj.conditions)
      ..writeByte(6)
      ..write(obj.activeHours)
      ..writeByte(7)
      ..write(obj.outlet)
      ..writeByte(8)
      ..write(obj.createdBy)
      ..writeByte(9)
      ..write(obj.validFrom)
      ..writeByte(10)
      ..write(obj.validTo)
      ..writeByte(11)
      ..write(obj.isActive)
      ..writeByte(12)
      ..write(obj.createdAt)
      ..writeByte(13)
      ..write(obj.updatedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AutoPromoModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ConditionsAdapter extends TypeAdapter<Conditions> {
  @override
  final typeId = 12;

  @override
  Conditions read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Conditions(
      bundleProducts:
          fields[0] == null ? [] : (fields[0] as List?)?.cast<BundleProduct>(),
      products:
          fields[1] == null
              ? []
              : (fields[1] as List?)?.cast<ProductCondition>(),
      minQuantity: fields[2] == null ? 0 : (fields[2] as num?)?.toInt(),
      minTotal: fields[3] == null ? 0 : (fields[3] as num?)?.toInt(),
      buyProduct: fields[4] as ProductCondition?,
      getProduct: fields[5] as ProductCondition?,
    );
  }

  @override
  void write(BinaryWriter writer, Conditions obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.bundleProducts)
      ..writeByte(1)
      ..write(obj.products)
      ..writeByte(2)
      ..write(obj.minQuantity)
      ..writeByte(3)
      ..write(obj.minTotal)
      ..writeByte(4)
      ..write(obj.buyProduct)
      ..writeByte(5)
      ..write(obj.getProduct);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConditionsAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class BundleProductAdapter extends TypeAdapter<BundleProduct> {
  @override
  final typeId = 27;

  @override
  BundleProduct read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return BundleProduct(
      product: fields[0] as ProductCondition,
      quantity: fields[1] == null ? 1 : (fields[1] as num?)?.toInt(),
      id: fields[2] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, BundleProduct obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.product)
      ..writeByte(1)
      ..write(obj.quantity)
      ..writeByte(2)
      ..write(obj.id);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BundleProductAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ProductConditionAdapter extends TypeAdapter<ProductCondition> {
  @override
  final typeId = 30;

  @override
  ProductCondition read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ProductCondition(id: fields[0] as String, name: fields[1] as String);
  }

  @override
  void write(BinaryWriter writer, ProductCondition obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductConditionAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ActiveHoursAdapter extends TypeAdapter<ActiveHours> {
  @override
  final typeId = 31;

  @override
  ActiveHours read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ActiveHours(
      isEnabled: fields[0] == null ? false : fields[0] as bool?,
      schedule: fields[1] == null ? [] : (fields[1] as List?)?.cast<Schedule>(),
    );
  }

  @override
  void write(BinaryWriter writer, ActiveHours obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.isEnabled)
      ..writeByte(1)
      ..write(obj.schedule);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ActiveHoursAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ScheduleAdapter extends TypeAdapter<Schedule> {
  @override
  final typeId = 32;

  @override
  Schedule read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Schedule(
      dayOfWeek: (fields[0] as num).toInt(),
      startTime: fields[1] as String,
      endTime: fields[2] as String,
      id: fields[3] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, Schedule obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.dayOfWeek)
      ..writeByte(1)
      ..write(obj.startTime)
      ..writeByte(2)
      ..write(obj.endTime)
      ..writeByte(3)
      ..write(obj.id);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScheduleAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class OutletAdapter extends TypeAdapter<Outlet> {
  @override
  final typeId = 33;

  @override
  Outlet read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Outlet(id: fields[0] as String, name: fields[1] as String);
  }

  @override
  void write(BinaryWriter writer, Outlet obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OutletAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AutoPromoModel _$AutoPromoModelFromJson(Map<String, dynamic> json) =>
    _AutoPromoModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      promoType: json['promoType'] as String,
      discount: (json['discount'] as num?)?.toInt() ?? 0,
      bundlePrice: (json['bundlePrice'] as num?)?.toInt() ?? 0,
      conditions:
          json['conditions'] == null
              ? null
              : Conditions.fromJson(json['conditions'] as Map<String, dynamic>),
      activeHours:
          json['activeHours'] == null
              ? null
              : ActiveHours.fromJson(
                json['activeHours'] as Map<String, dynamic>,
              ),
      outlet: Outlet.fromJson(json['outlet'] as Map<String, dynamic>),
      createdBy: json['createdBy'] as String,
      validFrom: DateTime.parse(json['validFrom'] as String),
      validTo: DateTime.parse(json['validTo'] as String),
      isActive: json['isActive'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$AutoPromoModelToJson(_AutoPromoModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'promoType': instance.promoType,
      'discount': instance.discount,
      'bundlePrice': instance.bundlePrice,
      'conditions': instance.conditions,
      'activeHours': instance.activeHours,
      'outlet': instance.outlet,
      'createdBy': instance.createdBy,
      'validFrom': instance.validFrom.toIso8601String(),
      'validTo': instance.validTo.toIso8601String(),
      'isActive': instance.isActive,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

_Conditions _$ConditionsFromJson(Map<String, dynamic> json) => _Conditions(
  bundleProducts:
      (json['bundleProducts'] as List<dynamic>?)
          ?.map((e) => BundleProduct.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  products:
      (json['products'] as List<dynamic>?)
          ?.map((e) => ProductCondition.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  minQuantity: (json['minQuantity'] as num?)?.toInt() ?? 0,
  minTotal: (json['minTotal'] as num?)?.toInt() ?? 0,
  buyProduct:
      json['buyProduct'] == null
          ? null
          : ProductCondition.fromJson(
            json['buyProduct'] as Map<String, dynamic>,
          ),
  getProduct:
      json['getProduct'] == null
          ? null
          : ProductCondition.fromJson(
            json['getProduct'] as Map<String, dynamic>,
          ),
);

Map<String, dynamic> _$ConditionsToJson(_Conditions instance) =>
    <String, dynamic>{
      'bundleProducts': instance.bundleProducts,
      'products': instance.products,
      'minQuantity': instance.minQuantity,
      'minTotal': instance.minTotal,
      'buyProduct': instance.buyProduct,
      'getProduct': instance.getProduct,
    };

_BundleProduct _$BundleProductFromJson(Map<String, dynamic> json) =>
    _BundleProduct(
      product: ProductCondition.fromJson(
        json['product'] as Map<String, dynamic>,
      ),
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      id: json['_id'] as String?,
    );

Map<String, dynamic> _$BundleProductToJson(_BundleProduct instance) =>
    <String, dynamic>{
      'product': instance.product,
      'quantity': instance.quantity,
      '_id': instance.id,
    };

_ProductCondition _$ProductConditionFromJson(Map<String, dynamic> json) =>
    _ProductCondition(id: json['_id'] as String, name: json['name'] as String);

Map<String, dynamic> _$ProductConditionToJson(_ProductCondition instance) =>
    <String, dynamic>{'_id': instance.id, 'name': instance.name};

_ActiveHours _$ActiveHoursFromJson(Map<String, dynamic> json) => _ActiveHours(
  isEnabled: json['isEnabled'] as bool? ?? false,
  schedule:
      (json['schedule'] as List<dynamic>?)
          ?.map((e) => Schedule.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$ActiveHoursToJson(_ActiveHours instance) =>
    <String, dynamic>{
      'isEnabled': instance.isEnabled,
      'schedule': instance.schedule,
    };

_Schedule _$ScheduleFromJson(Map<String, dynamic> json) => _Schedule(
  dayOfWeek: (json['dayOfWeek'] as num).toInt(),
  startTime: json['startTime'] as String,
  endTime: json['endTime'] as String,
  id: json['_id'] as String?,
);

Map<String, dynamic> _$ScheduleToJson(_Schedule instance) => <String, dynamic>{
  'dayOfWeek': instance.dayOfWeek,
  'startTime': instance.startTime,
  'endTime': instance.endTime,
  '_id': instance.id,
};

_Outlet _$OutletFromJson(Map<String, dynamic> json) =>
    _Outlet(id: json['_id'] as String, name: json['name'] as String);

Map<String, dynamic> _$OutletToJson(_Outlet instance) => <String, dynamic>{
  '_id': instance.id,
  'name': instance.name,
};
