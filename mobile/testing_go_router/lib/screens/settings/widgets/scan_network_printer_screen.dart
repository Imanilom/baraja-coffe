import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/network_printer_provider.dart';
import 'package:kasirbaraja/services/network_discovery_service.dart';

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
    final networkPrinters = ref.watch(networkPrinterManagerProvider);

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
          /// LEFT PANEL (Control Panel)
          Flexible(
            flex: 3,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Card: Pemindaian Otomatis
                  _buildAutoScanCard(scanState),

                  const SizedBox(height: 12),

                  // Card: Tambah Manual
                  _buildManualAddCard(),
                ],
              ),
            ),
          ),

          /// MIDDLE PANEL (Progress & Error)
          Flexible(
            flex: 2,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (scanState.isScanning) _buildProgressIndicator(scanState),
                  if (scanState.error != null) _buildErrorBox(scanState),
                ],
              ),
            ),
          ),

          /// RIGHT PANEL (Result List)
          Expanded(
            flex: 5,
            child: _buildResultsList(scanState, networkPrinters),
          ),
        ],
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
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: allPrinters.length,
      itemBuilder: (context, index) {
        final printer = allPrinters[index];
        final isSaved = savedPrinters.any((p) => p.address == printer.address);
        final isFromScan = foundPrinters.any(
          (p) => p.address == printer.address,
        );

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
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
            title: Text(
              printer.name,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('IP: ${printer.displayAddress}'),
                if (printer.manufacturer != null)
                  Text(
                    '${printer.manufacturer} - ${printer.model ?? 'Unknown'}',
                  ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: printer.isOnline! ? Colors.green : Colors.red,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        printer.isOnline! ? 'Online' : 'Offline',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    if (isSaved)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Tersimpan',
                          style: TextStyle(color: Colors.white, fontSize: 10),
                        ),
                      ),
                    if (isFromScan && !isSaved)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.orange,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Baru',
                          style: TextStyle(color: Colors.white, fontSize: 10),
                        ),
                      ),
                  ],
                ),
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Test Print Button
                IconButton(
                  icon: const Icon(Icons.print),
                  onPressed: () => _testPrint(printer),
                  tooltip: 'Test Print',
                ),

                // Save/Configure Button
                if (!isSaved)
                  IconButton(
                    icon: const Icon(Icons.save),
                    onPressed: () => _savePrinter(printer),
                    tooltip: 'Simpan Printer',
                  )
                else ...[
                  IconButton(
                    icon: const Icon(Icons.settings),
                    onPressed: () => _configurePrinter(printer),
                    tooltip: 'Konfigurasi',
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: () => _deletePrinter(printer),
                    tooltip: 'Hapus',
                  ),
                ],
              ],
            ),
          ),
        );
      },
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
      await ref
          .read(networkPrinterManagerProvider.notifier)
          .savePrinter(printer);
      _showSnackBar('Printer ${printer.name} berhasil disimpan');
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
                    await ref
                        .read(networkPrinterManagerProvider.notifier)
                        .deletePrinter(printer.address);
                    _showSnackBar('Printer berhasil dihapus');
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
      final success = await NetworkDiscoveryService.testPrintToNetworkPrinter(
        printer,
        testBytes,
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
    final testData = <int>[];

    // ESC/POS commands for test print
    testData.addAll([0x1B, 0x40]); // ESC @ (Initialize)
    testData.addAll([0x1B, 0x61, 0x01]); // ESC a 1 (Center align)

    // Add test text
    final testText = '''
TEST PRINT
===================
Printer: ${printer.name}
Address: ${printer.displayAddress}
Time: ${DateTime.now()}
Paper: ${printer.paperSize}
===================
Network Print Success!


''';

    testData.addAll(testText.codeUnits);

    // Cut paper (if supported)
    testData.addAll([0x1D, 0x56, 0x00]); // GS V 0 (Full cut)

    return testData;
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

  Widget _buildAutoScanCard(NetworkScanState scanState) {
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
            TextField(
              controller: _subnetController,
              decoration: const InputDecoration(
                labelText: 'Custom Subnet (opsional)',
                hintText: 'Contoh: 192.168.1',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.network_check),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: scanState.isScanning ? null : _startFullScan,
                    icon: const Icon(Icons.search),
                    label: const Text('Scan Lengkap'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: scanState.isScanning ? null : _startQuickScan,
                    icon: const Icon(Icons.speed),
                    label: const Text('Quick Scan'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
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
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _manualIpController,
                    decoration: const InputDecoration(
                      labelText: 'IP Address',
                      hintText: '192.168.1.100',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _manualPortController,
                    decoration: const InputDecoration(
                      labelText: 'Port',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _addManualPrinter,
                  child: const Icon(Icons.add),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator(NetworkScanState scanState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Sedang Memindai...',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: scanState.progress > 0 ? scanState.progress : null,
        ),
        const SizedBox(height: 8),
        Text(scanState.currentProgress),
        if (scanState.totalCount > 0)
          Text('${scanState.scannedCount}/${scanState.totalCount}'),
      ],
    );
  }

  Widget _buildErrorBox(NetworkScanState scanState) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        border: Border.all(color: Colors.red.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.error, color: Colors.red.shade600),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Error: ${scanState.error}',
              style: TextStyle(color: Colors.red.shade800),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              ref.read(networkScannerProvider.notifier).clearResults();
            },
          ),
        ],
      ),
    );
  }
}
