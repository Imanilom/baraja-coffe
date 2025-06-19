import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

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
      bytes.addAll(
        generator.text(
          'Baraja\nAmphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
            width: PosTextSize.size2,
          ),
        ),
      );

      bytes.addAll(generator.hr());

      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'Mac Address',
            width: 4,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: macAddress,
            width: 8,
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
      bytes.addAll(generator.feed(2));
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
    bytes.addAll(
      generator.text(
        'Baraja\nAmphitheater',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
        ),
      ),
    );
    bytes.addAll(generator.hr());
    bytes.addAll(generator.hr());
    print('Order Detail: ${orderDetail.items.first.menuItem.categories}');
    final bar = orderDetail.items.where((element) {
      // mencari menu item yang merupakan kategory tambahan
      return element.menuItem.categories!.contains('Additional');
      // return element.menuItem.categories == ['additional'];
    });
    print('Bar bytes additional: $bar');
    //list order Items
    for (var item in bar) {
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
