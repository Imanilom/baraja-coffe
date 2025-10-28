// import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/services/network_discovery_service.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:image/image.dart' as img;
import 'dart:typed_data';
import 'package:esc_pos_printer/esc_pos_printer.dart';
import 'package:esc_pos_utils/esc_pos_utils.dart';
import 'package:flutter/services.dart' show rootBundle;

class PrinterServices {
  static Future<void> connectPrinter(BluetoothPrinterModel printer) async {
    await PrintBluetoothThermal.disconnect;
    await PrintBluetoothThermal.connect(macPrinterAddress: printer.address);
  }

  static Future<void> disconnectPrinter() async {
    await PrintBluetoothThermal.disconnect;
  }

  static Future<bool> newTestPrint(
    BluetoothPrinterModel printer,
    String macAddress,
  ) async {
    try {
      await disconnectPrinter();
      await connectPrinter(printer);
      // 1. Buat generator
      final profile = await CapabilityProfile.load();
      PaperSize paperSize;
      print('Paper Size: ${printer.paperSize}');
      if (printer.paperSize == 'mm58') {
        paperSize = PaperSize.mm58;
      } else if (printer.paperSize == 'mm80') {
        paperSize = PaperSize.mm80;
      } else {
        paperSize = PaperSize.mm58;
      }
      final generator = Generator(paperSize, profile);

      // 2. Siapkan konten
      final List<int> bytes = [];

      bytes.addAll(
        await printLogo(generator, 'assets/logo/logo_baraja.png', paperSize),
      );

      bytes.addAll(generator.feed(1));

      bytes.addAll(
        generator.text(
          'Bluetooth Printer Test',
          styles: const PosStyles(align: PosAlign.center, bold: true),
        ),
      );

      bytes.addAll(generator.hr(ch: '='));
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Mac Address',
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: printer.address,
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Paper Size',
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: printer.paperSize,
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Connection Type',
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: printer.connectionType!,
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );

      bytes.addAll(generator.hr(ch: '=', linesAfter: 1));

      //success message
      bytes.addAll(
        generator.text(
          'Test Print Successfully',
          styles: const PosStyles(align: PosAlign.center, bold: true),
        ),
      );

      bytes.addAll(generator.feed(2));

      final result = await PrintBluetoothThermal.writeBytes(bytes);
      await disconnectPrinter();
      return result;
    } catch (e) {
      print('Print error: $e');
      await disconnectPrinter();
      return false;
    }
  }

  static Future<bool> testNetworkPrint(
    BluetoothPrinterModel printer,
    String address,
  ) async {
    try {
      final profile = await CapabilityProfile.load();
      PaperSize paperSize;
      if (printer.paperSize == 'mm58') {
        paperSize = PaperSize.mm58;
      } else if (printer.paperSize == 'mm80') {
        paperSize = PaperSize.mm80;
      } else {
        paperSize = PaperSize.mm58;
      }
      final generator = Generator(paperSize, profile);

      // 2. Siapkan konten
      final List<int> bytes = [];

      // Header
      // bytes.addAll(await generateHeadersBytes(generator, paperSize));
      // bytes.addAll(
      //   await generateOptimizedLogoBytes(
      //     generator,
      //     'assets/logo/logo_baraja.svg',
      //     // 'assets/logo/logo_baraja.webp',
      //     // 'assets/logo/logo_baraja.png',
      //     paperSize,
      //   ),
      // );
      bytes.addAll(generator.feed(1));
      bytes.addAll(
        generator.text(
          'Network Printer Test',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
            width: PosTextSize.size2,
          ),
        ),
      );

      bytes.addAll(generator.hr(ch: '='));
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'IP Address',
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: '$address:${printer.port}',
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Paper Size',
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: printer.paperSize,
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Connection Type',
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: printer.connectionType!,
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );

      bytes.addAll(generator.hr(ch: '=', linesAfter: 1));

      //success message
      bytes.addAll(
        generator.text(
          'Test Print Successfully',
          styles: const PosStyles(align: PosAlign.center, bold: true),
        ),
      );

      //cut
      bytes.addAll(generator.cut());

      // 3. Kirim ke printer
      final result = await NetworkDiscoveryService.testPrintToNetworkPrinter(
        printer,
        bytes,
      );

      return result;
    } catch (e) {
      print('Print error: $e');
      return false;
    }
  }

  static Future<List<int>> printLogo(
    Generator generator,
    String assetPath,
    PaperSize paperSize,
  ) async {
    // 1. Baca file sebagai Uint8List
    final ByteData data = await rootBundle.load(assetPath);
    final Uint8List imageBytes = data.buffer.asUint8List();

    // 2. Decode gambar menggunakan package 'image'
    img.Image? image = img.decodeImage(imageBytes);
    if (image == null) {
      throw Exception('Gagal mendekode gambar: $assetPath');
    }

    // 3. Tentukan lebar berdasarkan ukuran kertas
    int width;
    switch (paperSize) {
      case PaperSize.mm58:
        width = 300;
        break;
      case PaperSize.mm80:
        width = 384; // standar ESC/POS untuk 80mm
        break;
      default:
        width = 300;
    }

    // 4. Resize gambar agar sesuai (opsional tapi disarankan)
    image = img.copyResize(image, width: width);

    // 5. Gunakan generator.image()
    return generator.image(image);
  }
}
