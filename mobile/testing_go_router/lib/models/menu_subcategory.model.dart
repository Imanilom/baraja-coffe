// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'menu_subcategory.model.g.dart';
part 'menu_subcategory.model.freezed.dart';

@freezed
@HiveType(typeId: 16)
abstract class MenuSubCategoryModel with _$MenuSubCategoryModel {
  factory MenuSubCategoryModel({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
  }) = _MenuSubCategoryModel;

  factory MenuSubCategoryModel.fromJson(Map<String, dynamic> json) =>
      _$MenuSubCategoryModelFromJson(json);
}
