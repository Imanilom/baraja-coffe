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
      discount: fields[3] == null ? 0 : (fields[3] as num).toInt(),
      bundlePrice: (fields[4] as num?)?.toInt(),
      conditions: fields[5] as PromoConditionsModel,
      activeHours: fields[6] as ActiveHoursModel,
      validFrom: fields[7] as DateTime,
      validTo: fields[8] as DateTime,
      isActive: fields[9] == null ? false : fields[9] as bool,
      consumerType: fields[10] as String?,
      outlet: fields[11] as OutletModel?,
    );
  }

  @override
  void write(BinaryWriter writer, AutoPromoModel obj) {
    writer
      ..writeByte(12)
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
      ..write(obj.validFrom)
      ..writeByte(8)
      ..write(obj.validTo)
      ..writeByte(9)
      ..write(obj.isActive)
      ..writeByte(10)
      ..write(obj.consumerType)
      ..writeByte(11)
      ..write(obj.outlet);
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

class PromoConditionsModelAdapter extends TypeAdapter<PromoConditionsModel> {
  @override
  final typeId = 12;

  @override
  PromoConditionsModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PromoConditionsModel(
      products:
          fields[0] == null
              ? []
              : (fields[0] as List).cast<PromoProductModel>(),
      bundleProducts:
          fields[1] == null
              ? []
              : (fields[1] as List).cast<BundleProductModel>(),
      minQuantity: (fields[2] as num?)?.toInt(),
      minTotal: (fields[3] as num?)?.toInt(),
      buyProduct: fields[4] as PromoProductModel?,
      getProduct: fields[5] as PromoProductModel?,
    );
  }

  @override
  void write(BinaryWriter writer, PromoConditionsModel obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.products)
      ..writeByte(1)
      ..write(obj.bundleProducts)
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
      other is PromoConditionsModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class BundleProductModelAdapter extends TypeAdapter<BundleProductModel> {
  @override
  final typeId = 27;

  @override
  BundleProductModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return BundleProductModel(
      id: fields[0] as String?,
      product: fields[1] as PromoProductModel,
      quantity: (fields[2] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, BundleProductModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.product)
      ..writeByte(2)
      ..write(obj.quantity);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BundleProductModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class PromoProductModelAdapter extends TypeAdapter<PromoProductModel> {
  @override
  final typeId = 30;

  @override
  PromoProductModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PromoProductModel(
      id: fields[0] as String,
      name: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, PromoProductModel obj) {
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
      other is PromoProductModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ActiveHoursModelAdapter extends TypeAdapter<ActiveHoursModel> {
  @override
  final typeId = 31;

  @override
  ActiveHoursModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ActiveHoursModel(
      isEnabled: fields[0] == null ? false : fields[0] as bool,
      schedule:
          fields[1] == null ? [] : (fields[1] as List).cast<ScheduleModel>(),
    );
  }

  @override
  void write(BinaryWriter writer, ActiveHoursModel obj) {
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
      other is ActiveHoursModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ScheduleModelAdapter extends TypeAdapter<ScheduleModel> {
  @override
  final typeId = 32;

  @override
  ScheduleModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ScheduleModel(
      id: fields[0] as String?,
      dayOfWeek: (fields[1] as num).toInt(),
      startTime: fields[2] as String,
      endTime: fields[3] as String,
    );
  }

  @override
  void write(BinaryWriter writer, ScheduleModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.dayOfWeek)
      ..writeByte(2)
      ..write(obj.startTime)
      ..writeByte(3)
      ..write(obj.endTime);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScheduleModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class OutletModelAdapter extends TypeAdapter<OutletModel> {
  @override
  final typeId = 33;

  @override
  OutletModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OutletModel(id: fields[0] as String, name: fields[1] as String);
  }

  @override
  void write(BinaryWriter writer, OutletModel obj) {
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
      other is OutletModelAdapter &&
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
      bundlePrice: (json['bundlePrice'] as num?)?.toInt(),
      conditions: PromoConditionsModel.fromJson(
        json['conditions'] as Map<String, dynamic>,
      ),
      activeHours: ActiveHoursModel.fromJson(
        json['activeHours'] as Map<String, dynamic>,
      ),
      validFrom: DateTime.parse(json['validFrom'] as String),
      validTo: DateTime.parse(json['validTo'] as String),
      isActive: json['isActive'] as bool? ?? false,
      consumerType: json['consumerType'] as String?,
      outlet:
          json['outlet'] == null
              ? null
              : OutletModel.fromJson(json['outlet'] as Map<String, dynamic>),
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
      'validFrom': instance.validFrom.toIso8601String(),
      'validTo': instance.validTo.toIso8601String(),
      'isActive': instance.isActive,
      'consumerType': instance.consumerType,
      'outlet': instance.outlet,
    };

_PromoConditionsModel _$PromoConditionsModelFromJson(
  Map<String, dynamic> json,
) => _PromoConditionsModel(
  products:
      (json['products'] as List<dynamic>?)
          ?.map((e) => PromoProductModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  bundleProducts:
      (json['bundleProducts'] as List<dynamic>?)
          ?.map((e) => BundleProductModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  minQuantity: (json['minQuantity'] as num?)?.toInt(),
  minTotal: (json['minTotal'] as num?)?.toInt(),
  buyProduct:
      json['buyProduct'] == null
          ? null
          : PromoProductModel.fromJson(
            json['buyProduct'] as Map<String, dynamic>,
          ),
  getProduct:
      json['getProduct'] == null
          ? null
          : PromoProductModel.fromJson(
            json['getProduct'] as Map<String, dynamic>,
          ),
);

Map<String, dynamic> _$PromoConditionsModelToJson(
  _PromoConditionsModel instance,
) => <String, dynamic>{
  'products': instance.products,
  'bundleProducts': instance.bundleProducts,
  'minQuantity': instance.minQuantity,
  'minTotal': instance.minTotal,
  'buyProduct': instance.buyProduct,
  'getProduct': instance.getProduct,
};

_BundleProductModel _$BundleProductModelFromJson(Map<String, dynamic> json) =>
    _BundleProductModel(
      id: json['_id'] as String?,
      product: PromoProductModel.fromJson(
        json['product'] as Map<String, dynamic>,
      ),
      quantity: (json['quantity'] as num).toInt(),
    );

Map<String, dynamic> _$BundleProductModelToJson(_BundleProductModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'product': instance.product,
      'quantity': instance.quantity,
    };

_PromoProductModel _$PromoProductModelFromJson(Map<String, dynamic> json) =>
    _PromoProductModel(id: json['_id'] as String, name: json['name'] as String);

Map<String, dynamic> _$PromoProductModelToJson(_PromoProductModel instance) =>
    <String, dynamic>{'_id': instance.id, 'name': instance.name};

_ActiveHoursModel _$ActiveHoursModelFromJson(Map<String, dynamic> json) =>
    _ActiveHoursModel(
      isEnabled: json['isEnabled'] as bool? ?? false,
      schedule:
          (json['schedule'] as List<dynamic>?)
              ?.map((e) => ScheduleModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$ActiveHoursModelToJson(_ActiveHoursModel instance) =>
    <String, dynamic>{
      'isEnabled': instance.isEnabled,
      'schedule': instance.schedule,
    };

_ScheduleModel _$ScheduleModelFromJson(Map<String, dynamic> json) =>
    _ScheduleModel(
      id: json['_id'] as String?,
      dayOfWeek: (json['dayOfWeek'] as num).toInt(),
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
    );

Map<String, dynamic> _$ScheduleModelToJson(_ScheduleModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'dayOfWeek': instance.dayOfWeek,
      'startTime': instance.startTime,
      'endTime': instance.endTime,
    };

_OutletModel _$OutletModelFromJson(Map<String, dynamic> json) =>
    _OutletModel(id: json['_id'] as String, name: json['name'] as String);

Map<String, dynamic> _$OutletModelToJson(_OutletModel instance) =>
    <String, dynamic>{'_id': instance.id, 'name': instance.name};
