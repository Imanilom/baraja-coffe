import 'dart:convert';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'dart:io';
import 'dart:isolate';

import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/report/cash_recap_model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/network_discovery_service.dart';
import 'package:kasirbaraja/utils/payment_details_utils.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:image/image.dart' as img;
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class PrinterService {
  // Tambahkan fungsi helper untuk mengecek apakah ada items untuk workstation tertentu
  static bool _hasItemsForWorkstation(
    OrderDetailModel orderDetail,
    String jobType,
  ) {
    switch (jobType) {
      case 'kitchen':
        return orderDetail.items.any(
          (item) =>
              item.menuItem.workstation == 'kitchen' && item.isPrinted == false,
        );
      case 'bar':
        return orderDetail.items.any(
          (item) =>
              item.menuItem.workstation == 'bar' && item.isPrinted == false,
        );
      case 'customer':
      case 'waiter':
        // Customer dan waiter selalu print karena menampilkan semua items
        return orderDetail.items.isNotEmpty &&
            orderDetail.items.any((item) => item.isPrinted == false);
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
      AppLogger.info(
        '✅ Berhasil terhubung ke network printer ${printer.name} (${printer.address}:${printer.port})',
      );
      return socket;
    } catch (e) {
      AppLogger.error(
        '❌ Gagal terhubung ke network printer ${printer.name}',
        error: e,
      );
      return null;
    }
  }

  static Future<void> disconnectNetworkPrinter(Socket? socket) async {
    try {
      await socket?.close();
      AppLogger.info('✅ Koneksi network printer ditutup');
    } catch (e) {
      AppLogger.error('❌ Error saat menutup koneksi network printer', error: e);
    }
  }

  // static Future<void> printToPrinter(
  //   OrderDetailModel orderDetail,
  //   BluetoothPrinterModel printer,
  //   bool isKitchenReceipt,
  // ) async {
  //   await disconnectPrinter();
  //   await connectPrinter(printer);
  //   final bytes =
  //       isKitchenReceipt
  //           ? await generateKitchenBytes(orderDetail, printer)
  //           : await generateBarBytes(orderDetail, printer);
  //   final copies = isKitchenReceipt ? printer.kitchenCopies : printer.barCopies;
  //   for (var i = 0; i < copies; i++) {
  //     await PrintBluetoothThermal.writeBytes(bytes);
  //   }

  //   final customerBytes = await generateBarBytes(orderDetail, printer);

  //   await PrintBluetoothThermal.writeBytes(customerBytes);
  // }

  //new logic for printing
  static Future<void> printDocuments({
    required OrderDetailModel orderDetail,
    required String printType,
    required List<BluetoothPrinterModel> printers,
  }) async {
    final jobs = _createPrintJobs(printType);

    // AppLogger.debug('dokumen print ${orderDetail.items.toList()}');

    for (final job in jobs) {
      // if (printers.any((element) => element.connectionType == 'bluetooth')) {
      await _printJobToSupportedPrinters(
        orderDetail: orderDetail,
        jobType: job,
        printers: printers,
      );
      // }

      // if (printers.any((element) => element.connectionType == 'network')) {
      //   print('Mencetak $job di printer jaringan...');
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
      // }
      // print('Dokumen $job telah dicetak untuk ${orderDetail.orderId}');
    }
  }

  static List<String> _createPrintJobs(String printType) {
    final lowerPrintType = printType.toLowerCase();
    switch (lowerPrintType) {
      case 'customer':
        return ['customer'];
      case 'kitchen':
        return ['kitchen'];
      case 'bar':
        return ['bar'];
      case 'waiter':
        return ['waiter'];
      case 'kitchen_and_bar':
        return ['kitchen', 'bar'];
      case 'all':
        return ['kitchen', 'bar', 'waiter', 'customer'];
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
    // 1️⃣ Ambil daftar item yang punya delta quantity (belum tercetak)
    final deltas = _selectDeltasForJob(orderDetail, jobType);
    if (deltas.isEmpty) {
      AppLogger.warning('⚠️ Tidak ada delta item untuk $jobType');
      return;
    }

    // 2️⃣ Buat daftar item dengan quantity hanya delta-nya
    final itemsToPrint =
        deltas.map((t) {
          final (idx, delta) = t;
          final src = orderDetail.items[idx];
          return src.copyWith(quantity: delta);
        }).toList();

    // 3️⃣ Cari printer yang mendukung jobType ini
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
      AppLogger.warning('⚠️ Tidak ada printer yang mendukung $jobType');
      return;
    }

    AppLogger.info(
      '📤 Mencetak $jobType di ${supportedPrinters.length} printer',
    );

    // var anySuccess = false;
    for (final printer in supportedPrinters) {
      AppLogger.debug(
        '📤 Mencetak printer coba: $jobType di ${printer.connectionType} (${printer.address})',
      );
      await _printSingleJob(
        orderDetail: orderDetail,
        printer: printer,
        jobType: jobType,
        itemsToPrint: itemsToPrint, // 🔹 kirim item delta
        batchLabel: _batchLabel(orderDetail), // 🔹 label Cetak Awal / Tambahan
      );
      // anySuccess = anySuccess || ok;
    }

    // 4️⃣ Jika cetak sukses → tandai printedQuantity bertambah
    // if (anySuccess) {
    //   for (final (idx, delta) in deltas) {
    //     final cur = orderDetail.items[idx];
    //     final newPrinted = (cur.printedQuantity ?? 0) + delta;
    //     orderDetail.items[idx] = cur.copyWith(printedQuantity: newPrinted);
    //     // optional: append batchId, mis. ts:
    //     // orderDetail.items[idx].printBatchIds = [...cur.printBatchIds, batchId];
    //   }
    //   // orderDetail.printSequence =
    //   //     (orderDetail.printSequence) + 1; // naikkan sequence
    //   print('✅ Tambah printedQuantity & increment printSequence');
    // }
  }

  static Future<bool> _printSingleJob({
    required OrderDetailModel orderDetail,
    required BluetoothPrinterModel printer,
    required String jobType,
    required List<OrderItemModel> itemsToPrint,
    required String batchLabel,
  }) async {
    try {
      AppLogger.info(
        '📤 Mencetak $jobType di ${printer.name} (${printer.address})',
      );

      final bytes = await _generateBytesForJob(
        orderDetail: orderDetail,
        printer: printer,
        jobType: jobType,
        itemsOverride: itemsToPrint, // <-- kirim delta items
        headerOverride: batchLabel, // <-- (lihat bagian generator)
      );

      final copies = _getCopiesForJob(printer, jobType);

      if (printer.connectionType == 'bluetooth') {
        await connectPrinter(printer);
        for (int i = 0; i < copies; i++) {
          final result = await PrintBluetoothThermal.writeBytes(
            bytes,
          ).then((_) => true).catchError((_) => false);
          if (result) {
            AppLogger.info('Salinan $i+1 dari $copies untuk $jobType dicetak.');
          }
        }
      }
      if (printer.connectionType == 'network') {
        for (int i = 0; i < copies; i++) {
          await NetworkDiscoveryService.testPrintToNetworkPrinter(
            printer,
            bytes,
          );
        }
      }
      return true;
    } catch (e) {
      AppLogger.error('❌ Gagal mencetak $jobType di ${printer.name}', error: e);
      return false;
    } finally {
      if (printer.connectionType == 'bluetooth') {
        //delay
        await Future.delayed(const Duration(seconds: 1));
        await disconnectPrinter();
      }
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
    List<OrderItemModel>? itemsOverride,
    String? headerOverride,
  }) async {
    switch (jobType) {
      case 'kitchen':
        return generateKitchenBytes(
          orderDetail,
          printer,
          itemsOverride,
          headerOverride,
        );
      case 'bar':
        return generateBarBytes(
          orderDetail,
          printer,
          itemsOverride,
          headerOverride,
        );
      case 'customer':
        return generateCustomerBytes(
          orderDetail,
          printer,
          // kalau mau customer juga hanya delta, tambahkan params serupa
        );
      case 'waiter':
        return generateWaiterBytes(
          orderDetail,
          printer,
          itemsOverride,
          headerOverride,
          // idem
        );
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
      AppLogger.debug('Paper Size: ${printer.paperSize}');
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

      // Logo
      bytes.addAll(
        await generateOptimizedLogoBytes(
          generator,
          'assets/logo/logo_baraja.png',
          paperSize,
        ),
      );

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

      final result = await PrintBluetoothThermal.writeBytes(
        bytes,
      ).then((_) => true).catchError((_) => false);

      return result;
    } catch (e) {
      AppLogger.error('Print error', error: e);
      return false;
    } finally {
      //delay
      await Future.delayed(const Duration(seconds: 1));
      await disconnectPrinter();
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
        await generateOptimizedLogoBytes(
          generator,
          'assets/logo/logo_baraja.svg',
          // 'assets/logo/logo_baraja.webp',
          // 'assets/logo/logo_baraja.png',
          paperSize,
        ),
      );
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
      AppLogger.error('Print error', error: e);
      return false;
    }
  }

  static Future<List<int>> generateLogoBytess(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    try {
      final ByteData byteData = await rootBundle.load(imagePath);
      final Uint8List imageBytes = byteData.buffer.asUint8List();

      final image = img.decodeImage(imageBytes)!;

      // Resize gambar sesuai lebar kertas
      final resizedImage = img.copyResize(image, width: 300);

      // Konversi ke grayscale
      final grayscaleImage = img.grayscale(resizedImage);

      bytes.addAll(generator.image(grayscaleImage));
      AppLogger.debug('Logo image loaded and processed successfully.');
      bytes.addAll(generator.feed(1));
    } catch (e) {
      AppLogger.error('Error loading logo image', error: e);
      // Fallback: kalau gambar gagal, cetak nama toko saja
      bytes.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      bytes.addAll(generator.feed(1));
    }

    return bytes;
  }

  static Future<List<int>> generateBasicLogoBytes(
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

  static Future<List<int>> generateLogoBytes(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final out = <int>[];

    // Lebar aman untuk 58mm/80mm
    final int maxWidth = paperSize == PaperSize.mm80 ? 576 : 384;
    final int targetWidth = (maxWidth * 0.75).floor(); // 75% = aman

    try {
      final bd = await rootBundle.load(imagePath); // PNG/JPG
      final Uint8List raw = bd.buffer.asUint8List();

      img.Image src = img.decodeImage(raw)!;

      // Resize lebih kecil
      src = img.copyResize(
        src,
        width: src.width > targetWidth ? targetWidth : src.width,
      );

      // Ubah ke BW (bukan grayscale) supaya datanya kecil
      // opsi 1: threshold
      src = img.grayscale(src);
      src = img.luminanceThreshold(src, threshold: 160); // sesuaikan 160–200

      // Penting: pastikan buffer growable
      final Uint8List grow = Uint8List.fromList(src.toUint8List());
      final img.Image safe = img.Image.fromBytes(
        width: src.width,
        height: src.height,
        bytes: grow.buffer,
        numChannels: src.numChannels,
      );

      // Raster mode tanpa high density
      out.addAll(
        generator.imageRaster(
          safe,
          align: PosAlign.center,
          highDensityHorizontal: false,
          highDensityVertical: false,
        ),
      );

      out.addAll(generator.feed(1)); // nudge head maju
    } catch (e, st) {
      AppLogger.error('Gagal render logo', error: e, stackTrace: st);

      // Fallback: teks saja
      out.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      out.addAll(generator.feed(1));
    }

    return out;
  }

  /// Pastikan image dalam format 8-bit grayscale
  static img.Image _ensureGrayscale8Bit(img.Image image) {
    // Jika sudah grayscale dan 8-bit, return as is
    if (image.numChannels == 1) {
      return image;
    }

    // Buat image baru dengan format yang benar
    final img.Image grayscale = img.Image(
      width: image.width,
      height: image.height,
      numChannels: 1, // Grayscale = 1 channel
    );

    // Copy pixel by pixel
    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        // Ambil luminance sebagai nilai grayscale
        final gray = pixel.r.toInt();
        grayscale.setPixelRgb(x, y, gray, gray, gray);
      }
    }

    return grayscale;
  }

  /// Alternatif: gunakan image() method alih-alih imageRaster()
  static Future<List<int>> generateLogoBytesAlternative(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final List<int> out = [];

    try {
      final bd = await rootBundle.load(imagePath);
      final Uint8List raw = bd.buffer.asUint8List();

      img.Image? decodedImage = img.decodeImage(raw);
      if (decodedImage == null) {
        throw Exception('Gagal decode image');
      }

      final maxWidth = (paperSize == PaperSize.mm80) ? 576 : 384;
      final targetWidth = (maxWidth * 0.85).floor();

      img.Image resized = decodedImage;
      if (decodedImage.width > targetWidth) {
        resized = img.copyResize(decodedImage, width: targetWidth);
      }

      final img.Image processedImage = img.grayscale(resized);

      // Coba pakai method image() sebagai alternatif
      out.addAll(generator.image(processedImage, align: PosAlign.center));
      out.addAll(generator.feed(1));
    } catch (e, st) {
      AppLogger.error('Gagal render logo', error: e, stackTrace: st);
      out.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      out.addAll(generator.feed(1));
    }

    return out;
  }

  static Future<List<int>> generateOptimizedLogoBytes(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    try {
      final ByteData byteData = await rootBundle.load(imagePath);
      final Uint8List imageBytes = byteData.buffer.asUint8List();
      final image = img.decodeImage(imageBytes);

      if (image == null) return [];

      // Optimize untuk thermal printer
      int maxWidth;
      switch (paperSize) {
        case PaperSize.mm58:
          maxWidth = 180;
          break;
        case PaperSize.mm72:
          maxWidth = 220;
          break;
        case PaperSize.mm80:
          maxWidth = 280;
          break;
        default:
          maxWidth = 200;
      }

      // Resize dengan maintain aspect ratio
      final ratio = image.height / image.width;
      final targetWidth = image.width > maxWidth ? maxWidth : image.width;
      final targetHeight = (targetWidth * ratio).round();

      final resizedImage = img.copyResize(
        image,
        width: targetWidth,
        height: targetHeight,
      );

      // Convert to 1-bit bitmap (black & white) untuk thermal printer
      final grayscaleImage = img.grayscale(resizedImage);

      // Apply threshold untuk meningkatkan kontras
      for (var y = 0; y < grayscaleImage.height; y++) {
        for (var x = 0; x < grayscaleImage.width; x++) {
          final pixel = grayscaleImage.getPixel(x, y);
          final luminance = img.getLuminance(pixel);
          // Threshold: pixel > 128 jadi putih, else hitam
          final newColor = luminance > 128 ? 255 : 0;
          grayscaleImage.setPixel(
            x,
            y,
            img.ColorRgb8(newColor, newColor, newColor),
          );
        }
      }

      final List<int> bytes = [];
      bytes.addAll(generator.image(grayscaleImage));
      bytes.addAll(generator.feed(1));

      return bytes;
    } catch (e) {
      AppLogger.error('Error optimized logo', error: e);
      return [];
    }
  }

  static const String logoBase64 =
      "data:image/png;base64,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";

  static Future<List<int>> generateLogoBytesBase64(
    Generator generator,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    try {
      // Decode dari base64
      final Uint8List imageBytes = base64Decode(logoBase64);
      final img.Image? image = img.decodeImage(imageBytes);

      if (image == null) throw Exception('Decode failed');

      final resized = img.copyResize(image, width: 300);
      final grayscale = img.grayscale(resized);

      bytes.addAll(generator.image(grayscale, align: PosAlign.center));
      bytes.addAll(generator.feed(1));
    } catch (e) {
      // Fallback
    }

    return bytes;
  }

  static Future<List<int>> basiclogo(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    // 1. Siapkan konten
    final List<int> bytes = [];

    // Header
    // final ByteData byteData = await rootBundle.load(imagePath);
    // final Uint8List imageBytes = byteData.buffer.asUint8List();
    // final image = img.decodeImage(imageBytes)!;
    final ByteData data = await rootBundle.load(imagePath);
    final Uint8List byte = data.buffer.asUint8List();
    final image = img.decodeImage(byte)!;

    bytes.addAll(generator.image(image));
    bytes.addAll(generator.feed(1));

    return bytes;
  }

  static Future<List<int>> generateHeadersBytes(
    Generator generator,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    // Logo
    bytes.addAll(generator.feed(2));
    bytes.addAll(
      await generateBasicLogoBytes(
        generator,
        // 'assets/logo/logo_baraja.svg',
        // 'assets/logo/logo_baraja.webp',
        'assets/logo/logo_baraja.png',
        paperSize,
      ),
      // generator.text(
      //   'Baraja Amphitheater',
      //   styles: const PosStyles(
      //     align: PosAlign.center,
      //     bold: true,
      //     height: PosTextSize.size2,
      //   ),
      // ),
    );
    bytes.addAll(generator.feed(1));

    // Alamat Toko
    bytes.addAll(
      generator.text(
        'Jl. Tuparev No. 60, Kec. Kedawung, Kab. Cirebon, 45153\n0851-1708-9827',
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
        generator.text(
          item.menuItem.name!,
          styles: PosStyles(bold: true, align: PosAlign.left),
        ),
      );
      if (item.selectedAddons.isNotEmpty) {
        if (item.selectedAddons
            .map((x) => x.options)
            .where((element) => element != null)
            .isNotEmpty) {
          bytes.addAll(
            generator.row([
              PosColumn(
                text: '',
                width: 1,
                styles: const PosStyles(align: PosAlign.left),
              ),
              PosColumn(
                text: item.selectedAddons
                    .map((x) {
                      final addon =
                          "${x.name}: ${x.options!.map((x) {
                            final option = "${x.label}${x.price != 0 ? '(+${x.price})' : ''}";
                            return option;
                          }).join(', ')}";
                      return addon;
                    })
                    .join(', '),
                width: 8,
                styles: const PosStyles(align: PosAlign.left),
              ),
              PosColumn(
                text: ' ',
                width: 3,
                styles: const PosStyles(align: PosAlign.left),
              ),
            ]),
          );
        }
      }

      if (item.selectedToppings.isNotEmpty) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: '',
              width: 1,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text:
                  '+${item.selectedToppings.map((x) {
                    final topping = "${x.name}${x.price != 0 ? '(+${x.price})' : ''}";
                    return topping;
                  }).join(', ')}',
              width: 8,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: ' ',
              width: 3,
              styles: const PosStyles(align: PosAlign.left),
            ),
          ]),
        );
      }

      if (item.notes != null &&
          item.notes!.isNotEmpty &&
          item.notes!.trim().isNotEmpty) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: '',
              width: 1,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: '"${item.notes}" ',
              width: 11,
              styles: const PosStyles(align: PosAlign.left),
            ),
          ]),
        );
      }
      bytes.addAll(
        generator.row([
          PosColumn(
            text: item.menuItem.originalPrice.toString(),
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
      bytes.addAll(generator.feed(1));
    }
    if (orderDetail.customAmountItems != null &&
        orderDetail.customAmountItems!.isNotEmpty) {
      for (var customItem in orderDetail.customAmountItems ?? []) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: customItem.name ?? 'Custom Amount',
              width: 7,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: formatPrice(customItem.amount).toString(),
              width: 5,
              styles: const PosStyles(align: PosAlign.right),
            ),
          ]),
        );
      }
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
          text: formatPrice(orderDetail.totalBeforeDiscount).toString(),
          width: 6,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    if (orderDetail.discounts != null &&
        orderDetail.discounts?.totalDiscount != 0) {
      bytes.addAll(
        generator.row([
          PosColumn(
            text:
                orderDetail.appliedPromos?.map((x) => x.promoName).join(', ') ??
                '',
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text:
                "- ${formatPrice(orderDetail.discounts?.totalDiscount ?? 0).toString()}",
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
    }
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Pajak',
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
    bytes.addAll(generator.hr(ch: '='));
    AppLogger.debug('bersiap untuk menulis pembayaran');
    // ✅ FIXED: Check order status for more accurate paid/unpaid determination
    final bool isPaid =
        orderDetail.status == 'Completed' ||
        (orderDetail.paymentStatus?.toLowerCase() == 'settlement');

    if (isPaid) {
      if (isOrderDetailSplitPayment(orderDetail)) {
        AppLogger.debug('isSplitPayment: ${orderDetail.isSplitPayment}');
        bytes.addAll(generator.feed(1));
        for (var payment in orderDetail.payments) {
          bytes.addAll(
            generator.row([
              PosColumn(
                text: PaymentDetails.buildPaymentMethodLabel(payment),
                width: 6,
                styles: const PosStyles(align: PosAlign.left),
              ),
              PosColumn(
                //tampilkan metode pembyaran yang paymentnya statusnya 'settlement'
                text:
                    formatPrice(
                      payment.tenderedAmount == 0
                          ? payment.amount
                          : payment.tenderedAmount ?? 0,
                    ).toString(),
                width: 6,
                styles: const PosStyles(align: PosAlign.right),
              ),
            ]),
          );

          bytes.addAll(generator.hr());

          bytes.addAll(
            generator.row([
              PosColumn(
                text: 'Kembalian',
                width: 6,
                styles: const PosStyles(align: PosAlign.left),
              ),
              PosColumn(
                text: formatPrice(payment.changeAmount ?? 0).toString(),
                width: 6,
                styles: const PosStyles(align: PosAlign.right),
              ),
            ]),
          );
          bytes.addAll(generator.feed(1));
        }
      } else {
        AppLogger.debug('brarti tidak ada order detail');
        bytes.addAll(
          generator.row([
            PosColumn(
              text: 'Metode',
              width: 6,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              //tampilkan metode pembyaran yang paymentnya statusnya 'settlement'
              text:
                  "${orderDetail.paymentMethod ?? ""} ${orderDetail.paymentType ?? ""}",
              width: 6,
              styles: const PosStyles(align: PosAlign.right),
            ),
          ]),
        );

        bytes.addAll(
          generator.row([
            PosColumn(
              text: 'Diterima',
              width: 6,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: formatPrice(orderDetail.paymentAmount).toString(),
              width: 6,
              styles: const PosStyles(align: PosAlign.right),
            ),
          ]),
        );
        bytes.addAll(generator.hr());

        bytes.addAll(
          generator.row([
            PosColumn(
              text: 'Kembalian',
              width: 6,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: formatPrice(orderDetail.changeAmount).toString(),
              width: 6,
              styles: const PosStyles(align: PosAlign.right),
            ),
          ]),
        );
      }
    }

    bytes.addAll(generator.hr(ch: '='));

    //footer
    final footerBytes = await generateFooterBytes(
      generator,
      paperSize,
      orderDetail,
    );
    bytes.addAll(footerBytes);

    //feed and cut
    // bytes.addAll(generator.feed(2));
    bytes.addAll(generator.cut());

    return bytes;
  }

  static Future<List<int>> generateBarBytes(
    OrderDetailModel orderDetail,
    BluetoothPrinterModel printer,
    List<OrderItemModel>? itemsOverride, // delta items
    String? headerOverride,
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

    if (headerOverride != null) {
      bytes.addAll(
        generator.text(
          headerOverride,
          styles: const PosStyles(align: PosAlign.center, underline: true),
        ),
      );
    }

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
    // final orderdetail =
    //     orderDetail.items
    //         .where((item) => item.menuItem.workstation == 'bar')
    //         .toList();

    // Items yang dipakai: delta (itemsOverride) jika ada
    final orderdetail =
        (itemsOverride ??
            orderDetail.items
                .where((it) => it.menuItem.workstation == 'kitchen')
                .toList());
    //list order Items
    for (var item in orderdetail) {
      bytes.addAll(
        generator.row([
          PosColumn(
            text: OrderTypeExtension.orderTypeToShortJson(item.orderType),
            width: 1,
            styles: const PosStyles(
              align: PosAlign.left,
              bold: true,
              underline: true,
            ),
          ),
          PosColumn(
            text: item.menuItem.name!,
            width: 8,
            styles: const PosStyles(align: PosAlign.left, bold: true),
          ),
          PosColumn(
            text: 'x${item.quantity.toString()}',
            width: 3,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      if (item.selectedAddons.isNotEmpty) {
        if (item.selectedAddons
            .map((x) => x.options)
            .where((element) => element != null)
            .isNotEmpty) {
          bytes.addAll(
            generator.row([
              PosColumn(
                text: ' ',
                width: 2,
                styles: const PosStyles(align: PosAlign.left),
              ),
              PosColumn(
                text: item.selectedAddons
                    .map((x) {
                      final addon =
                          "${x.name}: ${x.options!.map((x) => x.label).join(', ')}";
                      return addon;
                    })
                    .join(', '),
                width: 10,
                styles: const PosStyles(align: PosAlign.left),
              ),
            ]),
          );
        }
      }
      if (item.selectedToppings.isNotEmpty) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: ' ',
              width: 2,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text:
                  '+${item.selectedToppings.map((x) {
                    final topping = "${x.name}${x.price != 0 ? '(+${x.price})' : ''}";
                    return topping;
                  }).join(', ')}',
              width: 10,
              styles: const PosStyles(align: PosAlign.left),
            ),
          ]),
        );
      }
      if (item.notes != null &&
          item.notes!.isNotEmpty &&
          item.notes!.trim().isNotEmpty) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: ' ',
              width: 2,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: '  Catatan: ${item.notes}',
              width: 10,
              styles: const PosStyles(align: PosAlign.left),
            ),
          ]),
        );
      }
      bytes.addAll(generator.feed(1));
    }

    // Custom Amount
    if (orderDetail.customAmountItems != null &&
        orderDetail.customAmountItems!.isNotEmpty) {
      for (var customItem in orderDetail.customAmountItems ?? []) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: OrderTypeExtension.orderTypeToShortJson(
                customItem.orderType,
              ),
              width: 1,
              styles: const PosStyles(
                align: PosAlign.left,
                bold: true,
                underline: true,
              ),
            ),
            PosColumn(
              text: customItem.name ?? 'Custom Amount',
              width: 7,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: '',
              width: 4,
              styles: const PosStyles(align: PosAlign.right),
            ),
          ]),
        );
      }
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
    List<OrderItemModel>? itemsOverride, // delta items
    String? headerOverride,
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

    if (headerOverride != null) {
      bytes.addAll(
        generator.text(
          headerOverride,
          styles: const PosStyles(align: PosAlign.center, underline: true),
        ),
      );
    }

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
    AppLogger.debug('print kitchen ${orderDetail.items}');

    // final orderdetail =
    //     orderDetail.items
    //         .where((item) => item.menuItem.workstation == 'kitchen')
    //         .toList();
    final orderdetail =
        (itemsOverride ??
            orderDetail.items
                .where((it) => it.menuItem.workstation == 'kitchen')
                .toList());
    AppLogger.debug('print kitchen $orderdetail');
    for (var item in orderdetail) {
      bytes.addAll(
        generator.row([
          PosColumn(
            text: OrderTypeExtension.orderTypeToShortJson(item.orderType),
            width: 1,
            styles: const PosStyles(
              align: PosAlign.left,
              bold: true,
              underline: true,
            ),
          ),
          PosColumn(
            text: item.menuItem.name!,
            width: 8,
            styles: const PosStyles(align: PosAlign.left, bold: true),
          ),
          PosColumn(
            text: 'x${item.quantity.toString()}',
            width: 3,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      if (item.selectedAddons.isNotEmpty) {
        if (item.selectedAddons
            .map((x) => x.options)
            .where((element) => element != null)
            .isNotEmpty) {
          bytes.addAll(
            generator.row([
              PosColumn(
                text: ' ',
                width: 2,
                styles: const PosStyles(align: PosAlign.left),
              ),
              PosColumn(
                text: item.selectedAddons
                    .map((x) {
                      final addon =
                          "${x.name}: ${x.options!.map((x) => x.label).join(', ')}";
                      return addon;
                    })
                    .join(', '),
                width: 10,
                styles: const PosStyles(align: PosAlign.left),
              ),
            ]),
          );
        }
      }
      if (item.selectedToppings.isNotEmpty) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: ' ',
              width: 2,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text:
                  '+${item.selectedToppings.map((x) {
                    final topping = "${x.name}${x.price != 0 ? '(+${x.price})' : ''}";
                    return topping;
                  }).join(', ')}',
              width: 10,
              styles: const PosStyles(align: PosAlign.left),
            ),
          ]),
        );
      }
      //jangan tampilkan catatan jika isinya hanya spasi
      if (item.notes != null &&
          item.notes!.isNotEmpty &&
          item.notes!.trim().isNotEmpty) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: ' ',
              width: 2,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: '  Catatan: ${item.notes}',
              width: 10,
              styles: const PosStyles(align: PosAlign.left),
            ),
          ]),
        );
      }
      bytes.addAll(generator.feed(1));
    }
    // Custom Amount
    if (orderDetail.customAmountItems != null &&
        orderDetail.customAmountItems!.isNotEmpty) {
      for (var customItem in orderDetail.customAmountItems ?? []) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: OrderTypeExtension.orderTypeToShortJson(
                customItem.orderType,
              ),
              width: 1,
              styles: const PosStyles(
                align: PosAlign.left,
                bold: true,
                underline: true,
              ),
            ),
            PosColumn(
              text: customItem.name ?? 'Custom Amount',
              width: 7,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: '',
              width: 4,
              styles: const PosStyles(align: PosAlign.right),
            ),
          ]),
        );
      }
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
    List<OrderItemModel>? itemsOverride, // delta items
    String? headerOverride,
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

    // Header - Payment Status
    // ✅ FIXED: Check order status for more accurate paid/unpaid determination
    final bool isPaid =
        orderDetail.status == 'Completed' ||
        (orderDetail.paymentStatus?.toLowerCase() == 'settlement');

    bytes.addAll(
      generator.text(
        isPaid ? 'Lunas' : 'Belum Lunas',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
        ),
      ),
    );
    if (headerOverride != null) {
      bytes.addAll(
        generator.text(
          headerOverride,
          styles: const PosStyles(align: PosAlign.center, underline: true),
        ),
      );
    }
    bytes.addAll(
      generator.text(
        orderDetail.orderId ?? 'Order ID',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
        ),
      ),
    );
    bytes.addAll(generator.feed(1));

    // Bill Data
    // bytes.addAll(
    //   await generateBillDataBytes(
    //     generator,
    //     paperSize,
    //     orderDetail.orderId,
    //     orderDetail.user,
    //     OrderTypeExtension.orderTypeToJson(orderDetail.orderType).toString(),
    //     orderDetail.tableNumber,
    //   ),
    // );

    bytes.addAll(generator.hr());

    // final orderdetail = orderDetail.items;
    // Items yang dipakai: delta (itemsOverride) jika ada
    final orderdetail =
        (itemsOverride ??
            orderDetail.items
                .where((it) => it.menuItem.workstation == 'kitchen')
                .toList());
    //list order Items
    for (var item in orderdetail) {
      bytes.addAll(
        generator.row([
          PosColumn(
            text: OrderTypeExtension.orderTypeToShortJson(item.orderType),
            width: 1,
            styles: const PosStyles(
              align: PosAlign.left,
              bold: true,
              underline: true,
            ),
          ),
          PosColumn(
            text: item.menuItem.name!,
            width: 8,
            styles: const PosStyles(align: PosAlign.left, bold: true),
          ),
          PosColumn(
            text: 'x${item.quantity.toString()}',
            width: 3,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
    }
    // Custom Amount
    if (orderDetail.customAmountItems != null &&
        orderDetail.customAmountItems!.isNotEmpty) {
      for (var customItem in orderDetail.customAmountItems ?? []) {
        bytes.addAll(
          generator.row([
            PosColumn(
              text: OrderTypeExtension.orderTypeToShortJson(
                customItem.orderType,
              ),
              width: 1,
              styles: const PosStyles(
                align: PosAlign.left,
                bold: true,
                underline: true,
              ),
            ),
            PosColumn(
              text: customItem.name ?? 'Custom Amount',
              width: 7,
              styles: const PosStyles(align: PosAlign.left),
            ),
            PosColumn(
              text: '',
              width: 4,
              styles: const PosStyles(align: PosAlign.right),
            ),
          ]),
        );
      }
    }
    bytes.addAll(generator.hr());

    bytes.addAll(generator.feed(1));
    if (orderDetail.tableNumber != null &&
        orderDetail.tableNumber!.isNotEmpty) {
      bytes.addAll(
        generator.text(
          'Meja ${orderDetail.tableNumber}',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
            width: PosTextSize.size2,
          ),
        ),
      );
    }
    bytes.addAll(generator.feed(1));
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
    OrderDetailModel orderDetail,
  ) async {
    final List<int> bytes = [];
    // Footer
    // ✅ FIXED: Check order status for more accurate paid/unpaid determination
    final bool isLunas =
        orderDetail.status == 'Completed' ||
        (orderDetail.paymentStatus?.toLowerCase() == 'settlement');

    bytes.addAll(
      generator.text(
        isLunas ? '** LUNAS **' : '** BELUM LUNAS **',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
        ),
      ),
    );
    bytes.addAll(generator.feed(1));
    bytes.addAll(
      generator.text(
        'Password WiFi: acaradibaraja',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );
    bytes.addAll(generator.feed(1));
    bytes.addAll(
      generator.text(
        'Mari Menjadi Bagian Budaya di Baraja Amphitheater',
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

  //print rekap kasir
  static Future<List<int>> generateRekapKasirBytes(
    Generator generator,
    PaperSize paperSize,
    List<OrderDetailModel> orderDetails,
  ) async {
    final List<int> bytes = [];

    // Header
    bytes.addAll(
      generator.text(
        'Rekap Kasir',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          height: PosTextSize.size2,
          width: PosTextSize.size2,
        ),
      ),
    );

    bytes.addAll(generator.feed(1));
    bytes.addAll(generator.hr());

    int totalSales = 0;

    for (var order in orderDetails) {
      bytes.addAll(
        generator.row([
          PosColumn(
            text: order.orderId ?? 'Order ID',
            width: 6,
            styles: const PosStyles(align: PosAlign.left),
          ),
          PosColumn(
            text: formatPrice(order.grandTotal).toString(),
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]),
      );
      totalSales += order.grandTotal;
    }

    bytes.addAll(generator.hr());
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Total Penjualan',
          width: 6,
          styles: const PosStyles(align: PosAlign.left, bold: true),
        ),
        PosColumn(
          text: formatPrice(totalSales).toString(),
          width: 6,
          styles: const PosStyles(align: PosAlign.right, bold: true),
        ),
      ]),
    );

    bytes.addAll(generator.feed(2));
    bytes.addAll(generator.cut());

    return bytes;
  }

  //membuat method untuk mengtahui orderdetail split payment atau tidak
  static bool isOrderDetailSplitPayment(OrderDetailModel orderDetail) {
    AppLogger.debug(orderDetail.payments);
    if (orderDetail.payments.isEmpty) return false;

    return true; //orderdetail
  }

  static List<(int index, int deltaQty)> _selectDeltasForJob(
    OrderDetailModel od,
    String jobType,
  ) {
    bool matchWS(String? ws) => switch (jobType) {
      'kitchen' => (ws?.toLowerCase().trim() == 'kitchen'),
      'bar' => (ws?.toLowerCase().trim() == 'bar'),
      'customer' || 'waiter' => true,
      _ => false,
    };

    final out = <(int, int)>[];
    for (int i = 0; i < od.items.length; i++) {
      final it = od.items[i];
      if (!matchWS(it.menuItem.workstation)) continue;
      final delta = (it.quantity - (it.printedQuantity ?? 0));
      if (delta > 0) out.add((i, delta));
    }
    return out;
  }

  static String _batchLabel(OrderDetailModel od) {
    return (od.printSequence > 0)
        ? 'Cetak Tambahan #${od.printSequence + 1}'
        : '';
  }
}

