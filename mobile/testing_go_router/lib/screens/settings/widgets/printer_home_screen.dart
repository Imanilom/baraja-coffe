import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/services/printer_service.dart';

class PrinterHomeScreen extends ConsumerStatefulWidget {
  const PrinterHomeScreen({super.key});

  @override
  ConsumerState<PrinterHomeScreen> createState() => _PrinterHomeScreenState();
}

class _PrinterHomeScreenState extends ConsumerState<PrinterHomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _testingPrinter;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final printers = ref.watch(savedPrintersProvider);

    // Separate printers by type
    final bluetoothPrinters =
        printers
            .where((printer) => printer.connectionType == 'bluetooth')
            .toList();

    final networkPrinters =
        printers
            .where((printer) => printer.connectionType == 'network')
            .toList();

    final allPrinters = printers;

    return Scaffold(
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    'Kelola printer yang terhubung dengan aplikasi Anda.',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                  Spacer(),
                  IconButton(
                    icon: Icon(Icons.info_outline),
                    onPressed: _showInfoDialog,
                  ),
                ],
              ),
            ),
          ),
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              tabs: [
                Tab(
                  icon: const Icon(Icons.list_alt),
                  text: 'Semua (${allPrinters.length})',
                ),
                Tab(
                  icon: const Icon(Icons.bluetooth),
                  text: 'Bluetooth (${bluetoothPrinters.length})',
                ),
                Tab(
                  icon: const Icon(Icons.wifi),
                  text: 'Network (${networkPrinters.length})',
                ),
              ],
            ),
          ),
          // Header with Add Button
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Printer Tersimpan',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${printers.length} printer terdaftar',
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _showAddPrinterDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('Tambah Printer'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),

          // Tab Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPrinterList(allPrinters, 'Tidak ada printer tersimpan'),
                _buildPrinterList(
                  bluetoothPrinters,
                  'Tidak ada printer Bluetooth',
                ),
                _buildPrinterList(networkPrinters, 'Tidak ada printer Network'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrinterList(
    List<BluetoothPrinterModel> printers,
    String emptyMessage,
  ) {
    if (printers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.print_disabled, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: _showAddPrinterDialog,
              icon: const Icon(Icons.add),
              label: const Text('Tambah Printer'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        // Refresh the printer list
        ref.invalidate(savedPrintersProvider);
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: printers.length,
        itemBuilder: (context, index) {
          final printer = printers[index];
          return _buildPrinterCard(printer);
        },
      ),
    );
  }

  Widget _buildPrinterCard(BluetoothPrinterModel printer) {
    final isConnected = _getConnectionStatus(printer);
    final isTesting = _testingPrinter == printer.address;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              children: [
                // Connection Type Icon
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _getConnectionColor(printer).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getConnectionIcon(printer),
                    color: _getConnectionColor(printer),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),

                // Printer Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        printer.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        printer.connectionType == 'network'
                            ? '${printer.address}:${printer.port ?? 9100}'
                            : printer.address,
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),

                // Status Badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isConnected ? Colors.green : Colors.grey,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getConnectionType(printer),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Printer Configuration Summary
            _buildConfigurationSummary(printer),

            const SizedBox(height: 12),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed:
                        () =>
                            context.pushNamed('detail-printer', extra: printer),
                    icon: const Icon(Icons.settings, size: 16),
                    label: const Text('Konfigurasi'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed:
                        isTesting ? null : () => _showTestPrintDialog(printer),
                    icon:
                        isTesting
                            ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                            : const Icon(Icons.print, size: 16),
                    label: Text(isTesting ? 'Testing...' : 'Test Print'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: () => _showDeleteDialog(printer),
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  tooltip: 'Hapus Printer',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConfigurationSummary(BluetoothPrinterModel printer) {
    final roles = <String>[];
    if (printer.canPrintCustomer) roles.add('Customer');
    if (printer.canPrintKitchen) roles.add('Kitchen');
    if (printer.canPrintBar) roles.add('Bar');
    if (printer.canPrintWaiter) roles.add('Waiter');

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                //icon paper size
                Icons.sticky_note_2_outlined,
                size: 16,
                color: Colors.grey[600],
              ),
              const SizedBox(width: 8),
              Text(
                'Paper: ${_getPaperSizeDisplay(printer.paperSize)}',
                style: TextStyle(fontSize: 12, color: Colors.grey[700]),
              ),
              const Spacer(),
              Text(
                'Roles: ${roles.length}',
                style: TextStyle(fontSize: 12, color: Colors.grey[700]),
              ),
            ],
          ),
          if (roles.isNotEmpty) ...[
            const SizedBox(height: 4),
            Wrap(
              spacing: 4,
              children:
                  roles
                      .map(
                        (role) => Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue[50],
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.blue[200]!),
                          ),
                          child: Text(
                            role,
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.blue[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      )
                      .toList(),
            ),
          ],
        ],
      ),
    );
  }

  void _showAddPrinterDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.add_circle_outline, color: Colors.green),
                SizedBox(width: 8),
                Text('Tambah Printer Baru'),
              ],
            ),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Pilih jenis printer yang ingin ditambahkan:'),
                SizedBox(height: 16),
                Text(
                  '• Bluetooth: Printer thermal dengan koneksi Bluetooth\n'
                  '• Network: Printer dengan koneksi Ethernet/WiFi',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Batal'),
              ),
              TextButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  context.pushNamed('scan-network-printer');
                },
                icon: const Icon(Icons.wifi),
                label: const Text('Network'),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  ref
                      .read(printerScannerProvider.notifier)
                      .clearScannedPrinters();
                  context.pushNamed('scan-printer');
                },
                icon: const Icon(Icons.bluetooth),
                label: const Text('Bluetooth'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
    );
  }

  void _showTestPrintDialog(BluetoothPrinterModel printer) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.print, color: Colors.blue),
                SizedBox(width: 8),
                Text('Test Print'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Printer: ${printer.name}'),
                const SizedBox(height: 4),
                Text(
                  'Address: ${printer.address}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Apakah Anda yakin ingin melakukan test print?\n'
                  'Pastikan printer sudah siap dan memiliki kertas.',
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Batal'),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _performTestPrint(printer);
                },
                icon: const Icon(Icons.print, size: 16),
                label: const Text('Test Print'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
    );
  }

  void _showDeleteDialog(BluetoothPrinterModel printer) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.warning, color: Colors.red),
                SizedBox(width: 8),
                Text('Hapus Printer'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Printer: ${printer.name}'),
                const SizedBox(height: 4),
                Text(
                  'Address: ${printer.address}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Apakah Anda yakin ingin menghapus printer ini?\n'
                  'Tindakan ini tidak dapat dibatalkan.',
                  style: TextStyle(color: Colors.red),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Batal'),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _deletePrinter(printer);
                },
                icon: const Icon(Icons.delete, size: 16),
                label: const Text('Hapus'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
    );
  }

  void _showInfoDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.info, color: Colors.blue),
                SizedBox(width: 8),
                Text('Informasi Printer'),
              ],
            ),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Jenis Printer:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text('• Bluetooth: Koneksi nirkabel jarak pendek'),
                Text('• Network: Koneksi melalui WiFi/Ethernet'),
                SizedBox(height: 16),
                Text(
                  'Roles Printer:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text('• Customer: Struk untuk pelanggan'),
                Text('• Kitchen: Order untuk dapur'),
                Text('• Bar: Order untuk bar/minuman'),
                Text('• Waiter: Label untuk pelayan'),
              ],
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

  Future<void> _performTestPrint(BluetoothPrinterModel printer) async {
    setState(() {
      _testingPrinter = printer.address;
    });

    try {
      bool success = false;

      if (printer.connectionType == 'network') {
        success = await PrinterService.testNetworkPrint(
          printer,
          printer.address,
        );
      } else {
        success = await PrinterService.testPrint(printer, printer.address);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(
                  success ? Icons.check_circle : Icons.error,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    success
                        ? 'Test print berhasil pada ${printer.name}'
                        : 'Test print gagal pada ${printer.name}',
                  ),
                ),
              ],
            ),
            backgroundColor: success ? Colors.green : Colors.red,
            duration: const Duration(seconds: 4),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text('Error: ${e.toString()}')),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _testingPrinter = null;
        });
      }
    }
  }

  Future<void> _deletePrinter(BluetoothPrinterModel printer) async {
    try {
      await ref
          .read(savedPrintersProvider.notifier)
          .removePrinter(printer.address);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Text('Printer ${printer.name} berhasil dihapus'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Text('Gagal menghapus printer: ${e.toString()}'),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  // Helper methods
  IconData _getConnectionIcon(BluetoothPrinterModel printer) {
    switch (printer.connectionType) {
      case 'bluetooth':
        return Icons.bluetooth;
      case 'network':
        return Icons.wifi;
      default:
        return Icons.print;
    }
  }

  Color _getConnectionColor(BluetoothPrinterModel printer) {
    switch (printer.connectionType) {
      case 'bluetooth':
        return Colors.blue;
      case 'network':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _getConnectionType(BluetoothPrinterModel printer) {
    switch (printer.connectionType) {
      case 'bluetooth':
        return 'Bluetooth';
      case 'network':
        return 'Network';
      default:
        return 'Unknown';
    }
  }

  String _getPaperSizeDisplay(String? paperSize) {
    switch (paperSize) {
      case 'mm58':
        return '58mm';
      case 'mm72':
        return '72mm';
      case 'mm80':
        return '80mm';
      default:
        return 'Unknown';
    }
  }

  bool _getConnectionStatus(BluetoothPrinterModel printer) {
    // You can implement actual connection status check here
    // For now, return true as placeholder
    return true;
  }
}
