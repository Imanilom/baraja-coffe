import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:flutter/services.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:image/image.dart' as img;
import 'package:kasirbaraja/enums/order_type.dart';

class PrinterService {
  static Future<void> connectPrinter(BluetoothPrinterModel printer) async {
    await PrintBluetoothThermal.disconnect;
    await PrintBluetoothThermal.connect(macPrinterAddress: printer.address);
  }

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

  //new logic for printing
  static Future<void> printDocuments({
    required OrderDetailModel orderDetail,
    required String printType,
    required List<BluetoothPrinterModel> printers,
  }) async {
    final jobs = _createPrintJobs(printType);

    print('dokumen print ${orderDetail.items.toList()}');

    for (final job in jobs) {
      await _printJobToSupportedPrinters(
        orderDetail: orderDetail,
        jobType: job,
        printers: printers,
      );
    }
  }

  static List<String> _createPrintJobs(String printType) {
    switch (printType) {
      case 'customer':
        return ['customer'];
      case 'kitchen':
        return ['kitchen'];
      case 'bar':
        return ['bar'];
      case 'waiter':
        return ['waiter'];
      case 'all':
        return ['customer', 'kitchen', 'bar', 'waiter'];
      default:
        return [];
    }
  }

  static Future<void> _printJobToSupportedPrinters({
    required OrderDetailModel orderDetail,
    required String jobType,
    required List<BluetoothPrinterModel> printers,
  }) async {
    final supportedPrinters =
        printers.where((printer) {
          switch (jobType) {
            case 'customer':
              return printer.canPrintCustomer;
            case 'kitchen':
              return printer.canPrintKitchen;
            case 'bar':
              return printer.canPrintBar;
            case 'waiter':
              return printer.canPrintWaiter;
            default:
              return false;
          }
        }).toList();

    if (supportedPrinters.isEmpty) {
      print('⚠️ Tidak ada printer yang mendukung $jobType');
      return;
    }

    print('📤 Mencetak $jobType di ${supportedPrinters.length} printer');

    for (final printer in supportedPrinters) {
      print('📤 Mencetak $jobType di ${printer.name} (${printer.address})');
      await _printSingleJob(
        orderDetail: orderDetail,
        printer: printer,
        jobType: jobType,
      );
    }
  }

  static Future<void> _printSingleJob({
    required OrderDetailModel orderDetail,
    required BluetoothPrinterModel printer,
    required String jobType,
  }) async {
    try {
      print('📤 Mencetak $jobType di ${printer.name} (${printer.address})');
      await connectPrinter(printer);

      final bytes = await _generateBytesForJob(
        orderDetail: orderDetail,
        printer: printer,
        jobType: jobType,
      );

      final copies = _getCopiesForJob(printer, jobType);

      for (int i = 0; i < copies; i++) {
        await PrintBluetoothThermal.writeBytes(bytes);
      }

      await disconnectPrinter();
    } catch (e) {
      print('❌ Gagal mencetak $jobType di ${printer.name}: $e');
    }
  }

  static int _getCopiesForJob(BluetoothPrinterModel printer, String jobType) {
    switch (jobType) {
      case 'customer':
        return printer.customerCopies;
      case 'kitchen':
        return printer.kitchenCopies;
      case 'bar':
        return printer.barCopies;
      case 'waiter':
        return printer.waiterCopies;
      default:
        return 1;
    }
  }

