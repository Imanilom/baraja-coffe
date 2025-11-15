import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'menu_stock.model.g.dart';
part 'menu_stock.model.freezed.dart';

@freezed
@HiveType(typeId: 29)
abstract class MenuStockModel with _$MenuStockModel {
  factory MenuStockModel({
    @HiveField(0) @Default(0) int? calculatedStock,
    @HiveField(1) @Default(0) int? manualStock,
    @HiveField(2) @Default(0) int? effectiveStock,
    @HiveField(3) @Default(0) int? currentStock,
    @HiveField(4) @Default(false) bool? isAvailable,
    @HiveField(5) @Default(null) String? lastCalculatedAt,
    @HiveField(6) @Default(null) String? lastAdjustedAt,
  }) = _MenuStockModel;

  factory MenuStockModel.fromJson(Map<String, dynamic> json) =>
      _$MenuStockModelFromJson(json);
}
