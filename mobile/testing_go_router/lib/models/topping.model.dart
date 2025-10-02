// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'topping.model.g.dart';
part 'topping.model.freezed.dart';

@freezed
@HiveType(typeId: 2)
abstract class ToppingModel with _$ToppingModel {
  const factory ToppingModel({
    @HiveField(0) @JsonKey(name: '_id') String? id,
    @HiveField(1) String? name,
    @HiveField(2) int? price,
  }) = _ToppingModel;

  factory ToppingModel.fromJson(Map<String, dynamic> json) =>
      _$ToppingModelFromJson(json);
}