  static Future<List<int>> _generateBytesForJob({
    required OrderDetailModel orderDetail,
    required BluetoothPrinterModel printer,
    required String jobType,
  }) async {
    switch (jobType) {
      case 'customer':
        return generateCustomerBytes(orderDetail, printer);
      case 'kitchen':
        return generateKitchenBytes(orderDetail, printer);
      case 'bar':
        return generateBarBytes(orderDetail, printer);
      case 'waiter':
        return generateWaiterBytes(orderDetail, printer);
      default:
        throw 'Jenis struk tidak valid: $jobType';
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
        await generateHeadersBytes(
          generator,
          paperSize,
          null,
          null,
          null,
          null,
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

      bytes.addAll(generator.hr());

      //footer
      await generateFooterBytes(generator, paperSize).then((footerBytes) {
        bytes.addAll(footerBytes);
      });

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

  static Future<List<int>> generateHeadersBytes(
    Generator generator,
    PaperSize paperSize,
    String? orderId,
    String? cashierName,
    String? customerName,
    String? orderType,
  ) async {
    final List<int> bytes = [];

    // Logo
    bytes.addAll(
      await generateLogoBytes(
        generator,
        'assets/logo/logo_baraja.png',
        paperSize,
      ),
    );

    // Alamat Toko
    bytes.addAll(
      generator.text(
        'Baraja Amphitheater\nJl. Tuparev No. 60, Kedungjaya,\nKec. Kedawung, Kab. Cirebon\nJawa Barat 45153, Indonesia\nKABUPATEN CIREBON\n0851-1708-9827',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );

    bytes.addAll(generator.feed(1));

    // Data kode struk Tanggal Kasir dan Pelanggan
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Kode Struk',
          width: 4,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: orderId ?? "XXX-XXX-XXXX",
          width: 8,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Tanggal',
          width: 4,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text:
              "${DateTime.now().year}/${DateTime.now().month.toString().padLeft(2, '0')}/${DateTime.now().day.toString().padLeft(2, '0')} ${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}:${DateTime.now().second.toString().padLeft(2, '0')}",
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
          text: cashierName ?? "XXXXXXX",
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
          text: customerName ?? "XXXXXX",
          width: 8,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );

    // Tambahkan jeda
    bytes.addAll(generator.feed(1));

    //tipe order
    bytes.addAll(
      generator.text(
        orderType ?? 'Dine In / Take Away / Delivery',
        styles: const PosStyles(align: PosAlign.center, bold: true),
      ),
    );

    return bytes;
  }

  static Future<List<int>> generateCustomerBytes(
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
      await generateHeadersBytes(
        generator,
        paperSize,
        orderDetail.orderId,
        orderDetail.cashierId,
        orderDetail.user,
        OrderTypeExtension.orderTypeToJson(orderDetail.orderType).toString(),
      ),
    );

    bytes.addAll(generator.hr());

    // List Order Items
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
            text: item.subtotal.toString(),
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
          text: orderDetail.totalAfterDiscount.toString(),
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
          text: orderDetail.totalTax.toString(),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );

    bytes.addAll(generator.hr());
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Total Harga',
          width: 6,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: orderDetail.grandTotal.toString(),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(generator.hr());

    //footer
    await generateFooterBytes(generator, paperSize).then((footerBytes) {
      bytes.addAll(footerBytes);
    });

    //feed and cut
    bytes.addAll(generator.feed(2));
    // bytes.addAll(generator.cut());

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
    bytes.addAll(
      generator.text(
        'Bar',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
        ),
      ),
    );

    final orderdetail =
        orderDetail.items
            .where((item) => item.menuItem.workstation == 'bar')
            .toList();
    //list order Items
    for (var item in orderdetail) {
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
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
    }
    bytes.addAll(generator.hr());
    bytes.addAll(
      generator.text(
        'Selesai',
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
        'Dapur',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
        ),
      ),
    );

    bytes.addAll(generator.hr(ch: '='));
    print('print kitchen ${orderDetail.items}');

    final orderdetail =
        orderDetail.items
            .where((item) => item.menuItem.workstation == 'kitchen')
            .toList();
    print('print kitchen $orderdetail');
    for (var item in orderdetail) {
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

  static Future<List<int>> generateWaiterBytes(
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
        'Label',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
        ),
      ),
    );

    bytes.addAll(generator.hr());

    final orderdetail = orderDetail.items;
    //list order Items
    for (var item in orderdetail) {
      bytes.addAll(
        generator.row([
          PosColumn(
            text: item.menuItem.name!,
            width: 9,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: 'x${item.quantity.toString()}',
            width: 3,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
    }
    bytes.addAll(generator.hr());

    return bytes;
  }

  static Future<List<int>> generateFooterBytes(
    Generator generator,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];
    // Footer
    bytes.addAll(
      generator.text(
        '** LUNAS **',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );
    bytes.addAll(generator.feed(1));
    bytes.addAll(
      generator.text(
        'Password WiFi: ramadhandibaraja',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );
    bytes.addAll(generator.feed(1));
    bytes.addAll(
      generator.text(
        'Terima kasih telah berbelanja di Baraja Amphitheater',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );

    bytes.addAll(generator.feed(1));

    bytes.addAll(
      generator.text(
        'IG: @barajacoffee',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );
    bytes.addAll(generator.feed(2));

    return bytes;
  }
}
