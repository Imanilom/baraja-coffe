// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'free_item.model.freezed.dart';
part 'free_item.model.g.dart';

@freezed
@HiveType(typeId: 10)
abstract class FreeItemModel with _$FreeItemModel {
  factory FreeItemModel({
    // Sesuaikan fields sesuai dengan struktur freeItemModels yang sebenarnya
    @HiveField(0) required String menuItem,
    @HiveField(1) required String menuItemName,
    @HiveField(2) required int quantity,
    @HiveField(3) required String id,
  }) = _FreeItemModel;

  factory FreeItemModel.fromJson(Map<String, dynamic> json) =>
      _$FreeItemModelFromJson(json);
}
