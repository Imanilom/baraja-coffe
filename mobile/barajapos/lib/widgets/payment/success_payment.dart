import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart' as shadcn;

class SuccessPayment extends ConsumerWidget {
  const SuccessPayment({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pembayaran Berhasil'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle, size: 100, color: Colors.green),
            const SizedBox(height: 20),
            const Text(
              'Pembayaran Anda Telah Berhasil!',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                // Aksi setelah pembayaran berhasil
                // Misalnya, kembali ke halaman utama atau menampilkan riwayat transaksi
                shadcn.closeSheet(context);
              },
              child: const Text('Kembali ke Beranda'),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () {},
              //warna disabled,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey,
              ),
              child: const Text('Cetak Struk'),
            ),
          ],
        ),
      ),
    );
  }
}
