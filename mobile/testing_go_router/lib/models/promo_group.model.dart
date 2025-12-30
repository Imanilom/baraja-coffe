// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'promo_group.model.freezed.dart';
part 'promo_group.model.g.dart';

@freezed
@HiveType(typeId: 35) // Pastikan typeId unik, tidak bentrok dengan model lain
abstract class PromoGroupModel with _$PromoGroupModel {
  @HiveField(0)
  const factory PromoGroupModel({
    @HiveField(1) required String promoId,
    @HiveField(2) required String title,
    @HiveField(3) required String subtitle,
    @HiveField(4) required String promoType, // bundling | buy_x_get_y
    @HiveField(5) required List<PromoGroupLine> lines,
    @HiveField(6) @Default(1) int times,
  }) = _PromoGroupModel;

  factory PromoGroupModel.fromJson(Map<String, dynamic> json) =>
      _$PromoGroupModelFromJson(json);
}

@freezed
@HiveType(typeId: 36) // TypeId berbeda untuk model yang berbeda
abstract class PromoGroupLine with _$PromoGroupLine {
  @HiveField(0)
  const factory PromoGroupLine({
    @HiveField(1) required String menuItemId,
    @HiveField(2) required int qty,
  }) = _PromoGroupLine;

  factory PromoGroupLine.fromJson(Map<String, dynamic> json) =>
      _$PromoGroupLineFromJson(json);
}
