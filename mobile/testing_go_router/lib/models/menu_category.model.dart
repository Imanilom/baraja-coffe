// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'menu_category.model.g.dart';
part 'menu_category.model.freezed.dart';

@freezed
@HiveType(typeId: 15)
abstract class MenuCategoryModel with _$MenuCategoryModel {
  factory MenuCategoryModel({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
  }) = _MenuCategoryModel;

  factory MenuCategoryModel.fromJson(Map<String, dynamic> json) =>
      _$MenuCategoryModelFromJson(json);
}
