// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:hive_ce/hive.dart';
// import 'package:kasirbaraja/models/saved_printer.model.dart';

// final savedPrintersProvider =
//     StateNotifierProvider<SavedPrintersNotifier, List<SavedPrinterModel>>((
//       ref,
//     ) {
//       return SavedPrintersNotifier();
//     });

// class SavedPrintersNotifier extends StateNotifier<List<SavedPrinterModel>> {
//   SavedPrintersNotifier() : super([]);

//   // Load data dari Hive saat init
//   Future<void> loadPrinters() async {
//     final box = await Hive.openBox<SavedPrinterModel>('printers');
//     state = box.values.toList();
//   }

//   // Tambah printer baru
//   Future<void> addPrinter(SavedPrinterModel printer) async {
//     final box = await Hive.openBox<SavedPrinterModel>('printers');
//     await box.put(printer.id, printer);
//     state = [...state, printer];
//   }

//   // Hapus printer
//   Future<void> removePrinter(String printerId) async {
//     final box = await Hive.openBox<SavedPrinterModel>('printers');
//     await box.delete(printerId);
//     state = state.where((p) => p.id != printerId).toList();
//   }
// }
