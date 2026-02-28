import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'payment_action.model.freezed.dart';
part 'payment_action.model.g.dart';

@freezed
@HiveType(typeId: 18) // Pastikan typeId unik
abstract class PaymentActionModel with _$PaymentActionModel {
  factory PaymentActionModel({
    @HiveField(0) @Default(null) String? name,
    @HiveField(1) @Default(null) String? method,
    @HiveField(2) @Default(null) String? url,
  }) = _PaymentActionModel;

  factory PaymentActionModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentActionModelFromJson(json);
}
