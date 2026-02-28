import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'tax_service_detail.model.freezed.dart';
part 'tax_service_detail.model.g.dart';

@freezed
@HiveType(typeId: 17)
abstract class TaxServiceDetailModel with _$TaxServiceDetailModel {
  factory TaxServiceDetailModel({
    @HiveField(0) required String type,
    @HiveField(1) String? name,
    @HiveField(2) required double amount,
  }) = _TaxServiceDetailModel;

  factory TaxServiceDetailModel.fromJson(Map<String, dynamic> json) =>
      _$TaxServiceDetailModelFromJson(json);
}
