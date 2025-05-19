// lib/screens/printer_scan_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import '../../providers/bluetooth_scan_provider.dart';

class PrinterScanScreen extends ConsumerWidget {
  const PrinterScanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scannedDevices = ref.watch(bluetoothScanProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pilih Printer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(bluetoothScanProvider.notifier).startScan();
            },
          ),
        ],
      ),
      body: scannedDevices.isEmpty
          ? const Center(child: Text("Tidak ada printer ditemukan"))
          : ListView.builder(
              itemCount: scannedDevices.length,
              itemBuilder: (context, index) {
                final device = scannedDevices[index];
                return ListTile(
                  title: Text(device.platformName),
                  subtitle: Text(device.remoteId.str),
                  trailing: PopupMenuButton<String>(
                    onSelected: (role) {
                      // Simpan ke Hive sebagai printer bar/dapur
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(
                        value: 'bar',
                        child: Text('Set sebagai Printer Bar'),
                      ),
                      PopupMenuItem(
                        value: 'dapur',
                        child: Text('Set sebagai Printer Dapur'),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