class ThermalPrinter {
  /// ✅ SOLUSI 1: Process image di Isolate (non-blocking)
  static Future<List<int>> generateLogoBytes(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    try {
      AppLogger.debug('🔄 Loading & processing image...');

      // Load asset
      final ByteData byteData = await rootBundle.load(imagePath);
      final Uint8List imageBytes = byteData.buffer.asUint8List();

      // Process di isolate agar tidak blocking
      final processedImage = await _processImageInIsolate(
        imageBytes,
        paperSize,
      );

      if (processedImage == null) {
        throw Exception('Failed to process image');
      }

      AppLogger.debug('✅ Image processed, generating bytes...');

      // Generate bytes
      bytes.addAll(generator.image(processedImage, align: PosAlign.center));
      bytes.addAll(generator.feed(1));

      AppLogger.debug('✅ Done: ${bytes.length} bytes');
    } catch (e, st) {
      AppLogger.error('❌ Error', error: e, stackTrace: st);
      // Fallback
      bytes.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      bytes.addAll(generator.feed(1));
    }

    return bytes;
  }

  /// Process image di isolate terpisah
  static Future<img.Image?> _processImageInIsolate(
    Uint8List imageBytes,
    PaperSize paperSize,
  ) async {
    final receivePort = ReceivePort();

    await Isolate.spawn(
      _imageProcessingIsolate,
      _IsolateData(
        imageBytes: imageBytes,
        paperSize: paperSize,
        sendPort: receivePort.sendPort,
      ),
    );

    return await receivePort.first as img.Image?;
  }

