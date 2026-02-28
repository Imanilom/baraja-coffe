import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

class PrinterServices {
  static Future<void> printReceipt(String macAddress) async {
    // 1. Buat generator
    final generator = Generator(PaperSize.mm80, await CapabilityProfile.load());

    // 2. Buat konten
    var bytes = generator.text(
      'Contoh Struk',
      styles: const PosStyles(align: PosAlign.center, bold: true),
    );

    // 3. Tambahkan garis
    bytes += generator.hr();

    // 4. Kirim ke printer
    final result = await PrintBluetoothThermal.writeBytes(
      bytes,
      // macPrinterAddress: macAddress,
    );

    if (!result) throw Exception('Gagal mengirim perintah print');
  }
}
