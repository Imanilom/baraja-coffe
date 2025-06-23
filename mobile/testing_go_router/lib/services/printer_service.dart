import 'dart:typed_data';

import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:flutter/services.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/utils/convert_image_to_bytes.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:image/image.dart' as img;

class PrinterService {
  static Future<void> connectPrinter(BluetoothPrinterModel printer) async {
    await PrintBluetoothThermal.disconnect;
    await PrintBluetoothThermal.connect(macPrinterAddress: printer.address);
  }

  //print to multiple printer
  static Future<void> printToMultiplePrinter(
    OrderDetailModel orderDetail,
    BluetoothPrinterModel printer,
  ) async {}

  static Future<void> printToPrinter(
    OrderDetailModel orderDetail,
    BluetoothPrinterModel printer,
    bool isKitchenReceipt,
  ) async {
    await disconnectPrinter();
    await connectPrinter(printer);
    final bytes =
        isKitchenReceipt
            ? await generateKitchenBytes(orderDetail, printer)
            : await generateBarBytes(orderDetail, printer);
    final copies = isKitchenReceipt ? printer.kitchenCopies : printer.barCopies;
    for (var i = 0; i < copies; i++) {
      await PrintBluetoothThermal.writeBytes(bytes);
    }

    final customerBytes = await generateBarBytes(orderDetail, printer);

    await PrintBluetoothThermal.writeBytes(customerBytes);
  }

  static Future<void> disconnectPrinter() async {
    await PrintBluetoothThermal.disconnect;
  }

  static Future<bool> testPrint(
    BluetoothPrinterModel printer,
    String macAddress,
  ) async {
    try {
      await disconnectPrinter();
      await connectPrinter(printer);
      // 1. Buat generator
      print('printer yang dipilih: $printer');

      final profile = await CapabilityProfile.load();

      print('profile sudah di buat: $profile');
      PaperSize paperSize = PaperSize.mm58;
      if (printer.paperSize == 'mm58') {
        paperSize = PaperSize.mm58;
      } else if (printer.paperSize == 'mm80') {
        paperSize = PaperSize.mm80;
      } else {
        paperSize = PaperSize.mm72;
      }
      final generator = Generator(paperSize, profile);

      // 2. Siapkan konten
      final List<int> bytes = [];

      // Header
      await generateLogoBytes(
        generator,
        'assets/logo/logo_baraja.png',
        paperSize,
      ).then((logoBytes) {
        bytes.addAll(logoBytes);
      });

      //alamat toko
      bytes.addAll(
        generator.text(
          'Baraja Amphitheater\nJl. Jend. Sudirman No. 1, Jakarta Selatan, 12750\nTelp: 0812-3456-7890\n',
          styles: const PosStyles(align: PosAlign.center),
        ),
      );

      // data tanggal kasir dan pelanggan
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Tanggal',
            width: 4,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text:
                "${DateTime.now().year}:${DateTime.now().month.toString().padLeft(2, '0')}:${DateTime.now().day.toString().padLeft(2, '0')} ${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}:${DateTime.now().second.toString().padLeft(2, '0')}",
            width: 8,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Kasir',
            width: 4,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: "Static Kasir",
            width: 8,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Pelanggan',
            width: 4,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: "Static Pelanggan",
            width: 8,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );

      bytes.addAll(generator.feed(1));

      //tipe order
      bytes.addAll(
        generator.text(
          'Dine In',
          styles: const PosStyles(align: PosAlign.center, bold: true),
        ),
      );

      bytes.addAll(generator.hr());

      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Mac Address',
            width: 5,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: macAddress,
            width: 7,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );

      // Footer
      bytes.addAll(generator.hr());
      bytes.addAll(
        generator.text(
          'Selesai mencetak',
          styles: const PosStyles(align: PosAlign.center),
        ),
      );
      bytes.addAll(generator.cut());