  /// Isolate worker function
  static void _imageProcessingIsolate(_IsolateData data) {
    try {
      // Decode
      final img.Image? image = img.decodeImage(data.imageBytes);
      if (image == null) {
        data.sendPort.send(null);
        return;
      }

      // Resize
      final maxWidth = (data.paperSize == PaperSize.mm80) ? 576 : 384;
      final targetWidth = (maxWidth * 0.6).floor(); // 60% untuk safety

      img.Image resized = image;
      if (image.width > targetWidth) {
        resized = img.copyResize(image, width: targetWidth);
      }

      // Grayscale
      final grayscale = img.grayscale(resized);

      data.sendPort.send(grayscale);
    } catch (e) {
      data.sendPort.send(null);
    }
  }

  /// ✅ SOLUSI 2: Optimized version (lebih ringan, no isolate)
  static Future<List<int>> generateLogoBytesOptimized(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    try {
      // Load asset
      final ByteData byteData = await rootBundle.load(imagePath);
      final Uint8List imageBytes = byteData.buffer.asUint8List();

      // Decode
      final img.Image? image = img.decodeImage(imageBytes);
      if (image == null) throw Exception('Decode failed');

      // PENTING: Ukuran lebih kecil untuk performa
      final maxWidth =
          (paperSize == PaperSize.mm80) ? 384 : 256; // Lebih kecil!
      final targetWidth = (maxWidth * 0.5).floor(); // 50% saja

      // Resize dengan interpolasi cubic (lebih cepat dari lanczos)
      final resized = img.copyResize(
        image,
        width: targetWidth,
        interpolation: img.Interpolation.average, // Lebih cepat
      );

      // Grayscale
      final grayscale = img.grayscale(resized);

      // PENTING: Gunakan highDensity = false untuk performa
      bytes.addAll(generator.image(grayscale, align: PosAlign.center));
      bytes.addAll(generator.feed(1));
    } catch (e, st) {
      AppLogger.error('❌ Error', error: e, stackTrace: st);
      bytes.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      bytes.addAll(generator.feed(1));
    }

    return bytes;
  }

