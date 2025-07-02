import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/printer_service.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:hive_ce/hive.dart';
import 'package:permission_handler/permission_handler.dart';

// 1. Provider untuk Hive
final printerBoxProvider = Provider<Box<BluetoothPrinterModel>>((ref) {
  throw UnimplementedError('Harus di override di main.dart');
});

// 2. Provider untuk printer tersimpan
final savedPrintersProvider =
    NotifierProvider<SavedPrintersNotifier, List<BluetoothPrinterModel>>(() {
      return SavedPrintersNotifier();
    });

class SavedPrintersNotifier extends Notifier<List<BluetoothPrinterModel>> {
  @override
  List<BluetoothPrinterModel> build() {
    return ref
        .watch(printerBoxProvider)
        .values
        .toList()
        .cast<BluetoothPrinterModel>();
  }

  //update data printer
  Future<void> updatePrinter(BluetoothPrinterModel printer) async {
    final box = ref.read(printerBoxProvider);
    await box.put(printer.address, printer);
    state = box.values.toList().cast<BluetoothPrinterModel>();
  }

  //get printer by id
  Future<BluetoothPrinterModel?> getPrinterById(String id) async {
    return ref.watch(printerBoxProvider).get(id);
  }

  //print to printer
  Future<void> printToPrinter(
    OrderDetailModel orderDetail,
    String printType,
  ) async {
    if (state.isEmpty || printType.isEmpty) {
      print('No printers available to print.');
      return;
    }

    await PrinterService.printDocuments(
      orderDetail: orderDetail,
      printType: printType,
      printers: state,
    );

    // if (printType == 'all') {
    //   // Print to all printers
    //   for (var printer in state) {
    //     if (printer.canPrintKitchen) {
    //       await PrinterService.printToPrinter(orderDetail, printer, true);
    //     }
    //     if (printer.canPrintBar) {
    //       await PrinterService.printToPrinter(orderDetail, printer, false);
    //     }
    //   }
    //   return;
    // }

    // if (printType == 'bar') {
    //   //cari printer yang isPrinter barnya true
    //   state = state.where((printer) => printer.isBarPrinter == true).toList();
    //   //print to printer
    //   for (var printer in state) {
    //     await PrinterService.printToPrinter(orderDetail, printer, false);
    //   }
    // } else if (printType == 'kitchen') {
    //   //cari printer yang isPrinter kitchen true
    //   state =
    //       state.where((printer) => printer.isKitchenPrinter == true).toList();
    //   //print to printer
    //   for (var printer in state) {
    //     await PrinterService.printToPrinter(orderDetail, printer, true);
    //   }
    // } else if (printType == 'customer') {
    //   //cari printer yang isPrinter customer true
    //   state = state.where((printer) => printer.isBarPrinter == true).toList();
    //   //print to printer
    //   for (var printer in state) {
    //     await PrinterService.printToPrinter(orderDetail, printer, false);
    //   }
    // } else if (printType == 'all') {
    //   //print to printer
    //   for (var printer in state) {
    //     if (printer.isKitchenPrinter) {
    //       await PrinterService.printToPrinter(orderDetail, printer, true);
    //     }
    //     if (printer.isBarPrinter) {
    //       await PrinterService.printToPrinter(orderDetail, printer, false);
    //     }
    //   }
    // }
  }

  Future<void> addPrinter(BluetoothPrinterModel printer) async {
    final box = ref.read(printerBoxProvider);
    await box.put(printer.address, printer);
    state = box.values.toList().cast<BluetoothPrinterModel>();
    print('Printer added: $printer');
  }

  Future<void> removePrinter(String macAddress) async {
    final box = ref.read(printerBoxProvider);
    await box.delete(macAddress);
    state = box.values.toList().cast<BluetoothPrinterModel>();
  }
}

// 3. Provider untuk printer scanner
final printerScannerProvider =
    AsyncNotifierProvider<PrinterScannerNotifier, List<BluetoothInfo>>(() {
      return PrinterScannerNotifier();
    });
Future<void> requestPermissions() async {
  await [
    Permission.bluetoothScan,
    Permission.bluetoothConnect,
    Permission.locationWhenInUse,
  ].request();
}

class PrinterScannerNotifier extends AsyncNotifier<List<BluetoothInfo>> {
  @override
  Future<List<BluetoothInfo>> build() async {
    return [];
  }

  Future<void> scanPrinters() async {
    await requestPermissions();

    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final paired = await PrintBluetoothThermal.pairedBluetooths;
      return paired;
    });
  }

  //clear
  void clearScannedPrinters() {
    state = AsyncValue.data([]);
  }
}

// 4. Provider untuk koneksi printer
final printerConnectionProvider =
    NotifierProvider<PrinterConnectionNotifier, PrinterConnectionState>(() {
      return PrinterConnectionNotifier();
    });

class PrinterConnectionNotifier extends Notifier<PrinterConnectionState> {
  @override
  PrinterConnectionState build() {
    return PrinterConnectionState.disconnected;
  }

  Future<void> connect(BluetoothPrinterModel printer) async {
    state = PrinterConnectionState.connecting;
    print('Connecting to printer...');
    // memutuskan hubungan printer terlebih dahulu
    await PrintBluetoothThermal.disconnect;
    try {
      final connected = await PrintBluetoothThermal.connect(
        macPrinterAddress: printer.address,
      );
      state =
          connected
              ? PrinterConnectionState.connected
              : PrinterConnectionState.failed;
      print('Connected to printer: $connected');
    } catch (e) {
      print('Error connecting to printer: $e');
      state = PrinterConnectionState.failed;
    }
  }

  void disconnect() async {
    await PrintBluetoothThermal.disconnect;
    state = PrinterConnectionState.disconnected;
  }
}

enum PrinterConnectionState { disconnected, connecting, connected, failed }
