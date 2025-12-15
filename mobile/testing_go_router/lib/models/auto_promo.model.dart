// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'auto_promo.model.freezed.dart';
part 'auto_promo.model.g.dart';

@freezed
@HiveType(typeId: 11)
abstract class AutoPromoModel with _$AutoPromoModel {
  const factory AutoPromoModel({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
    @HiveField(2) required String promoType,
    @HiveField(3) @Default(0) int? discount,
    @HiveField(4) @Default(0) int? bundlePrice,
    @HiveField(5) @Default(null) Conditions? conditions,
    @HiveField(6) @Default(null) ActiveHours? activeHours,
    @HiveField(7) required Outlet outlet,
    @HiveField(8) required String createdBy,
    @HiveField(9) required DateTime validFrom,
    @HiveField(10) required DateTime validTo,
    @HiveField(11) @Default(false) bool? isActive,
    @HiveField(12) required DateTime createdAt,
    @HiveField(13) required DateTime updatedAt,
  }) = _AutoPromoModel;

  factory AutoPromoModel.fromJson(Map<String, dynamic> json) =>
      _$AutoPromoModelFromJson(json);
}

@freezed
@HiveType(typeId: 12)
abstract class Conditions with _$Conditions {
  const factory Conditions({
    @HiveField(0) @Default([]) List<BundleProduct>? bundleProducts,
    @HiveField(1) @Default([]) List<ProductCondition>? products,
    @HiveField(2) @Default(0) int? minQuantity,
    @HiveField(3) @Default(0) int? minTotal,
    @HiveField(4) ProductCondition? buyProduct,
    @HiveField(5) ProductCondition? getProduct,
  }) = _Conditions;

  factory Conditions.fromJson(Map<String, dynamic> json) =>
      _$ConditionsFromJson(json);
}

@freezed
@HiveType(typeId: 27)
abstract class BundleProduct with _$BundleProduct {
  const factory BundleProduct({
    @HiveField(0) required ProductCondition product,
    @HiveField(1) @Default(1) int? quantity,
    @HiveField(2) @JsonKey(name: '_id') String? id,
  }) = _BundleProduct;

  factory BundleProduct.fromJson(Map<String, dynamic> json) =>
      _$BundleProductFromJson(json);
}

@freezed
@HiveType(typeId: 30)
abstract class ProductCondition with _$ProductCondition {
  const factory ProductCondition({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
  }) = _ProductCondition;

  factory ProductCondition.fromJson(Map<String, dynamic> json) =>
      _$ProductConditionFromJson(json);
}

@freezed
@HiveType(typeId: 31)
abstract class ActiveHours with _$ActiveHours {
  const factory ActiveHours({
    @HiveField(0) @Default(false) bool? isEnabled,
    @HiveField(1) @Default([]) List<Schedule>? schedule,
  }) = _ActiveHours;

  factory ActiveHours.fromJson(Map<String, dynamic> json) =>
      _$ActiveHoursFromJson(json);
}

@freezed
@HiveType(typeId: 32)
abstract class Schedule with _$Schedule {
  const factory Schedule({
    @HiveField(0) required int dayOfWeek,
    @HiveField(1) required String startTime,
    @HiveField(2) required String endTime,
    @HiveField(3) @JsonKey(name: '_id') String? id,
  }) = _Schedule;

  factory Schedule.fromJson(Map<String, dynamic> json) =>
      _$ScheduleFromJson(json);
}

@freezed
@HiveType(typeId: 33)
abstract class Outlet with _$Outlet {
  const factory Outlet({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
  }) = _Outlet;

  factory Outlet.fromJson(Map<String, dynamic> json) => _$OutletFromJson(json);
}