  /// ✅ SOLUSI 3: Pre-process image sekali saja (cache)
  static img.Image? _cachedLogo;

  static Future<List<int>> generateLogoBytesCached(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    try {
      // Load & cache image sekali saja
      if (_cachedLogo == null) {
        AppLogger.debug('🔄 First time load, caching image...');

        final ByteData byteData = await rootBundle.load(imagePath);
        final Uint8List imageBytes = byteData.buffer.asUint8List();

        final img.Image? image = img.decodeImage(imageBytes);
        if (image == null) throw Exception('Decode failed');

        final maxWidth = (paperSize == PaperSize.mm80) ? 384 : 256;
        final targetWidth = (maxWidth * 0.5).floor();

        final resized = img.copyResize(
          image,
          width: targetWidth,
          interpolation: img.Interpolation.average,
        );

        _cachedLogo = img.grayscale(resized);
        AppLogger.debug('✅ Image cached');
      }

      // Gunakan cached image
      bytes.addAll(generator.image(_cachedLogo!, align: PosAlign.center));
      bytes.addAll(generator.feed(1));
    } catch (e) {
      debugPrint('❌ Error: $e');
      bytes.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      bytes.addAll(generator.feed(1));
    }

    return bytes;
  }

  /// Clear cache jika perlu ganti logo
  static void clearLogoCache() {
    _cachedLogo = null;
  }
}

