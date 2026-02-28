// payment_type.model.dart
// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'payment_type.model.freezed.dart';
part 'payment_type.model.g.dart';

@freezed
@HiveType(typeId: 22)
abstract class PaymentTypeModel with _$PaymentTypeModel {
  const factory PaymentTypeModel({
    @HiveField(0) required String id,
    @HiveField(1) required String name,

    /// Kode method aslinya, misal: "Cash", "Gopay", "BNI"
    @HiveField(2) required String typeCode,

    /// Method mana saja yang boleh pakai type ini
    @HiveField(3) required List<String> methodIds,

    @HiveField(4) required bool isDigital,
    @HiveField(5) required bool isActive,
  }) = _PaymentTypeModel;

  factory PaymentTypeModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentTypeModelFromJson(json);
}
