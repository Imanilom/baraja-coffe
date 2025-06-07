// lib/models/saved_printer_model.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'bluetooth_printer.model.freezed.dart';
part 'bluetooth_printer.model.g.dart';

@freezed
@HiveType(typeId: 13)
abstract class BluetoothPrinterModel with _$BluetoothPrinterModel {
  factory BluetoothPrinterModel({
    @HiveField(0) required String name,
    @HiveField(1) required String address, //mac or ip
    @HiveField(2) String? connectionType, // 'wifi' or 'bluetooth'
    @HiveField(3) @Default(false) bool isKitchenPrinter,
    @HiveField(4) @Default(true) bool isBarPrinter,
    @HiveField(5) @Default('mm58') String paperSize,
    @HiveField(6) @Default(1) int kitchenCopies,
    @HiveField(7) @Default(1) int barCopies,
  }) = _BluetoothPrinterModel;

  factory BluetoothPrinterModel.fromJson(Map<String, dynamic> json) =>
      _$BluetoothPrinterModelFromJson(json);
}