/// Data class untuk isolate
class _IsolateData {
  final Uint8List imageBytes;
  final PaperSize paperSize;
  final SendPort sendPort;

  _IsolateData({
    required this.imageBytes,
    required this.paperSize,
    required this.sendPort,
  });
}

class ThermalPrinters {
  /// ✅ SOLUSI FINAL: Growable buffer untuk fix "fixed-length list" error
  static Future<List<int>> generateLogoBytes(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    try {
      debugPrint('🔄 Loading image...');

      // Load asset
      final ByteData byteData = await rootBundle.load(imagePath);
      final Uint8List imageBytes = byteData.buffer.asUint8List();

      // Decode
      final img.Image? decodedImage = img.decodeImage(imageBytes);
      if (decodedImage == null) {
        throw Exception('Failed to decode image');
      }

      AppLogger.debug(
        '📐 Original: ${decodedImage.width}x${decodedImage.height}',
      );

      // Resize
      final maxWidth = (paperSize == PaperSize.mm80) ? 384 : 256;
      final targetWidth = (maxWidth * 0.6).floor();

      img.Image resized = decodedImage;
      if (decodedImage.width > targetWidth) {
        resized = img.copyResize(
          decodedImage,
          width: targetWidth,
          interpolation: img.Interpolation.average,
        );
      }

      // Grayscale
      final grayscale = img.grayscale(resized);

      AppLogger.debug('📐 Processed: ${grayscale.width}x${grayscale.height}');

      // ⭐ KUNCI UTAMA: Clone ke growable buffer
      final img.Image growableImage = _makeGrowableBuffer(grayscale);

      AppLogger.debug('✅ Growable buffer created');

      // Generate bytes
      bytes.addAll(generator.image(growableImage, align: PosAlign.center));
      bytes.addAll(generator.feed(1));

      AppLogger.debug('✅ Done: ${bytes.length} bytes');
    } catch (e, st) {
      AppLogger.error('❌ Error', error: e, stackTrace: st);
      // Fallback
      bytes.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      bytes.addAll(generator.feed(1));
    }

    return bytes;
  }

