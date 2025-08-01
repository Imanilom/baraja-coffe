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
    @HiveField(2) String? connectionType, // 'network' or 'bluetooth'
    @HiveField(3) @Default('mm58') String paperSize,
    @HiveField(4) @Default(true) bool canPrintCustomer,
    @HiveField(5) @Default(false) bool canPrintKitchen,
    @HiveField(6) @Default(false) bool canPrintBar,
    @HiveField(7) @Default(false) bool canPrintWaiter,
    @HiveField(8) @Default(1) int customerCopies,
    @HiveField(9) @Default(1) int kitchenCopies,
    @HiveField(10) @Default(1) int barCopies,
    @HiveField(11) @Default(1) int waiterCopies,
    @HiveField(12) int? port, //for LAN printers
  }) = _BluetoothPrinterModel;

  factory BluetoothPrinterModel.fromJson(Map<String, dynamic> json) =>
      _$BluetoothPrinterModelFromJson(json);
}
