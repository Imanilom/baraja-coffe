// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'auto_promo.model.freezed.dart';
part 'auto_promo.model.g.dart';

@freezed
@HiveType(typeId: 11)
abstract class AutoPromoModel with _$AutoPromoModel {
  factory AutoPromoModel({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
    @HiveField(2) required String promoType,
    @HiveField(3) @Default(0) int discount,
    @HiveField(4) int? bundlePrice,
    @HiveField(5) required PromoConditionsModel conditions,
    @HiveField(6) required ActiveHoursModel activeHours,
    @HiveField(7) required DateTime validFrom,
    @HiveField(8) required DateTime validTo,
    @HiveField(9) @Default(false) bool isActive,
    @HiveField(10) String? consumerType,
    @HiveField(11) OutletModel? outlet,
  }) = _AutoPromoModel;

  factory AutoPromoModel.fromJson(Map<String, dynamic> json) =>
      _$AutoPromoModelFromJson(json);
}

@freezed
@HiveType(typeId: 12)
abstract class PromoConditionsModel with _$PromoConditionsModel {
  factory PromoConditionsModel({
    @HiveField(0) @Default([]) List<PromoProductModel> products,
    @HiveField(1) @Default([]) List<BundleProductModel> bundleProducts,
    @HiveField(2) int? minQuantity, // untuk discount_on_quantity
    @HiveField(3) int? minTotal, // untuk discount_on_total
    @HiveField(4) PromoProductModel? buyProduct, // untuk buy_x_get_y
    @HiveField(5) PromoProductModel? getProduct, // untuk buy_x_get_y
  }) = _PromoConditionsModel;

  factory PromoConditionsModel.fromJson(Map<String, dynamic> json) =>
      _$PromoConditionsModelFromJson(json);
}

@freezed
@HiveType(typeId: 27)
abstract class BundleProductModel with _$BundleProductModel {
  factory BundleProductModel({
    @HiveField(0) @JsonKey(name: '_id') String? id,
    @HiveField(1) required PromoProductModel product,
    @HiveField(2) required int quantity,
  }) = _BundleProductModel;

  factory BundleProductModel.fromJson(Map<String, dynamic> json) =>
      _$BundleProductModelFromJson(json);
}

@freezed
@HiveType(typeId: 30)
abstract class PromoProductModel with _$PromoProductModel {
  factory PromoProductModel({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
  }) = _PromoProductModel;

  factory PromoProductModel.fromJson(Map<String, dynamic> json) =>
      _$PromoProductModelFromJson(json);
}

@freezed
@HiveType(typeId: 31)
abstract class ActiveHoursModel with _$ActiveHoursModel {
  factory ActiveHoursModel({
    @HiveField(0) @Default(false) bool isEnabled,
    @HiveField(1) @Default([]) List<ScheduleModel> schedule,
  }) = _ActiveHoursModel;

  factory ActiveHoursModel.fromJson(Map<String, dynamic> json) =>
      _$ActiveHoursModelFromJson(json);
}

@freezed
@HiveType(typeId: 32)
abstract class ScheduleModel with _$ScheduleModel {
  factory ScheduleModel({
    @HiveField(0) @JsonKey(name: '_id') String? id,
    @HiveField(1) required int dayOfWeek, // 0=Minggu, 6=Sabtu
    @HiveField(2) required String startTime, // format "HH:mm"
    @HiveField(3) required String endTime,
  }) = _ScheduleModel;

  factory ScheduleModel.fromJson(Map<String, dynamic> json) =>
      _$ScheduleModelFromJson(json);
}

@freezed
@HiveType(typeId: 33)
abstract class OutletModel with _$OutletModel {
  factory OutletModel({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
  }) = _OutletModel;

  factory OutletModel.fromJson(Map<String, dynamic> json) =>
      _$OutletModelFromJson(json);
}