  /// Clone image data ke growable buffer
  static img.Image _makeGrowableBuffer(img.Image source) {
    // Ambil data pixel sebagai Uint8List
    final Uint8List fixedBuffer = source.toUint8List();

    // Clone ke growable List
    final Uint8List growableBuffer = Uint8List.fromList(fixedBuffer);

    // Buat Image baru dengan growable buffer
    final img.Image growableImage = img.Image.fromBytes(
      width: source.width,
      height: source.height,
      bytes: growableBuffer.buffer,
      numChannels: source.numChannels,
    );

    return growableImage;
  }

  /// ✅ ALTERNATIF: Manual pixel copy (paling aman)
  static img.Image _makeGrowableBufferSafe(img.Image source) {
    // Buat image baru kosong
    final img.Image newImage = img.Image(
      width: source.width,
      height: source.height,
      numChannels: source.numChannels,
    );

    // Copy pixel by pixel (lambat tapi 100% aman)
    for (int y = 0; y < source.height; y++) {
      for (int x = 0; x < source.width; x++) {
        final pixel = source.getPixel(x, y);
        newImage.setPixel(x, y, pixel);
      }
    }

    return newImage;
  }

  /// ✅ SOLUSI TERCEPAT: Langsung pakai getBytes() yang growable
  static Future<List<int>> generateLogoBytesFastest(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    try {
      // Load asset
      final ByteData byteData = await rootBundle.load(imagePath);
      final Uint8List imageBytes = byteData.buffer.asUint8List();

      // Decode
      final img.Image? decodedImage = img.decodeImage(imageBytes);
      if (decodedImage == null) throw Exception('Decode failed');

      // Resize
      final maxWidth = (paperSize == PaperSize.mm80) ? 384 : 256;
      final targetWidth = (maxWidth * 0.6).floor();

      img.Image resized = decodedImage;
      if (decodedImage.width > targetWidth) {
        resized = img.copyResize(
          decodedImage,
          width: targetWidth,
          interpolation: img.Interpolation.average,
        );
      }

      // Grayscale
      final grayscale = img.grayscale(resized);

      // ⭐ TRICK: Encode ke PNG lalu decode lagi
      // Ini akan membuat buffer jadi growable otomatis
      final Uint8List pngBytes = Uint8List.fromList(img.encodePng(grayscale));
      final img.Image? reDecoded = img.decodeImage(pngBytes);

      if (reDecoded == null) throw Exception('Re-decode failed');

      // Sekarang buffer sudah growable
      bytes.addAll(generator.image(reDecoded, align: PosAlign.center));
      bytes.addAll(generator.feed(1));
    } catch (e) {
      AppLogger.error('❌ Error', error: e);
      bytes.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      bytes.addAll(generator.feed(1));
    }

    return bytes;
  }

