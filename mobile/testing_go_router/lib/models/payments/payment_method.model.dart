// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'payment_method.model.freezed.dart';
part 'payment_method.model.g.dart';

@freezed
@HiveType(typeId: 21)
abstract class PaymentMethodModel with _$PaymentMethodModel {
  const factory PaymentMethodModel({
    @HiveField(0) required String id,
    @HiveField(1) required String name,
    @HiveField(2) @JsonKey(name: 'payment_method') required String methodCode,
    @HiveField(3) required List<String> typeId,
    @HiveField(4) required bool isDigital,
    @HiveField(5) required bool isActive,
  }) = _PaymentMethodModel;

  factory PaymentMethodModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentMethodModelFromJson(json);
}
