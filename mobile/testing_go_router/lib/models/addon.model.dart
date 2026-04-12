// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import 'addon_option.model.dart';

part 'addon.model.freezed.dart';
part 'addon.model.g.dart';

@freezed
@HiveType(typeId: 1)
abstract class AddonModel with _$AddonModel {
  factory AddonModel({
    @HiveField(0) String? id,
    @HiveField(1) String? name,
    @HiveField(2) String? type,
    @HiveField(3) List<AddonOptionModel>? options,
  }) = _AddonModel;

  factory AddonModel.fromJson(Map<String, dynamic> json) =>
      _$AddonModelFromJson(json);
}
