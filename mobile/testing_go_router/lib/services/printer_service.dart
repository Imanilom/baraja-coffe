import 'dart:io';

import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:flutter/services.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/network_discovery_service.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:image/image.dart' as img;
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:intl/intl.dart';

class PrinterService {
  // Tambahkan fungsi helper untuk mengecek apakah ada items untuk workstation tertentu
  static bool _hasItemsForWorkstation(
    OrderDetailModel orderDetail,
    String jobType,
  ) {
    switch (jobType) {
      case 'kitchen':
        return orderDetail.items.any(
          (item) => item.menuItem.workstation == 'kitchen',
        );
      case 'bar':
        return orderDetail.items.any(
          (item) => item.menuItem.workstation == 'bar',
        );
      case 'customer':
      case 'waiter':
        // Customer dan waiter selalu print karena menampilkan semua items
        return orderDetail.items.isNotEmpty;
      default:
        return false;
    }
  }

  static Future<void> connectPrinter(BluetoothPrinterModel printer) async {
    await PrintBluetoothThermal.disconnect;
    await PrintBluetoothThermal.connect(macPrinterAddress: printer.address);
  }

  static Future<void> disconnectPrinter() async {
    await PrintBluetoothThermal.disconnect;
  }

  // === NETWORK PRINTER METHODS ===
  static Future<Socket?> connectNetworkPrinter(
    BluetoothPrinterModel printer,
  ) async {
    try {
      final socket = await Socket.connect(
        printer.address,
        printer.port!, // Default port for network printers
        timeout: const Duration(seconds: 10),
      );
      print(
        '✅ Berhasil terhubung ke network printer ${printer.name} (${printer.address}:${printer.port})',
      );
      return socket;
    } catch (e) {
      print('❌ Gagal terhubung ke network printer ${printer.name}: $e');
      return null;
    }
  }

