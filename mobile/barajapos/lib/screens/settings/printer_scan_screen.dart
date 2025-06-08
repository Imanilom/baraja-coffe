// screens/printer_scan_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/ble_scan_provider.dart';

class PrinterScanScreen extends ConsumerWidget {
  const PrinterScanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devices = ref.watch(bleScanProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Printer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(bleScanProvider.notifier).startScan(),
          )
        ],
      ),
      body: devices.isEmpty
          ? const Center(child: Text('Belum ada printer terdeteksi'))
          : ListView.builder(
              itemCount: devices.length,
              itemBuilder: (context, index) {
                final device = devices[index];
                return ListTile(
                  title:
                      Text(device.name.isNotEmpty ? device.name : 'Tanpa Nama'),
                  subtitle: Text(device.id),
                  trailing: PopupMenuButton<String>(
                    onSelected: (role) {
                      // TODO: Simpan sebagai printer bar/dapur
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(
                          value: 'bar',
                          child: Text('Pilih sebagai Printer Bar')),
                      PopupMenuItem(
                          value: 'dapur',
                          child: Text('Pilih sebagai Printer Dapur')),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
