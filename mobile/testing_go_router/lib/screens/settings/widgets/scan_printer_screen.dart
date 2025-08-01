import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

class ScanPrinterScreen extends ConsumerWidget {
  const ScanPrinterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scanState = ref.watch(printerScannerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Scan Printer')),
      body: scanState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
        data:
            (devices) => ListView.builder(
              itemCount: devices.length,
              itemBuilder: (context, index) {
                final device = devices[index];
                return ListTile(
                  title: Text(device.name),
                  subtitle: Text(device.macAdress),
                  onTap: () {
                    //munculkan dialog menghubungkan printer
                    showDialog(
                      context: context,
                      builder:
                          (context) => AlertDialog(
                            title: const Text('Hubungkan Printer'),
                            content: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(device.name),
                                Text(device.macAdress),
                              ],
                            ),
                            actionsAlignment: MainAxisAlignment.center,
                            actions: [
                              TextButton(
                                onPressed: () {
                                  //simpan ke printer provider
                                  print(
                                    'Proses simpan printer: ${device.macAdress}',
                                  );
                                  _savePrinter(ref, device, context);
                                },
                                child: const Text('Hubungkan dan Simpan'),
                              ),
                            ],
                          ),
                    );
                  },
                );
              },
            ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed:
            () => ref.read(printerScannerProvider.notifier).scanPrinters(),
        child: const Icon(Icons.search),
      ),
    );
  }

  Future<void> _savePrinter(
    WidgetRef ref,
    BluetoothInfo device,
    dynamic context,
  ) async {
    final printer = BluetoothPrinterModel(
      name: device.name,
      address: device.macAdress,
      connectionType: 'bluetooth',
    );

    await ref.read(savedPrintersProvider.notifier).addPrinter(printer);
    //munculkan snackbar berhasil tersimpan,
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Printer berhasil disimpan.')));
    if (context.mounted) Navigator.pop(context);
  }
}
