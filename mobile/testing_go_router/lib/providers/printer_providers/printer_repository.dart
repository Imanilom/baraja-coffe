// import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import '../../models/bluetooth_printer.model.dart';

class PrinterRepository {
  final _boxName = 'printerBox';

  Future<void> savePrinter(BluetoothPrinterModel printer) async {
    final box = await Hive.openBox<BluetoothPrinterModel>(_boxName);
    await box.put('default', printer);
  }

  Future<BluetoothPrinterModel?> getSavedPrinter() async {
    final box = await Hive.openBox<BluetoothPrinterModel>(_boxName);
    return box.get('default');
  }
}

// final printersRepository =
//     StateNotifierProvider<PrintersNotifier, List<BluetoothPrinterModel>>((ref) {
//       return PrintersNotifier();
//     });

// class PrintersNotifier extends StateNotifier<List<BluetoothPrinterModel>> {
//   final Box<BluetoothPrinterModel> _box = Hive.box<BluetoothPrinterModel>(
//     'printersBox',
//   );

//   PrintersNotifier() : super([]) {
//     state = _box.values.toList();
//   }

//   void addPrinter(BluetoothPrinterModel printer) {
//     _box.put(printer.role, printer);
//     state = _box.values.toList();
//   }

//   void removePrinter(String role) {
//     _box.delete(role);
//     state = _box.values.toList();
//   }

//   BluetoothPrinterModel? getPrinterByRole(String role) {
//     return _box.get(role);
//   }
// }
