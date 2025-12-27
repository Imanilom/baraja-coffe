// import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
// import 'package:flutter/material.dart';
// import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
// import 'package:kasirbaraja/services/network_discovery_service.dart';
// // import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
// import 'package:image/image.dart' as img;
// import 'dart:typed_data';
// import 'package:flutter/services.dart' show rootBundle;
// import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';

// class PrinterServices {
//   static final FlutterBluetoothSerial _fb = FlutterBluetoothSerial.instance;

//   static BluetoothConnection? _conn;
//   static String? _connectedAddress;

//   static bool get isConnected => _conn?.isConnected == true;
//   static String? get connectedAddress => _connectedAddress;

//   /// Ambil daftar perangkat yang sudah paired
//   static Future<List<BluetoothDevice>> bondedDevices() async {
//     final list = await _fb.getBondedDevices();
//     return list;
//   }

//   /// Pastikan Bluetooth aktif (opsional)
//   static Future<void> ensureBluetoothOn() async {
//     final state = await _fb.state;
//     if (state != BluetoothState.STATE_ON) {
//       await _fb.requestEnable();
//     }
//   }

//   static Future<void> connectPrinter(BluetoothPrinterModel printer) async {
//     // await PrintBluetoothThermal.disconnect;
//     // await PrintBluetoothThermal.connect(macPrinterAddress: printer.address);
//     await ensureBluetoothOn();

//     // Jika sudah terhubung ke device yang sama, skip
//     if (isConnected && _connectedAddress == printer.address) return;

//     // Putuskan koneksi lama bila ada
//     if (isConnected) {
//       await disconnectPrinter();
//     }

//     // SPP/RFCOMM
//     _conn = await BluetoothConnection.toAddress(printer.address);
//     _connectedAddress = printer.address;
//     // debugPrint('✅ Connected to $printer.address');
//   }

//   static Future<void> disconnectPrinter() async {
//     // await PrintBluetoothThermal.disconnect;
//     try {
//       await _conn?.finish();
//     } catch (_) {}
//     _conn = null;
//     _connectedAddress = null;
//     debugPrint('🔌 Disconnected');
//   }

//   static Future<void> _writeBytes(
//     List<int> bytes, {
//     int chunkSize = 512,
//     int interDelayMs = 10,
//   }) async {
//     final conn = _conn;
//     if (conn == null || !conn.isConnected) {
//       throw 'Not connected';
//     }

//     final data = Uint8List.fromList(bytes);
//     for (int i = 0; i < data.length; i += chunkSize) {
//       final end = (i + chunkSize < data.length) ? i + chunkSize : data.length;
//       final part = data.sublist(i, end);
//       conn.output.add(part);
//       await conn.output.allSent;
//       // Sedikit jeda untuk beberapa printer “sensitif”
//       await Future.delayed(Duration(milliseconds: interDelayMs));
//     }
//   }

//   static Future<bool> newTestPrint(
//     BluetoothPrinterModel printer,
//     String macAddress,
//   ) async {
//     try {
//       await disconnectPrinter();
//       await connectPrinter(printer);
//       // 1. Buat generator
//       final profile = await CapabilityProfile.load();
//       PaperSize paperSize;
//       print('Paper Size: ${printer.paperSize}');
//       if (printer.paperSize == 'mm58') {
//         paperSize = PaperSize.mm58;
//       } else if (printer.paperSize == 'mm80') {
//         paperSize = PaperSize.mm80;
//       } else {
//         paperSize = PaperSize.mm58;
//       }
//       final generator = Generator(paperSize, profile);

//       // 2. Siapkan konten
//       final List<int> bytes = [];

//       bytes.addAll(
//         await printLogo(generator, 'assets/logo/logo_baraja.png', paperSize),
//       );

//       bytes.addAll(generator.feed(1));

//       bytes.addAll(
//         generator.text(
//           'Bluetooth Printer Test',
//           styles: const PosStyles(align: PosAlign.center, bold: true),
//         ),
//       );

//       bytes.addAll(generator.hr(ch: '='));
//       bytes.addAll(
//         generator.row([
//           PosColumn(
//             text: 'Mac Address',
//             width: 6,
//             styles: const PosStyles(align: PosAlign.left),
//           ),
//           PosColumn(
//             text: printer.address,
//             width: 6,
//             styles: const PosStyles(align: PosAlign.right),
//           ),
//         ]),
//       );
//       bytes.addAll(
//         generator.row([
//           PosColumn(
//             text: 'Paper Size',
//             width: 6,
//             styles: const PosStyles(align: PosAlign.left),
//           ),
//           PosColumn(
//             text: printer.paperSize,
//             width: 6,
//             styles: const PosStyles(align: PosAlign.right),
//           ),
//         ]),
//       );
//       bytes.addAll(
//         generator.row([
//           PosColumn(
//             text: 'Connection Type',
//             width: 6,
//             styles: const PosStyles(align: PosAlign.left),
//           ),
//           PosColumn(
//             text: printer.connectionType!,
//             width: 6,
//             styles: const PosStyles(align: PosAlign.right),
//           ),
//         ]),
//       );