  /// ✅ PALING SIMPLE: Clone dengan Uint8List.fromList
  static Future<List<int>> generateLogoBytesSimplest(
    Generator generator,
    String imagePath,
    PaperSize paperSize,
  ) async {
    final List<int> bytes = [];

    try {
      // Load & decode
      final ByteData byteData = await rootBundle.load(imagePath);
      final Uint8List imageBytes = byteData.buffer.asUint8List();

      final img.Image? image = img.decodeImage(imageBytes);
      if (image == null) throw Exception('Decode failed');

      // Resize & grayscale
      final maxWidth = (paperSize == PaperSize.mm80) ? 384 : 256;
      final targetWidth = (maxWidth * 0.6).floor();

      img.Image processed = image;
      if (image.width > targetWidth) {
        processed = img.copyResize(
          image,
          width: targetWidth,
          interpolation: img.Interpolation.average,
        );
      }
      processed = img.grayscale(processed);

      // ⭐ CLONE buffer jadi growable dengan fromList
      final Uint8List originalBytes = processed.toUint8List();
      final Uint8List growableBytes = Uint8List.fromList(originalBytes);

      // Buat image baru dengan growable buffer
      final img.Image safeImage = img.Image.fromBytes(
        width: processed.width,
        height: processed.height,
        bytes: growableBytes.buffer,
        numChannels: processed.numChannels,
      );

      // Print
      bytes.addAll(generator.image(safeImage, align: PosAlign.center));
      bytes.addAll(generator.feed(1));
    } catch (e) {
      AppLogger.error('❌ Error', error: e);
      bytes.addAll(
        generator.text(
          'Baraja Amphitheater',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
          ),
        ),
      );
      bytes.addAll(generator.feed(1));
    }

