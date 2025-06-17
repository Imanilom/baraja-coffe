// lib/models/saved_printer_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'saved_printer.model.freezed.dart';
part 'saved_printer.model.g.dart';

@freezed
@HiveType(typeId: 13)
abstract class SavedPrinterModel with _$SavedPrinterModel {
  factory SavedPrinterModel({
    @HiveField(0) required String name,
    @HiveField(1) required String id, // device.id.id
    @HiveField(2) required String role, // e.g., 'bar' or 'dapur'
  }) = _SavedPrinterModel;

  factory SavedPrinterModel.fromJson(Map<String, dynamic> json) =>
      _$SavedPrinterModelFromJson(json);
}