//       bytes.addAll(generator.hr(ch: '=', linesAfter: 1));

//       //success message
//       bytes.addAll(
//         generator.text(
//           'Test Print Successfully',
//           styles: const PosStyles(align: PosAlign.center, bold: true),
//         ),
//       );

//       bytes.addAll(generator.feed(2));

//       final result = await _writeBytes(
//         bytes,
//       ).then((_) => true).catchError((_) => false);

//       return result;
//     } catch (e) {
//       print('Print error: $e');

//       return false;
//     } finally {
//       await disconnectPrinter();
//     }
//   }

//   static Future<bool> testNetworkPrint(
//     BluetoothPrinterModel printer,
//     String address,
//   ) async {
//     try {
//       final profile = await CapabilityProfile.load();
//       PaperSize paperSize;
//       if (printer.paperSize == 'mm58') {
//         paperSize = PaperSize.mm58;
//       } else if (printer.paperSize == 'mm80') {
//         paperSize = PaperSize.mm80;
//       } else {
//         paperSize = PaperSize.mm58;
//       }
//       final generator = Generator(paperSize, profile);

//       // 2. Siapkan konten
//       final List<int> bytes = [];

//       // Header
//       // bytes.addAll(await generateHeadersBytes(generator, paperSize));
//       // bytes.addAll(
//       //   await generateOptimizedLogoBytes(
//       //     generator,
//       //     'assets/logo/logo_baraja.svg',
//       //     // 'assets/logo/logo_baraja.webp',
//       //     // 'assets/logo/logo_baraja.png',
//       //     paperSize,
//       //   ),
//       // );
//       bytes.addAll(generator.feed(1));
//       bytes.addAll(
//         generator.text(
//           'Network Printer Test',
//           styles: const PosStyles(
//             align: PosAlign.center,
//             bold: true,
//             height: PosTextSize.size2,
//             width: PosTextSize.size2,
//           ),
//         ),
//       );

//       bytes.addAll(generator.hr(ch: '='));
//       bytes.addAll(
//         generator.row([
//           PosColumn(
//             text: 'IP Address',
//             width: 6,
//             styles: const PosStyles(align: PosAlign.left),
//           ),
//           PosColumn(
//             text: '$address:${printer.port}',
//             width: 6,
//             styles: const PosStyles(align: PosAlign.right),
//           ),
//         ]),
//       );
//       bytes.addAll(
//         generator.row([
//           PosColumn(
//             text: 'Paper Size',
//             width: 6,
//             styles: const PosStyles(align: PosAlign.left),
//           ),
//           PosColumn(
//             text: printer.paperSize,
//             width: 6,
//             styles: const PosStyles(align: PosAlign.right),
//           ),
//         ]),
//       );
//       bytes.addAll(
//         generator.row([
//           PosColumn(
//             text: 'Connection Type',
//             width: 6,
//             styles: const PosStyles(align: PosAlign.left),
//           ),
//           PosColumn(
//             text: printer.connectionType!,
//             width: 6,
//             styles: const PosStyles(align: PosAlign.right),
//           ),
//         ]),
//       );

//       bytes.addAll(generator.hr(ch: '=', linesAfter: 1));

//       //success message
//       bytes.addAll(
//         generator.text(
//           'Test Print Successfully',
//           styles: const PosStyles(align: PosAlign.center, bold: true),
//         ),
//       );

//       //cut
//       bytes.addAll(generator.cut());

//       // 3. Kirim ke printer
//       final result = await NetworkDiscoveryService.testPrintToNetworkPrinter(
//         printer,
//         bytes,
//       );

//       return result;
//     } catch (e) {
//       print('Print error: $e');
//       return false;
//     }
//   }

//   static Future<List<int>> printLogo(
//     Generator generator,
//     String assetPath,
//     PaperSize paperSize,
//   ) async {
//     // 1. Baca file sebagai Uint8List
//     final ByteData data = await rootBundle.load(assetPath);
//     final Uint8List imageBytes = data.buffer.asUint8List();

//     // 2. Decode gambar menggunakan package 'image'
//     img.Image? image = img.decodeImage(imageBytes);
//     if (image == null) {
//       throw Exception('Gagal mendekode gambar: $assetPath');
//     }

//     // 3. Tentukan lebar berdasarkan ukuran kertas
//     int width;
//     switch (paperSize) {
//       case PaperSize.mm58:
//         width = 300;
//         break;
//       case PaperSize.mm80:
//         width = 384; // standar ESC/POS untuk 80mm
//         break;
//       default:
//         width = 300;
//     }

//     // 4. Resize gambar agar sesuai (opsional tapi disarankan)
//     image = img.copyResize(image, width: width);

//     // 5. Gunakan generator.image()
//     return generator.image(image);
//   }
// }
