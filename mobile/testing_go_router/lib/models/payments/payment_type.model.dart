import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';

part 'payment_type.model.freezed.dart';
part 'payment_type.model.g.dart';

@freezed
@HiveType(typeId: 22)
abstract class PaymentTypeModel with _$PaymentTypeModel {
  const factory PaymentTypeModel({
    @HiveField(0) required String id,
    @HiveField(1) required String name,
    @HiveField(2) required String icon,
    @HiveField(3) required bool isActive,
    @HiveField(4) required List<PaymentMethodModel> paymentMethods,
  }) = _PaymentTypeModel;

  factory PaymentTypeModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentTypeModelFromJson(json);
}
