// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'applied_promos.model.freezed.dart';
part 'applied_promos.model.g.dart';

@freezed
@HiveType(typeId: 8) // Pastikan typeId unik dan belum digunakan
abstract class AppliedPromosModel with _$AppliedPromosModel {
  factory AppliedPromosModel({
    @HiveField(0) required String promoId,
    @HiveField(1) required String promoName,
    @HiveField(2) required String promoType,
    @HiveField(3) required int discount,
    @HiveField(4) @Default([]) List<AffectedItem> affectedItems,
    @HiveField(5) @Default([]) List<FreeItem> freeItems,
    @HiveField(6) required String id,
  }) = _AppliedPromosModel;

  factory AppliedPromosModel.fromJson(Map<String, dynamic> json) =>
      _$AppliedPromosModelFromJson(json);
}

@freezed
@HiveType(typeId: 10) // Pastikan typeId unik dan belum digunakan
abstract class AffectedItem with _$AffectedItem {
  factory AffectedItem({
    @HiveField(0) required String menuItem,
    @HiveField(1) required String menuItemName,
    @HiveField(2) required int quantity,
    @HiveField(3) required int originalSubtotal,
    @HiveField(4) required int discountAmount,
    @HiveField(5) required int discountedSubtotal,
    @HiveField(6) required int discountPercentage,
    @HiveField(7) required String id,
  }) = _AffectedItem;

  factory AffectedItem.fromJson(Map<String, dynamic> json) =>
      _$AffectedItemFromJson(json);
}

@freezed
@HiveField(typeId: 11) // Pastikan typeId unik dan belum digunakan
abstract class FreeItem with _$FreeItem {
  factory FreeItem({
    // Sesuaikan fields sesuai dengan struktur freeItems yang sebenarnya
    @HiveField(0) required String menuItem,
    @HiveField(1) required String menuItemName,
    @HiveField(2) required int quantity,
    @HiveField(3) required String id,
  }) = _FreeItem;

  factory FreeItem.fromJson(Map<String, dynamic> json) =>
      _$FreeItemFromJson(json);
}
