// import 'package:flutter/material.dart';
// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:kasirbaraja/models/saved_printer.model.dart';
// import 'package:kasirbaraja/providers/ble_scan_provider.dart';
// import 'package:flutter_reactive_ble/flutter_reactive_ble.dart';
// import 'dart:convert';
// import 'dart:typed_data';
// import 'package:kasirbaraja/providers/printer_providers/saved_printers_provider.dart';

// class PrinterConnection extends ConsumerWidget {
//   const PrinterConnection({super.key});

//   @override
//   Widget build(BuildContext context, WidgetRef ref) {
//     final devices = ref.watch(bleScanProvider);
//     final scan = ref.read(bleScanProvider.notifier);
//     final ble = FlutterReactiveBle();
//     // final printers = ref.watch(savedPrintersProvider);

//     Future<void> testPrint(String deviceId) async {
//       try {
//         // Mulai koneksi BLE
//         final connectionStream = ble.connectToDevice(
//           id: deviceId,
//           connectionTimeout: const Duration(seconds: 10),
//         );

//         print('Mencoba terhubung ke printer...');

//         // Tunggu sampai statusnya terhubung
//         final connectionState = await connectionStream.firstWhere(
//           (state) => state.connectionState == DeviceConnectionState.connected,
//         );

//         print("Printer terhubung!");

//         await Future.delayed(Duration(milliseconds: 300)); // tunggu sedikit

//         // Siapkan data print
//         final testData = Uint8List.fromList([
//           0x1B, 0x40, // Initialize printer
//           ...utf8.encode("== TEST PRINT ==\n"),
//           ...utf8.encode("Baraja POS\n"),
//           0x0A, 0x0A, 0x0A,
//         ]);

//         // Kirim ke characteristic printer
//         await ble.writeCharacteristicWithoutResponse(
//           QualifiedCharacteristic(
//             serviceId: Uuid.parse("49535343-fe7d-4ae5-8fa9-9fafd205e455"),
//             characteristicId: Uuid.parse(
//               "49535343-8841-43f4-a8d4-ecbe34729bb3",
//             ),
//             deviceId: deviceId,
//           ),
//           value: testData,
//         );

//         print("Data test print terkirim!");
//       } catch (e) {
//         print("Gagal test print: $e");
//       }
//     }

//     Future<void> discoverServices(DiscoveredDevice device) async {
//       try {
//         //disconect dulu
//         final connectionStream = ble.connectToDevice(id: device.id);
//         print('Mencoba terhubung ke perangkat...');
//         connectionStream.listen((state) {
//           print("State koneksi: ${state.connectionState}");
//         });
//         await connectionStream
//             .firstWhere(
//               (state) =>
//                   state.connectionState == DeviceConnectionState.connected,
//             )
//             .timeout(
//               Duration(seconds: 10),
//               onTimeout: () {
//                 throw Exception("Timeout: tidak bisa terhubung ke printer.");
//               },
//             );

//         print("Terhubung ke perangkat ${device.id}");

//         final services = await ble.getDiscoveredServices(device.id);

//         if (services.isEmpty) {
//           print("Tidak ada services ditemukan.");
//           return;
//         }

//         final writableChar = services
//             .expand((s) => s.characteristics)
//             .firstWhere(
//               (c) => c.isWritableWithResponse || c.isWritableWithoutResponse,
//               orElse:
//                   () =>
//                       throw Exception(
//                         "Tidak ada karakteristik yang bisa ditulis.",
//                       ),
//             );

//         final matchedService = services.firstWhere(
//           (s) => s.characteristics.contains(writableChar),
//         );

//         final printer = SavedPrinterModel(
//           id: device.id,
//           name: device.name,
//           role: 'bar',
//           serviceUUID: matchedService.id.toString(),
//           characteristicUUID: writableChar.id.toString(),
//         );

//         print('Printer disimpan: $printer');

//         await ref.read(savedPrintersProvider.notifier).addPrinter(printer);
//       } catch (e) {
//         print("Gagal discoverServices: $e");
//       }
//     }

//     return Column(
//       children: [
//         //menampilkan printer tersimpan
//         printers.isEmpty
//             ? const Center(child: Text('Belum ada printer tersimpan'))
//             : ListView.builder(
//               itemCount: printers.length,
//               itemBuilder: (context, index) {
//                 final printer = printers[index];
//                 return ListTile(
//                   title: Text(printer.name),
//                   subtitle: Text(printer.id),
//                   trailing: IconButton(
//                     icon: const Icon(Icons.delete),
//                     onPressed: () {
//                       ref
//                           .read(savedPrintersProvider.notifier)
//                           .removePrinter(printer.id);
//                     },
//                   ),
//                 );
//               },
//             ),
//         Container(
//           color: Colors.white,
//           alignment: Alignment.center,
//           padding: const EdgeInsets.all(16),
//           child: ElevatedButton(
//             onPressed: () {
//               print('Sedang mencari Printer...');
//               scan.startScan();
//             },
//             child: const Text('Cari Printer'),
//           ),
//         ),
//         Expanded(
//           child:
//               devices.isEmpty
//                   ? const Center(child: Text('Belum ada printer terdeteksi'))
//                   : ListView.builder(
//                     itemCount: devices.length,
//                     itemBuilder: (context, index) {
//                       final device = devices[index];
//                       return ListTile(
//                         onTap: () {
//                           //munculkan dialog menghubungkan printer
//                           showDialog(
//                             context: context,
//                             builder:
//                                 (context) => AlertDialog(
//                                   title: const Text('Hubungkan Printer'),
//                                   content: Column(
//                                     mainAxisSize: MainAxisSize.min,
//                                     children: [
//                                       Text(device.name),
//                                       Text(device.id),
//                                     ],
//                                   ),
//                                   actions: [
//                                     TextButton(
//                                       onPressed: () {
//                                         Navigator.pop(context);
//                                       },
//                                       child: const Text('Batal'),
//                                     ),
//                                     TextButton(
//                                       onPressed: () {
//                                         //simpan ke printer provider
//                                         print(
//                                           'Proses simpan printer: ${device.id}',
//                                         );
//                                         discoverServices(device);
//                                         Navigator.pop(context);
//                                       },
//                                       child: const Text('Pilih'),
//                                     ),
//                                   ],
//                                 ),
//                           );
//                         },
//                         title: Text(
//                           device.name.isNotEmpty ? device.name : 'Tanpa Nama',
//                         ),
//                         subtitle: Text(device.id),
//                         trailing: PopupMenuButton<String>(
//                           onSelected: (role) {
//                             // TODO: Simpan sebagai printer bar/dapur
//                             print(role);
//                             if (role == 'bar') {
//                               //simpan ke printer provider
//                               discoverServices(device);
//                               //pop
//                               // Navigator.pop(context);
//                             } else if (role == 'dapur') {
//                               //simpan ke printer provider
//                               testPrint(device.id);
//                             }
//                           },
//                           itemBuilder:
//                               (_) => const [
//                                 PopupMenuItem(
//                                   value: 'bar',
//                                   child: Text('Pilih sebagai Printer Bar'),
//                                 ),
//                                 PopupMenuItem(
//                                   value: 'dapur',
//                                   child: Text('Pilih sebagai Printer Dapur'),
//                                 ),
//                               ],
//                         ),
//                       );
//                     },
//                   ),
//         ),
//       ],
//     );
//   }
// }
