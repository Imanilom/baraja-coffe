import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/network_printer_provider.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/network_discovery_service.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:kasirbaraja/services/printer_service.dart';
import 'package:image/image.dart' as img;

class ScanNetworkPrinterScreen extends ConsumerStatefulWidget {
  const ScanNetworkPrinterScreen({super.key});

  @override
  ConsumerState<ScanNetworkPrinterScreen> createState() =>
      _ScanNetworkPrinterScreenState();
}

class _ScanNetworkPrinterScreenState
    extends ConsumerState<ScanNetworkPrinterScreen> {
  final TextEditingController _subnetController = TextEditingController();
  final TextEditingController _manualIpController = TextEditingController();
  final TextEditingController _manualPortController = TextEditingController(
    text: '9100',
  );

  @override
  void dispose() {
    _subnetController.dispose();
    _manualIpController.dispose();
    _manualPortController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scanState = ref.watch(networkScannerProvider);
    // PERUBAHAN: Gunakan savedPrintersProvider dan filter network printer di sini
    final allSavedPrinters = ref.watch(savedPrintersProvider);
    final savedNetworkPrinters =
        allSavedPrinters.where((p) => p.isNetworkPrinter).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Network Printer'),
        backgroundColor: Colors.blue.shade600,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed:
                scanState.isScanning
                    ? null
                    : () {
                      // PERUBAHAN: Refresh status melalui networkPrinterManagerProvider
                      ref
                          .read(networkPrinterManagerProvider.notifier)
                          .refreshPrinterStatus();
                    },
            tooltip: 'Refresh Status',
          ),
        ],
      ),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Control Panel - Fixed width with scroll
          SizedBox(
            width: 350,
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.grey.shade100,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Progress and Error Section
                    if (scanState.isScanning || scanState.error != null) ...[
                      _buildProgressSection(scanState),
                      const SizedBox(height: 16),
                    ],

                    // Scan Controls
                    _buildScanControlCard(scanState),

                    const SizedBox(height: 16),

                    // Manual Add Card
                    _buildManualAddCard(),
                  ],
                ),
              ),
            ),
          ),

          // Vertical Divider
          const VerticalDivider(width: 1, thickness: 1),

          // Right Results Panel - Expandable
          Expanded(child: _buildResultsList(scanState, savedNetworkPrinters)),
        ],
      ),
    );
  }

  Widget _buildProgressSection(NetworkScanState scanState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (scanState.isScanning) ...[
              Text(
                'Scanning Progress',
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              LinearProgressIndicator(
                value: scanState.progress > 0 ? scanState.progress : null,
              ),
              const SizedBox(height: 8),
              Text(
                scanState.currentProgress,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              if (scanState.totalCount > 0)
                Text(
                  '${scanState.scannedCount}/${scanState.totalCount}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
            ],

            if (scanState.error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  border: Border.all(color: Colors.red.shade200),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.error, color: Colors.red.shade600, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Error',
                            style: TextStyle(
                              color: Colors.red.shade800,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () {
                            ref
                                .read(networkScannerProvider.notifier)
                                .clearResults();
                          },
                          constraints: const BoxConstraints(
                            minWidth: 32,
                            minHeight: 32,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      scanState.error!,
                      style: TextStyle(color: Colors.red.shade800),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildScanControlCard(NetworkScanState scanState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pemindaian Otomatis',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            // Subnet input
            TextField(
              controller: _subnetController,
              decoration: const InputDecoration(
                labelText: 'Custom Subnet (opsional)',
                hintText: 'Contoh: 192.168.1',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.network_check),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Scan buttons
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: scanState.isScanning ? null : _startFullScan,
                    icon: const Icon(Icons.search),
                    label: const Text('Scan Lengkap'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: scanState.isScanning ? null : _startQuickScan,
                    icon: const Icon(Icons.speed),
                    label: const Text('Quick Scan'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildManualAddCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tambah Manual',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            // IP Address field
            TextField(
              controller: _manualIpController,
              decoration: const InputDecoration(
                labelText: 'IP Address',
                hintText: '192.168.1.100',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Port field and Add button
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _manualPortController,
                    decoration: const InputDecoration(
                      labelText: 'Port',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _addManualPrinter,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                  child: const Icon(Icons.add),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsList(
    NetworkScanState scanState,
    List<BluetoothPrinterModel> savedPrinters,
  ) {
    // Combine found printers and saved printers
    final foundPrinters = scanState.foundPrinters;
    final allPrinters = <BluetoothPrinterModel>[
      ...savedPrinters,
      ...foundPrinters.where(
        (found) =>
            !savedPrinters.any((saved) => saved.address == found.address),
      ),
    ];

    if (allPrinters.isEmpty && !scanState.isScanning) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.print_disabled, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Tidak ada printer ditemukan',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
            SizedBox(height: 8),
            Text(
              'Lakukan pemindaian atau tambah printer secara manual',
              style: TextStyle(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.print, color: Colors.blue.shade600),
              const SizedBox(width: 8),
              Text(
                'Printer Ditemukan (${allPrinters.length})',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),

        // List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: allPrinters.length,
            itemBuilder: (context, index) {
              final printer = allPrinters[index];
              final isSaved = savedPrinters.any(
                (p) => p.address == printer.address,
              );
              final isFromScan = foundPrinters.any(
                (p) => p.address == printer.address,
              );

              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      // Status indicator
                      CircleAvatar(
                        radius: 20,
                        backgroundColor:
                            printer.isOnline!
                                ? Colors.green.shade100
                                : Colors.red.shade100,
                        child: Icon(
                          Icons.print,
                          color:
                              printer.isOnline!
                                  ? Colors.green.shade700
                                  : Colors.red.shade700,
                        ),
                      ),

                      const SizedBox(width: 12),

                      // Printer info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              printer.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'IP: ${printer.displayAddress}',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                            if (printer.manufacturer != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                '${printer.manufacturer} - ${printer.model ?? 'Unknown'}',
                                style: TextStyle(
                                  color: Colors.grey.shade600,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                            const SizedBox(height: 6),
                            // Status badges
                            Wrap(
                              spacing: 4,
                              children: [
                                _buildStatusChip(
                                  printer.isOnline! ? 'Online' : 'Offline',
                                  printer.isOnline! ? Colors.green : Colors.red,
                                ),
                                if (isSaved)
                                  _buildStatusChip('Tersimpan', Colors.blue),
                                if (isFromScan && !isSaved)
                                  _buildStatusChip('Baru', Colors.orange),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Action buttons
                      Column(
                        children: [
                          // Test Print Button
                          IconButton(
                            icon: const Icon(Icons.print),
                            onPressed: () => _testPrint(printer),
                            tooltip: 'Test Print',
                          ),

                          // Save/Configure/Delete buttons
                          if (!isSaved)
                            IconButton(
                              icon: const Icon(Icons.save),
                              onPressed: () => _savePrinter(printer),
                              tooltip: 'Simpan Printer',
                            )
                          else ...[
                            PopupMenuButton<String>(
                              onSelected: (value) {
                                if (value == 'configure') {
                                  _configurePrinter(printer);
                                } else if (value == 'delete') {
                                  _deletePrinter(printer);
                                }
                              },
                              itemBuilder:
                                  (context) => [
                                    const PopupMenuItem(
                                      value: 'configure',
                                      child: Row(
                                        children: [
                                          Icon(Icons.settings),
                                          SizedBox(width: 8),
                                          Text('Konfigurasi'),
                                        ],
                                      ),
                                    ),
                                    const PopupMenuItem(
                                      value: 'delete',
                                      child: Row(
                                        children: [
                                          Icon(Icons.delete, color: Colors.red),
                                          SizedBox(width: 8),
                                          Text(
                                            'Hapus',
                                            style: TextStyle(color: Colors.red),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildStatusChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  void _startFullScan() {
    final subnet = _subnetController.text.trim();
    ref
        .read(networkScannerProvider.notifier)
        .startNetworkScan(customSubnet: subnet.isEmpty ? null : subnet);
  }

  void _startQuickScan() {
    final subnet = _subnetController.text.trim();
    ref
        .read(networkScannerProvider.notifier)
        .quickScan(subnet: subnet.isEmpty ? null : subnet);
  }

  void _addManualPrinter() async {
    final ip = _manualIpController.text.trim();
    final portStr = _manualPortController.text.trim();

    if (ip.isEmpty) {
      _showSnackBar('IP Address tidak boleh kosong', isError: true);
      return;
    }

    final port = int.tryParse(portStr) ?? 9100;

    // Test connection first
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => const AlertDialog(
            content: Row(
              children: [
                CircularProgressIndicator(),
                SizedBox(width: 16),
                Text('Testing connection...'),
              ],
            ),
          ),
    );

    try {
      final isConnected = await NetworkDiscoveryService.testConnection(
        ip,
        port,
      );

      if (mounted) Navigator.pop(context); // Close dialog

      if (isConnected) {
        final printer = BluetoothPrinterModel(
          name: 'Manual Network Printer ($ip)',
          address: ip,
          connectionType: 'network',
          port: port,
          lastSeen: DateTime.now(),
          isOnline: true,
        );

        await _savePrinter(printer);

        // Clear fields
        _manualIpController.clear();
        _manualPortController.text = '9100';
      } else {
        _showSnackBar('Tidak dapat terhubung ke $ip:$port', isError: true);
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      _showSnackBar('Error: $e', isError: true);
    }
  }

  Future<void> _savePrinter(BluetoothPrinterModel printer) async {
    try {
      // PERUBAHAN: Gunakan savedPrintersProvider untuk menyimpan printer
      final result = await ref
          .read(savedPrintersProvider.notifier)
          .addPrinter(printer);

      if (result.isSuccess) {
        _showSnackBar('Printer ${printer.name} berhasil disimpan');
      } else {
        _showSnackBar(result.error ?? 'Gagal menyimpan printer', isError: true);
      }
    } catch (e) {
      _showSnackBar('Gagal menyimpan printer: $e', isError: true);
    }
  }

  void _configurePrinter(BluetoothPrinterModel printer) {
    // Navigate to printer configuration screen
    context.pushNamed('detail-printer', extra: printer);
  }

  void _deletePrinter(BluetoothPrinterModel printer) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Hapus Printer'),
            content: Text(
              'Apakah Anda yakin ingin menghapus printer ${printer.name}?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Batal'),
              ),
              TextButton(
                onPressed: () async {
                  Navigator.pop(context);
                  try {
                    // PERUBAHAN: Gunakan savedPrintersProvider untuk menghapus printer
                    final result = await ref
                        .read(savedPrintersProvider.notifier)
                        .removePrinter(printer.address);

                    if (result.isSuccess) {
                      _showSnackBar('Printer berhasil dihapus');
                    } else {
                      _showSnackBar(
                        result.error ?? 'Gagal menghapus printer',
                        isError: true,
                      );
                    }
                  } catch (e) {
                    _showSnackBar('Gagal menghapus printer: $e', isError: true);
                  }
                },
                child: const Text('Hapus'),
              ),
            ],
          ),
    );
  }

  void _testPrint(BluetoothPrinterModel printer) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => const AlertDialog(
            content: Row(
              children: [
                CircularProgressIndicator(),
                SizedBox(width: 16),
                Text('Mencetak test page...'),
              ],
            ),
          ),
    );

    try {
      // Generate test print data
      final testBytes = await _generateTestPrintBytes(printer);

      final success = await PrinterService.testNetworkPrint(
        printer,
        printer.displayAddress,
      );

      if (mounted) Navigator.pop(context);

      if (success) {
        _showSnackBar('Test print berhasil dikirim ke ${printer.name}');
      } else {
        _showSnackBar('Test print gagal', isError: true);
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      _showSnackBar('Error test print: $e', isError: true);
    }
  }

  Future<List<int>> _generateTestPrintBytes(
    BluetoothPrinterModel printer,
  ) async {
    print('paper size generated: ${printer.paperSize}');
    PaperSize paperSize = PaperSize.mm80;
    final profile = await CapabilityProfile.load();
    final generator = Generator(paperSize, profile);

    final List<int> bytes = [];

    final ByteData byteData = await rootBundle.load(
      'assets/logo/logo_baraja.png',
    );
    final Uint8List imageBytes = byteData.buffer.asUint8List();
    final image = img.decodeImage(imageBytes)!;

    // Resize gambar sesuai lebar kertas 80mm
    final resizedImage = img.copyResize(image, width: 300);

    // Konversi ke grayscale
    final grayscaleImage = img.grayscale(resizedImage);

    bytes.addAll(generator.image(grayscaleImage));
    bytes.addAll(generator.feed(1));

    bytes.addAll(
      generator.text(
        'Baraja Amphitheater\n Jl. Tuparev No. 60, Kedungjaya, Kec. Kedawung\nKab. Cirebon, Jawa Barat 45153, Indonesia\n KABUPATEN CIREBON\n0851-1708-9827',
        styles: const PosStyles(
          align: PosAlign.center,
          fontType: PosFontType.fontA,
        ),
      ),
    );

    bytes.addAll(generator.feed(1));

    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Kode Transaksi',
          width: 5,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: '1234567890',
          width: 7,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Tanggal',
          width: 5,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: DateTime.now().toLocal().toString(),
          width: 7,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Kasir',
          width: 5,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: 'Kasir 1',
          width: 7,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'Pelanggan',
          width: 5,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: 'Pelanggan 1',
          width: 7,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );

    bytes.addAll(generator.feed(1));

    bytes.addAll(
      generator.text(
        'Dine-In / Takeaway / Delivery / Reservation',
        styles: const PosStyles(
          align: PosAlign.center,
          fontType: PosFontType.fontA,
        ),
      ),
    );

    bytes.addAll(generator.hr());

    bytes.addAll(
      generator.row([
        PosColumn(
          text: 'IP Address',
          width: 5,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: printer.displayAddress,
          width: 7,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]),
    );
    bytes.addAll(generator.hr());

    bytes.addAll(generator.feed(1));

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
        'Terima kasih telah berbelanja di\nBaraja Amphitheater',
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
    bytes.addAll(generator.cut());

    return bytes;
  }

  void _showSnackBar(String message, {bool isError = false}) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
