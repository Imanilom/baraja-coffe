// payment_method.model.dart

// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';

part 'payment_method.model.freezed.dart';
part 'payment_method.model.g.dart';

@freezed
@HiveType(typeId: 21)
abstract class PaymentMethodModel with _$PaymentMethodModel {
  const factory PaymentMethodModel({
    @HiveField(0) required String id, // cash, ewallet, debit, ...
    @HiveField(1) required String name, // Cash, E-Wallet, Debit, ...
    @HiveField(2) required String icon,
    @HiveField(3) required bool isActive,

    /// List type / channel di bawah method ini
    @HiveField(4)
    @Default(<PaymentTypeModel>[])
    List<PaymentTypeModel> paymentTypes,
  }) = _PaymentMethodModel;

  factory PaymentMethodModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentMethodModelFromJson(json);
}
