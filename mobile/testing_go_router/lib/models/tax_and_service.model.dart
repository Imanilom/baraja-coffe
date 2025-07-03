// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'tax_and_service.model.g.dart';
part 'tax_and_service.model.freezed.dart';

@freezed
@HiveType(typeId: 14)
abstract class TaxAndServiceModel with _$TaxAndServiceModel {
  const factory TaxAndServiceModel({
    @HiveField(0) @JsonKey(name: '_id') String? id,
    @HiveField(1) String? type, //example: "PPN" or "PPh"
    @HiveField(2) String? name,
    @HiveField(3) @Default('') String? description,
    @HiveField(4) @Default(0) int? percentage, //example: 10 for 10%
    @HiveField(5) @Default(0) int? fixedFee,
    @HiveField(6) bool? isActive,
  }) = _TaxAndServiceModel;

  factory TaxAndServiceModel.fromJson(Map<String, dynamic> json) =>
      _$TaxAndServiceModelFromJson(json);
}
