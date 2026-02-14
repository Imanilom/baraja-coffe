import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/services/printer_service.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

class ScanPrinterScreen extends ConsumerStatefulWidget {
  const ScanPrinterScreen({super.key});

  @override
  ConsumerState<ScanPrinterScreen> createState() => _ScanPrinterScreenState();
}

class _ScanPrinterScreenState extends ConsumerState<ScanPrinterScreen> {
  String? _operatingDevice;
  final Map<String, String> _deviceOperations = {};

  @override
  void initState() {
    super.initState();
    _initializeAndScan();
  }

  Future<void> _initializeAndScan() async {
    // Small delay to ensure widget is mounted
    await Future.delayed(const Duration(milliseconds: 100));

    if (mounted) {
      await _startScan();
    }
  }

  Future<void> _startScan() async {
    try {
      await ref.read(printerScannerProvider.notifier).scanPrinters();
    } catch (e) {
      if (mounted) {
        _showError('Gagal memulai scan: ${e.toString()}');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final scanResult = ref.watch(printerScannerProvider);
    final savedPrinters = ref.watch(savedPrintersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Bluetooth Printer'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: _showHelpDialog,
            tooltip: 'Bantuan',
          ),
        ],
      ),
      body: Column(
        children: [
          // Status Header
          _buildStatusHeader(scanResult),

          // Instructions Card
          _buildInstructionsCard(savedPrinters.length),

          // Content based on scan state
          Expanded(
            child: scanResult.when(
              data: (result) => _buildScanContent(result, savedPrinters),
              loading: () => _buildLoadingContent(),
              error:
                  (error, stackTrace) => _buildErrorContent(error.toString()),
            ),
          ),
        ],
      ),
      floatingActionButton: _buildFloatingActionButton(scanResult),
    );
  }

  Widget _buildStatusHeader(AsyncValue<PrinterScanResult> scanResult) {
    return scanResult.when(
      data: (result) {
        if (result.state == PrinterScanState.scanning ||
            _operatingDevice != null) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Colors.blue.withValues(alpha: 0.1),
            child: Row(
              children: [
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    _operatingDevice != null
                        ? _getOperationText(_operatingDevice!)
                        : _getScanStatusText(result.state),
                    style: const TextStyle(color: Colors.blue),
                  ),
                ),
              ],
            ),
          );
        }

        if (result.state == PrinterScanState.error) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Colors.red.withValues(alpha: 0.1),
            child: Row(
              children: [
                const Icon(Icons.error, color: Colors.red, size: 20),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    result.errorMessage ?? 'Terjadi kesalahan',
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
                TextButton(
                  onPressed: _startScan,
                  child: const Text('Coba Lagi'),
                ),
              ],
            ),
          );
        }

        if (result.state == PrinterScanState.completed &&
            result.lastScanTime != null) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            color: Colors.green.withValues(alpha: 0.1),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Scan selesai: ${result.devices.length} perangkat ditemukan',
                    style: const TextStyle(color: Colors.green, fontSize: 12),
                  ),
                ),
                Text(
                  _formatTime(result.lastScanTime!),
                  style: TextStyle(color: Colors.grey[600], fontSize: 10),
                ),
              ],
            ),
          );
        }

        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildInstructionsCard(int savedPrintersCount) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.blue, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Petunjuk Penggunaan',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text('• Pastikan printer dalam mode pairing/discoverable'),
            const Text('• Pastikan printer berada dalam jangkauan Bluetooth'),
            const Text('• Pastikan Bluetooth perangkat sudah aktif'),
            const Text('• Tap printer untuk menyimpan dan konfigurasi'),
            if (savedPrintersCount > 0) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: Colors.green.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: Colors.green,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Anda memiliki $savedPrintersCount printer tersimpan',
                      style: TextStyle(
                        color: Colors.green.shade700,
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
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

  Widget _buildScanContent(
    PrinterScanResult result,
    List<BluetoothPrinterModel> savedPrinters,
  ) {
    if (result.devices.isEmpty && result.state == PrinterScanState.completed) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(printerScannerProvider.notifier).rescanWithRetry();
      },
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: result.devices.length,
        itemBuilder: (context, index) {
          final device = result.devices[index];
          return _buildDeviceCard(device, savedPrinters);
        },
      ),
    );
  }

  Widget _buildDeviceCard(
    BluetoothInfo device,
    List<BluetoothPrinterModel> savedPrinters,
  ) {
    final isAlreadySaved = savedPrinters.any(
      (printer) => printer.address == device.macAdress,
    );
    final isOperating = _operatingDevice == device.macAdress;
    final operation = _deviceOperations[device.macAdress];

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: isAlreadySaved ? 3 : 1,
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (isAlreadySaved ? Colors.green : Colors.blue).withOpacity(
              0.1,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            Icons.print,
            color: isAlreadySaved ? Colors.green : Colors.blue,
            size: 24,
          ),
        ),
        title: Text(
          device.name.isNotEmpty ? device.name : 'Unknown Printer',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: isAlreadySaved ? Colors.green.shade700 : null,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              device.macAdress,
              style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color:
                        isAlreadySaved
                            ? Colors.green.withValues(alpha: 0.1)
                            : Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    isAlreadySaved ? 'Tersimpan' : 'Baru',
                    style: TextStyle(
                      color:
                          isAlreadySaved
                              ? Colors.green.shade700
                              : Colors.blue.shade700,
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                if (isOperating && operation != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      operation,
                      style: TextStyle(
                        color: Colors.orange.shade700,
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
        trailing:
            isOperating
                ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
                : Icon(
                  isAlreadySaved
                      ? Icons.check_circle
                      : Icons.add_circle_outline,
                  color: isAlreadySaved ? Colors.green : Colors.blue,
                ),
        onTap:
            isOperating
                ? null
                : () => _showDeviceDialog(device, isAlreadySaved),
      ),
    );
  }

  Widget _buildLoadingContent() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Memulai scan printer...'),
          SizedBox(height: 8),
          Text(
            'Pastikan Bluetooth aktif dan printer dalam mode pairing',
            style: TextStyle(fontSize: 12, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorContent(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'Gagal Scan Printer',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 24),
            Column(
              children: [
                ElevatedButton.icon(
                  onPressed: _startScan,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Coba Lagi'),
                ),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: _showTroubleshootingDialog,
                  icon: const Icon(Icons.help_outline),
                  label: const Text('Panduan Troubleshooting'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.bluetooth_searching, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'Tidak Ada Printer Ditemukan',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Pastikan printer dalam mode pairing dan berada dalam jangkauan',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            Column(
              children: [
                ElevatedButton.icon(
                  onPressed: _startScan,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Scan Ulang'),
                ),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: _showHelpDialog,
                  icon: const Icon(Icons.help_outline),
                  label: const Text('Bantuan'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget? _buildFloatingActionButton(AsyncValue<PrinterScanResult> scanResult) {
    return scanResult.maybeWhen(
      data: (result) {
        final isScanning = result.state == PrinterScanState.scanning;
        final hasOperations = _operatingDevice != null;

        if (isScanning || hasOperations) {
          return null; // Hide FAB during operations
        }

        return FloatingActionButton.extended(
          onPressed: () async {
            await ref.read(printerScannerProvider.notifier).rescanWithRetry();
          },
          icon: const Icon(Icons.bluetooth_searching),
          label: const Text('Scan Ulang'),
          backgroundColor: Colors.blue,
        );
      },
      orElse: () => null,
    );
  }

  void _showDeviceDialog(BluetoothInfo device, bool isAlreadySaved) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Row(
              children: [
                Icon(
                  isAlreadySaved ? Icons.settings : Icons.add_circle_outline,
                  color: isAlreadySaved ? Colors.green : Colors.blue,
                ),
                const SizedBox(width: 8),
                Text(isAlreadySaved ? 'Printer Tersimpan' : 'Tambah Printer'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Nama: ${device.name.isNotEmpty ? device.name : 'Unknown Printer'}',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Text(
                  'MAC Address: ${device.macAdress}',
                  style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                if (isAlreadySaved) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Colors.green.withValues(alpha: 0.3),
                      ),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.check_circle, color: Colors.green, size: 20),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Printer ini sudah tersimpan. Anda dapat melakukan test print atau konfigurasi.',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  const Text(
                    'Apakah Anda ingin menyimpan printer ini?',
                    style: TextStyle(fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Printer akan disimpan dengan konfigurasi default.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Batal'),
              ),
              if (!isAlreadySaved) ...[
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _savePrinter(device, testAfterSave: false);
                  },
                  child: const Text('Simpan Saja'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _savePrinter(device, testAfterSave: true);
                  },
                  child: const Text('Simpan & Test'),
                ),
              ] else ...[
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _testExistingPrinter(device);
                  },
                  child: const Text('Test Print'),
                ),
              ],
            ],
          ),
    );
  }

  Future<void> _savePrinter(
    BluetoothInfo device, {
    bool testAfterSave = false,
  }) async {
    setState(() {
      _operatingDevice = device.macAdress;
      _deviceOperations[device.macAdress] = 'Menyimpan...';
    });

    try {
      final printer = BluetoothPrinterModel(
        name: device.name.isNotEmpty ? device.name : 'Unknown Printer',
        address: device.macAdress,
        connectionType: 'bluetooth',
        canPrintCustomer: true,
        customerCopies: 1,
        canPrintKitchen: false,
        kitchenCopies: 1,
        canPrintBar: false,
        barCopies: 1,
        canPrintWaiter: false,
        waiterCopies: 1,
        paperSize: 'mm58',
      );

      final result = await ref
          .read(savedPrintersProvider.notifier)
          .addPrinter(printer);

      if (result.isSuccess) {
        _showSuccess('Printer ${printer.name} berhasil disimpan');

        if (testAfterSave) {
          await Future.delayed(const Duration(milliseconds: 500));
          await _testPrinterWithModel(printer);
        }
      } else {
        _showError(result.error ?? 'Gagal menyimpan printer');
      }
    } catch (e) {
      _showError('Error: ${e.toString()}');
    } finally {
      setState(() {
        _operatingDevice = null;
        _deviceOperations.remove(device.macAdress);
      });
    }
  }

  Future<void> _testExistingPrinter(BluetoothInfo device) async {
    final savedPrinters = ref.read(savedPrintersProvider);
    final printer = savedPrinters.firstWhere(
      (p) => p.address == device.macAdress,
    );
    await _testPrinterWithModel(printer);
  }

  Future<void> _testPrinterWithModel(BluetoothPrinterModel printer) async {
    setState(() {
      _operatingDevice = printer.address;
      _deviceOperations[printer.address] = 'Test print...';
    });

    try {
      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder:
            (context) => const AlertDialog(
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Melakukan test print...'),
                  SizedBox(height: 8),
                  Text(
                    'Pastikan printer siap dan memiliki kertas',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
      );

      final success = await PrinterService.testPrint(printer, printer.address);

      // Close loading dialog
      if (mounted) Navigator.pop(context);

      if (success) {
        _showSuccess('Test print berhasil pada ${printer.name}');
      } else {
        _showError('Test print gagal pada ${printer.name}');
      }
    } catch (e) {
      // Close loading dialog if open
      if (mounted) Navigator.pop(context);
      _showError('Error test print: ${e.toString()}');
    } finally {
      setState(() {
        _operatingDevice = null;
        _deviceOperations.remove(printer.address);
      });
    }
  }

  // Helper methods
  void _showSuccess(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  String _getScanStatusText(PrinterScanState state) {
    switch (state) {
      case PrinterScanState.scanning:
        return 'Mencari printer bluetooth...';
      case PrinterScanState.completed:
        return 'Scan selesai';
      case PrinterScanState.error:
        return 'Terjadi kesalahan';
      default:
        return 'Siap untuk scan';
    }
  }

  String _getOperationText(String deviceAddress) {
    final operation = _deviceOperations[deviceAddress];
    return operation ?? 'Memproses...';
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  void _showHelpDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.help_outline, color: Colors.blue),
                SizedBox(width: 8),
                Text('Bantuan Scan Printer'),
              ],
            ),
            content: const SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Langkah-langkah scan printer:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text('1. Aktifkan Bluetooth di perangkat Anda'),
                  Text('2. Nyalakan printer dan pastikan dalam mode pairing'),
                  Text('3. Pastikan printer berada dalam jangkauan (< 10m)'),
                  Text('4. Tap tombol "Scan Ulang" jika diperlukan'),
                  Text('5. Pilih printer dari daftar untuk menyimpan'),
                  SizedBox(height: 16),
                  Text(
                    'Tips troubleshooting:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text('• Restart Bluetooth jika tidak menemukan printer'),
                  Text('• Pastikan printer tidak terhubung ke perangkat lain'),
                  Text('• Coba restart printer jika masih bermasalah'),
                  Text('• Periksa manual printer untuk mode pairing'),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Tutup'),
              ),
            ],
          ),
    );
  }

  void _showTroubleshootingDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.build, color: Colors.orange),
                SizedBox(width: 8),
                Text('Troubleshooting'),
              ],
            ),
            content: const SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Jika scan gagal, coba langkah berikut:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 12),
                  Text('✓ Pastikan Bluetooth aktif'),
                  Text('✓ Berikan izin lokasi ke aplikasi'),
                  Text('✓ Restart aplikasi'),
                  Text('✓ Restart Bluetooth'),
                  Text('✓ Pastikan printer dalam mode discoverable'),
                  SizedBox(height: 12),
                  Text(
                    'Masalah umum:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '• "Permission denied" → Berikan izin Bluetooth & Lokasi',
                  ),
                  Text('• "Bluetooth disabled" → Aktifkan Bluetooth'),
                  Text('• "No devices found" → Pastikan printer pairing mode'),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Tutup'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _startScan();
                },
                child: const Text('Coba Scan'),
              ),
            ],
          ),
    );
  }
}
