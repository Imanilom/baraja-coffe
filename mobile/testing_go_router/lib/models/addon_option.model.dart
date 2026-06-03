// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'addon_option.model.g.dart';
part 'addon_option.model.freezed.dart';

@freezed
@HiveType(typeId: 0)
abstract class AddonOptionModel with _$AddonOptionModel {
  factory AddonOptionModel({
    @HiveField(0) String? id,
    @HiveField(1) String? label,
    @HiveField(2) bool? isDefault,
    @HiveField(3) int? price,
  }) = _AddonOptionModel;

  factory AddonOptionModel.fromJson(Map<String, dynamic> json) =>
      _$AddonOptionModelFromJson(json);
}
