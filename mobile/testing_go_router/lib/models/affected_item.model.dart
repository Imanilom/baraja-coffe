// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'affected_item.model.freezed.dart';
part 'affected_item.model.g.dart';

@freezed
@HiveType(typeId: 10)
abstract class AffectedItemModel with _$AffectedItemModel {
  factory AffectedItemModel({
    @HiveField(0) required String menuItem,
    @HiveField(1) required String menuItemName,
    @HiveField(2) @Default(0) int? quantity,
    @HiveField(3) @Default(0) int? originalSubtotal,
    @HiveField(4) @Default(0) int? discountAmount,
    @HiveField(5) @Default(0) int? discountedSubtotal,
    @HiveField(6) @Default(0) int? discountPercentage,
    @HiveField(7) @Default(null) @JsonKey(name: '_id') String? id,
  }) = _AffectedItemModel;

  factory AffectedItemModel.fromJson(Map<String, dynamic> json) =>
      _$AffectedItemModelFromJson(json);
}
