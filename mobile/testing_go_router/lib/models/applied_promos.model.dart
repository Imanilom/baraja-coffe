// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/affected_item.model.dart';
import 'package:kasirbaraja/models/free_item.model.dart';

part 'applied_promos.model.freezed.dart';
part 'applied_promos.model.g.dart';

@freezed
@HiveType(typeId: 8) // Pastikan typeId unik dan belum digunakan
abstract class AppliedPromosModel with _$AppliedPromosModel {
  factory AppliedPromosModel({
    @HiveField(0) required String promoId,
    @HiveField(1) required String promoName,
    @HiveField(2) required String promoType,
    @HiveField(3) @Default(0) int? discount,
    @HiveField(4) @Default([]) List<AffectedItemModel> affectedItems,
    @HiveField(5) @Default([]) List<FreeItemModel> freeItems,
    @HiveField(6) @Default(null) @JsonKey(name: '_id') String? id,
    @HiveField(7) @Default(1) int? appliedCount,
    @HiveField(8) @Default(1) int? bundleSets,
  }) = _AppliedPromosModel;

  factory AppliedPromosModel.fromJson(Map<String, dynamic> json) =>
      _$AppliedPromosModelFromJson(json);
}