      // 3. Kirim ke printer
      print('print bytes: $bytes');
      final result = await PrintBluetoothThermal.writeBytes(bytes);
      print('result: $result');
      return result;
    } catch (e) {
      print('Print error: $e');
      return false;
    }
  }

  static Future<List<int>> generateLogoBytes(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    // 1. Siapkan konten
    final List<int> bytes = [];

    // Header
    final ByteData byteData = await rootBundle.load(imagePath);
    final Uint8List imageBytes = byteData.buffer.asUint8List();
    final image = img.decodeImage(imageBytes)!;

    // Resize gambar sesuai lebar kertas
    final resizedImage = img.copyResize(image, width: paperSize.width - 84);

    // Konversi ke grayscale
    final grayscaleImage = img.grayscale(resizedImage);

    bytes.addAll(generator.image(grayscaleImage));
    bytes.addAll(generator.feed(1));

    return bytes;
  }

  static Future<List<int>> generateBarBytes(
    OrderDetailModel orderDetail,
    BluetoothPrinterModel printer,
  ) async {
    // 1. Buat generator
    final profile = await CapabilityProfile.load();
    PaperSize paperSize = PaperSize.mm58;
    if (printer.paperSize == 'mm58') {
      paperSize = PaperSize.mm58;
    } else if (printer.paperSize == 'mm80') {
      paperSize = PaperSize.mm80;
    } else {
      paperSize = PaperSize.mm72;
    }
    final generator = Generator(paperSize, profile);

    // 2. Siapkan konten
    final List<int> bytes = [];

    // Header
    // Header
    await generateLogoBytes(
      generator,
      'assets/logo/logo_baraja.png',
      paperSize,
    ).then((logoBytes) {
      bytes.addAll(logoBytes);
    });

    //alamat toko
    bytes.addAll(
      generator.text(
        'Baraja Amphitheater\nJl. Jend. Sudirman No. 1, Jakarta Selatan, 12750\nTelp: 0812-3456-7890\n',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );

    // data tanggal kasir dan pelanggan
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Tanggal',
          width: 4,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text:
              "${DateTime.now().year}:${DateTime.now().month.toString().padLeft(2, '0')}:${DateTime.now().day.toString().padLeft(2, '0')} ${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}:${DateTime.now().second.toString().padLeft(2, '0')}",
          width: 8,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Kasir',
          width: 4,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: "Static Kasir",
          width: 8,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Pelanggan',
          width: 4,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: "Static Pelanggan",
          width: 8,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );

    bytes.addAll(generator.feed(1));
    bytes.addAll(generator.hr());
    print('Order Detail: ${orderDetail.items.first.menuItem.categories}');
    // final bar = orderDetail.items.where((element) {
    //   // mencari menu item yang merupakan kategory tambahan
    //   return element.menuItem.categories!.contains('Additional');
    //   // return element.menuItem.categories == ['additional'];
    // });
    // print('Bar bytes additional: $bar');

    final orderdetail = orderDetail.items;
    //list order Items
    for (var item in orderdetail) {
      bytes.addAll(
        generator.row([
          PosColumn(
            text: item.menuItem.name!,
            width: 5,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: 'x${item.quantity.toString()}',
            width: 2,
            styles: const PosStyles(align: PosAlign.right),
          ),
          PosColumn(
            text: item.calculateSubTotalPrice().toString(),
            width: 5,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
    }
    bytes.addAll(generator.hr());
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Sub Total Harga',
          width: 6,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: orderDetail.subTotalPrice.toString(),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Tax 10%',
          width: 6,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: orderDetail.tax.toString(),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    // Footer
    bytes.addAll(generator.hr());
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Total Harga',
          width: 6,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: orderDetail.totalPrice.toString(),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(generator.hr());
    bytes.addAll(
      generator.text(
        'Selesai mencetak',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );
    bytes.addAll(generator.feed(2));
    bytes.addAll(generator.cut());

    return bytes;
  }

  static Future<List<int>> generateKitchenBytes(
    OrderDetailModel orderDetail,
    BluetoothPrinterModel printer,
  ) async {
    final profile = await CapabilityProfile.load();
    PaperSize paperSize = PaperSize.mm58;
    if (printer.paperSize == 'mm58') {
      paperSize = PaperSize.mm58;
    } else if (printer.paperSize == 'mm80') {
      paperSize = PaperSize.mm80;
    } else {
      paperSize = PaperSize.mm72;
    }
    final generator = Generator(paperSize, profile);

    // 2. Siapkan konten
    final List<int> bytes = [];

    bytes.addAll(
      generator.text(
        'Kitchen',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
        ),
      ),
    );

    bytes.addAll(generator.hr(ch: '='));

    for (var item in orderDetail.items) {
      bytes.addAll(
        generator.row([
          PosColumn(
            text: item.menuItem.name!,
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: 'x${item.quantity.toString()}',
            width: 6,
            styles: const PosStyles(align: PosAlign.center),
          ),
        ]),
      );
    }
    bytes.addAll(generator.hr(ch: '='));
    bytes.addAll(
      generator.text(
        'Selesai mencetak',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );
    return bytes;
  }
}
