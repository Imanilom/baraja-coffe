// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'outlet_info.model.g.dart';
part 'outlet_info.model.freezed.dart';

@freezed
@HiveType(typeId: 23)
abstract class OutletInfoModel with _$OutletInfoModel {
  const factory OutletInfoModel({
    @HiveField(0) @JsonKey(name: '_id') String? id,
    @HiveField(1) @Default(null) String? name,
    @HiveField(2) @Default(null) String? address,
    @HiveField(3) @Default(null) String? city,
    @HiveField(4) @Default(null) String? contactNumber,
  }) = _OutletInfoModel;

  factory OutletInfoModel.fromJson(Map<String, dynamic> json) =>
      _$OutletInfoModelFromJson(json);
}