    return bytes;
  }

  // --- Print Cash Recap ---
  static Future<bool> printCashRecap({
    required CashRecapModel recap,
    required BluetoothPrinterModel printer,
    required String cashierName,
    required String outletName,
  }) async {
    try {
      await PrinterService.disconnectPrinter();
      await PrinterService.connectPrinter(printer);

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
      final List<int> bytes = [];

      // Bytes generation
      // 1. Header
      try {
        bytes.addAll(
          await PrinterService.generateOptimizedLogoBytes(
            generator,
            'assets/logo/logo_baraja.png',
            paperSize,
          ),
        );
      } catch (e) {
        bytes.addAll(
          generator.text(
            'BARAJA COFFEE',
            styles: const PosStyles(
              align: PosAlign.center,
              bold: true,
              height: PosTextSize.size2,
              width: PosTextSize.size2,
            ),
          ),
        );
      }

      bytes.addAll(
        generator.text(
          'REKAP KASIR (CASH)',
          styles: const PosStyles(
            align: PosAlign.center,
            bold: true,
            height: PosTextSize.size2,
            width: PosTextSize.size2,
          ),
        ),
      );
      bytes.addAll(generator.feed(1));

      bytes.addAll(
        generator.text(
          'Outlet: $outletName',
          styles: const PosStyles(align: PosAlign.center),
        ),
      );
      bytes.addAll(
        generator.text(
          'Kasir: $cashierName',
          styles: const PosStyles(align: PosAlign.center),
        ),
      );
      bytes.addAll(
        generator.text(
          'Date: ${DateFormat('dd/MM/yyyy HH:mm').format(recap.printDate)}',
          styles: const PosStyles(align: PosAlign.center),
        ),
      );
      bytes.addAll(generator.feed(1));

      bytes.addAll(generator.hr(ch: '-'));

      // 2. Period
      bytes.addAll(
        generator.text('Periode:', styles: const PosStyles(bold: true)),
      );
      bytes.addAll(
        generator.text(
          '${DateFormat('dd/MM HH:mm').format(recap.startDate)} - ${DateFormat('dd/MM HH:mm').format(recap.endDate)}',
        ),
      );
      bytes.addAll(generator.hr(ch: '-'));

      // 3. Orders List
      bytes.addAll(
        generator.row([
          PosColumn(text: 'Jam', width: 3, styles: const PosStyles(bold: true)),
          PosColumn(text: 'ID', width: 5, styles: const PosStyles(bold: true)),
          PosColumn(
            text: 'Total',
            width: 4,
            styles: const PosStyles(align: PosAlign.right, bold: true),
          ),
        ]),
      );
      bytes.addAll(generator.hr(ch: '.'));

      for (var order in recap.orders) {
        bytes.addAll(
          generator.row([
            PosColumn(text: order.time, width: 3),
            PosColumn(
              text:
                  order.id.length > 5
                      ? '..${order.id.substring(order.id.length - 5)}'
                      : order.id,
              width: 5,
            ), // Shorten ID
            PosColumn(
              text: formatRupiah(order.amount.toInt()),
              width: 4,
              styles: const PosStyles(align: PosAlign.right),
            ),
          ]),
        );
      }

      bytes.addAll(generator.hr(ch: '-'));

      // 4. Summary
      bytes.addAll(
        generator.row([
          PosColumn(text: 'Total Order:', width: 6),
          PosColumn(
            text: '${recap.orderCount}',
            width: 6,
            styles: const PosStyles(align: PosAlign.right, bold: true),
          ),
        ]),
      );

      bytes.addAll(
        generator.row([
          PosColumn(
            text: 'TOTAL CASH:',
            width: 5,
            styles: const PosStyles(
              height: PosTextSize.size1,
              width: PosTextSize.size1,
              bold: true,
            ),
          ),
          PosColumn(
            text: formatRupiah(recap.totalCash.toInt()),
            width: 7,
            styles: const PosStyles(
              align: PosAlign.right,
              height: PosTextSize.size1,
              width: PosTextSize.size1,
              bold: true,
            ),
          ),
        ]),
      );

      bytes.addAll(generator.feed(2));
      bytes.addAll(
        generator.text(
          '( Tanda Tangan )',
          styles: const PosStyles(align: PosAlign.center),
        ),
      );
      bytes.addAll(generator.feed(3));
      bytes.addAll(generator.cut());

      // Print
      final result = await PrintBluetoothThermal.writeBytes(
        bytes,
      ).then((_) => true).catchError((_) => false);

      return result;
    } catch (e) {
      AppLogger.error('Failed to print cash recap', error: e);
      return false;
    } finally {
      await Future.delayed(const Duration(seconds: 1));
      await PrinterService.disconnectPrinter();
    }
  }
}
