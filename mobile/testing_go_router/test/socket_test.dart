import 'package:flutter_test/flutter_test.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:kasirbaraja/configs/app_config.dart';

//hapus aja semua ini udh ga kepake karna gagal / fail
void main() {
  test('Test koneksi socket dan terima order', () async {
    // 1. Connect ke server
    final socket = io.io('http://localhost:3000');
    // final socket = io.io(AppConfig.baseUrl);

    // 2. Tunggu koneksi
    print('tunggu koneksi...');
    await Future.delayed(Duration(seconds: 1));

    // 3. Listen event 'order_created'
    socket.on('order_created', (data) {
      print('Dapat order baru: $data');
      expect(data['id'], isNotNull); // Pastikan data ada ID
    });

    // 4. Kirim test order (opsional)
    socket.emit('new_order', {'id': 'order-123', 'menu': 'Nasi Goreng'});

    // 5. Tunggu 2 detik
    await Future.delayed(Duration(seconds: 2));

    // 6. Tutup koneksi
    socket.disconnect();
  });
}
