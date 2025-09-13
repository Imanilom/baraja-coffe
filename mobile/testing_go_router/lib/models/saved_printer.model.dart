// // lib/models/saved_printer_model.dart
// import 'package:freezed_annotation/freezed_annotation.dart';
// import 'package:hive_ce/hive.dart';

// part 'saved_printer.model.freezed.dart';
// part 'saved_printer.model.g.dart';

// @freezed
// @HiveType(typeId: 13)
// abstract class SavedPrinterrModel with _$SavedPrinterModel {
//   factory SavedPrinterrModel({
//     @HiveField(0) required String name,
//     @HiveField(1) required String id, // device.id.id
//     @HiveField(2) required String role, // e.g., 'bar' or 'dapur'
//     @HiveField(3) required String serviceUUID,
//     @HiveField(4) required String characteristicUUID,
//   }) = _SavedPrinterrModel;

//   factory SavedPrinterrModel.fromJson(Map<String, dynamic> json) =>
//       _$SavedPrinterrModelFromJson(json);
// }