  static Future<void> disconnectNetworkPrinter(Socket? socket) async {
    try {
      await socket?.close();
      print('✅ Koneksi network printer ditutup');
    } catch (e) {
      print('❌ Error saat menutup koneksi network printer: $e');
    }
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
      // if (printers.any((element) => element.connectionType == 'bluetooth')) {
      await _printJobToSupportedPrinters(
        orderDetail: orderDetail,
        jobType: job,
        printers: printers,
      );
      // }

      if (printers.any((element) => element.connectionType == 'network')) {
        print('Mencetak $job di printer jaringan...');
        // final networkPrinters =
        //     printers
        //         .where((printer) => printer.connectionType == 'network')
        //         .toList();

        // for (final networkPrinter in networkPrinters) {
        //   final socket = await connectNetworkPrinter(networkPrinter);
        //   if (socket != null) {
        //     try {
        //       final bytes = await _generateBytesForJob(
        //         orderDetail: orderDetail,
        //         printer: networkPrinter,
        //         jobType: job,
        //       );
        //       socket.add(bytes);
        //       await socket.flush();
        //     } catch (e) {
        //       print('❌ Gagal mencetak $job di ${networkPrinter.name}: $e');
        //     } finally {
        //       await disconnectNetworkPrinter(socket);
        //     }
        //   }
        // }
      }
      print('Dokumen $job telah dicetak untuk ${orderDetail.orderId}');
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

  // Modifikasi fungsi _printJobToSupportedPrinters
  static Future<void> _printJobToSupportedPrinters({
    required OrderDetailModel orderDetail,
    required String jobType,
    required List<BluetoothPrinterModel> printers,
  }) async {
    // Cek apakah ada items untuk workstation ini
    if (!_hasItemsForWorkstation(orderDetail, jobType)) {
      print('⚠️ Tidak ada menu items untuk $jobType, skip printing');
      return;
    }

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
      print(
        '📤 Mencetak $jobType di ${printer.connectionType} (${printer.address})',
      );
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

      final bytes = await _generateBytesForJob(
        orderDetail: orderDetail,
        printer: printer,
        jobType: jobType,
      );

      final copies = _getCopiesForJob(printer, jobType);

      if (printer.connectionType == 'bluetooth') {
        await connectPrinter(printer);
        for (int i = 0; i < copies; i++) {
          await PrintBluetoothThermal.writeBytes(bytes);
        }
        await disconnectPrinter();
      }
      if (printer.connectionType == 'network') {
        for (int i = 0; i < copies; i++) {
          await NetworkDiscoveryService.testPrintToNetworkPrinter(
            printer,
            bytes,
          );
        }
      }
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

  static Future<bool> testPrint(
    BluetoothPrinterModel printer,
    String macAddress,
  ) async {
    try {
      await disconnectPrinter();
      await connectPrinter(printer);
      // 1. Buat generator
      final profile = await CapabilityProfile.load();
      PaperSize paperSize;
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
      return result;
    } catch (e) {
      print('Print error: $e');
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
        paperSize = PaperSize.mm72;
      }
      final generator = Generator(paperSize, profile);

      // 2. Siapkan konten
      final List<int> bytes = [];

      // Header
      // bytes.addAll(await generateHeadersBytes(generator, paperSize));

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

    final resizedImage = img.copyResize(image, width: 300);

    // Konversi ke grayscale
    final grayscaleImage = img.grayscale(resizedImage);

    bytes.addAll(generator.image(grayscaleImage));
    bytes.addAll(generator.feed(1));

    return bytes;
  }

  static Future<List<int>> generateHeadersBytes(
    Generator generator,
    PaperSize paperSize,
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
        'Baraja Amphitheater, Jl. Tuparev No. 60, Kedungjaya, Kec. Kedawung, Kab. Cirebon, Jawa Barat 45153, Indonesia, KABUPATEN CIREBON\n0851-1708-9827',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );

    bytes.addAll(generator.feed(1));

    return bytes;
  }

  // Data kode struk Tanggal Kasir dan Pelanggan
  static Future<List<int>> generateBillDataBytes(
    Generator generator,
    PaperSize paperSize,
    String? orderId,
    String? customerName,
    String? orderType,
    String? tableNumber,
  ) async {
    final List<int> bytes = [];
    final hive = await HiveService.getCashier();
    final cashierName = hive!.username ?? 'Kasir';

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
          text: cashierName,
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
          text: customerName ?? "Pelanggan",
          width: 8,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    if (orderType == 'Dine-In') {
      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'No Meja',
            width: 4,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: tableNumber ?? "Meja",
            width: 8,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
    }

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
    bytes.addAll(await generateHeadersBytes(generator, paperSize));

    // Bill Data
    bytes.addAll(
      await generateBillDataBytes(
        generator,
        paperSize,
        orderDetail.orderId,
        orderDetail.user,
        OrderTypeExtension.orderTypeToJson(orderDetail.orderType).toString(),
        orderDetail.tableNumber,
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
            text: formatPrice(item.subtotal).toString(),
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
          text: formatPrice(orderDetail.totalAfterDiscount).toString(),
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
          text: formatPrice(orderDetail.totalTax).toString(),
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
          text: formatPrice(orderDetail.grandTotal).toString(),
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
    // bytes.addAll(generator.feed(2));
    bytes.addAll(generator.cut());

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

    bytes.addAll(generator.feed(1));
    // Bill Data
    bytes.addAll(
      await generateBillDataBytes(
        generator,
        paperSize,
        orderDetail.orderId,
        orderDetail.user,
        OrderTypeExtension.orderTypeToJson(orderDetail.orderType).toString(),
        orderDetail.tableNumber,
      ),
    );

    bytes.addAll(generator.hr());

    // Filter items for bar workstation
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

    //feed and cut
    // bytes.addAll(generator.feed(2));
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

    bytes.addAll(generator.feed(1));
    // Bill Data
    bytes.addAll(
      await generateBillDataBytes(
        generator,
        paperSize,
        orderDetail.orderId,
        orderDetail.user,
        OrderTypeExtension.orderTypeToJson(orderDetail.orderType).toString(),
        orderDetail.tableNumber,
      ),
    );

    bytes.addAll(generator.hr());
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
    bytes.addAll(
      generator.text(
        'Selesai mencetak',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );

    //feed and cut
    bytes.addAll(generator.feed(2));
    bytes.addAll(generator.cut());

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

    bytes.addAll(generator.feed(1));
    // Bill Data
    bytes.addAll(
      await generateBillDataBytes(
        generator,
        paperSize,
        orderDetail.orderId,
        orderDetail.user,
        OrderTypeExtension.orderTypeToJson(orderDetail.orderType).toString(),
        orderDetail.tableNumber,
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
    bytes.addAll(
      generator.text(
        'Selesai',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );

    // bytes.addAll(generator.feed(4));
    //feed and cut
    bytes.addAll(generator.feed(2));
    bytes.addAll(generator.cut());

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

String formatPrice(int amount) {
  final formatter = NumberFormat.currency(
    locale: 'id_ID',
    symbol: '',
    decimalDigits: 0,
  );
  return formatter.format(amount);
}
