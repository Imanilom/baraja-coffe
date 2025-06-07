import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/services/printer_service.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

class PrinterHomeScreen extends ConsumerWidget {
  const PrinterHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final printers = ref.watch(savedPrintersProvider);
    final connectionState = ref.watch(printerConnectionProvider);

    return Scaffold(
      body: Column(
        children: [
          ListTile(
            title: const Text('Printer Tersimpan'),
            trailing: TextButton.icon(
              style: TextButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: Colors.green,
              ),
              icon: const Icon(Icons.add),
              label: const Text('Tambah Printer'),
              onPressed: () {
                ref
                    .read(printerScannerProvider.notifier)
                    .clearScannedPrinters();
                context.pushNamed('scan-printer');
              },
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: printers.length,
              itemBuilder: (context, index) {
                final printer = printers[index];
                return ListTile(
                  onTap:
                      () => context.pushNamed('detail-printer', extra: printer),
                  title: Text(printer.name),
                  subtitle: Text(printer.address),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextButton.icon(
                        style: TextButton.styleFrom(
                          backgroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.print),
                        label: const Text('Test Print'),
                        onPressed: () {
                          //pop up untuk test print
                          showDialog(
                            context: context,
                            builder: (context) {
                              return AlertDialog(
                                title: const Text('Test Print'),
                                content: const Text(
                                  'Apakah anda yakin ingin mencetak?',
                                ),
                                actions: [
                                  TextButton(
                                    child: const Text('Tidak'),
                                    onPressed: () => Navigator.pop(context),
                                  ),
                                  TextButton(
                                    child: const Text('Ya'),
                                    onPressed: () {
                                      _testPrint(ref, context, printer);
                                      Navigator.pop(context);
                                    },
                                  ),
                                ],
                              );
                            },
                          );
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed: () {
                          //pop up untuk konfirmasi
                          showDialog(
                            context: context,
                            builder: (context) {
                              return AlertDialog(
                                title: const Text('Hapus Printer'),
                                content: const Text(
                                  'Apakah anda yakin ingin menghapus printer ini?',
                                ),
                                actions: [
                                  TextButton(
                                    child: const Text('Tidak'),
                                    onPressed: () => Navigator.pop(context),
                                  ),
                                  TextButton(
                                    child: const Text('Ya'),
                                    onPressed: () {
                                      ref
                                          .read(savedPrintersProvider.notifier)
                                          .removePrinter(printer.address);
                                      Navigator.pop(context);
                                    },
                                  ),
                                ],
                              );
                            },
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          // if (connectionState == PrinterConnectionState.connected)
          //   ElevatedButton(
          //     onPressed: () => _testPrint(ref, context, null),
          //     child: const Text('TEST PRINT'),
          //   ),
        ],
      ),
    );
  }

  Future<void> _connectPrinter(
    WidgetRef ref,
    BluetoothPrinterModel printer,
  ) async {
    await ref.read(printerConnectionProvider.notifier).connect(printer);
  }

  Future<void> _testPrint(
    WidgetRef ref,
    dynamic context,
    BluetoothPrinterModel? selectedPrinter,
  ) async {
    final connectionState = ref.watch(printerConnectionProvider);
    if (connectionState != PrinterConnectionState.connected) {
      _connectPrinter(ref, selectedPrinter!);
    }
    // final selectedPrinter = ref.read(selectedPrinterProvider);
    if (selectedPrinter == null) return;

    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final success = await PrinterService.testPrint(
      selectedPrinter,
      selectedPrinter.address,
    );

    if (success) {
      scaffoldMessenger.showSnackBar(
        const SnackBar(content: Text('Berhasil mencetak')),
      );
    } else {
      scaffoldMessenger.showSnackBar(
        const SnackBar(content: Text('Gagal mencetak')),
      );
    }
    // try {
    //   final result = await PrintBluetoothThermal.writeBytes([
    //     0x1B,
    //     0x40,
    //     0x1B,
    //     0x61,
    //     0x01,
    //     0x1D,
    //     0x21,
    //     0x11,
    //   ]);
    //   if (!result) throw Exception('Gagal mengirim perintah print');
    // } catch (e) {
    //   ScaffoldMessenger.of(
    //     context,
    //   ).showSnackBar(SnackBar(content: Text('Print gagal: $e')));
    // }
  }
}
