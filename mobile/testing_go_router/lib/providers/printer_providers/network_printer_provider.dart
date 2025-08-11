import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/services/network_discovery_service.dart';

// State classes
class NetworkScanState {
  final bool isScanning;
  final String currentProgress;
  final List<DiscoveredDevice> discoveredDevices;
  final List<BluetoothPrinterModel> foundPrinters;
  final String? error;
  final int scannedCount;
  final int totalCount;

  const NetworkScanState({
    this.isScanning = false,
    this.currentProgress = '',
    this.discoveredDevices = const [],
    this.foundPrinters = const [],
    this.error,
    this.scannedCount = 0,
    this.totalCount = 0,
  });

  NetworkScanState copyWith({
    bool? isScanning,
    String? currentProgress,
    List<DiscoveredDevice>? discoveredDevices,
    List<BluetoothPrinterModel>? foundPrinters,
    String? error,
    int? scannedCount,
    int? totalCount,
  }) {
    return NetworkScanState(
      isScanning: isScanning ?? this.isScanning,
      currentProgress: currentProgress ?? this.currentProgress,
      discoveredDevices: discoveredDevices ?? this.discoveredDevices,
      foundPrinters: foundPrinters ?? this.foundPrinters,
      error: error,
      scannedCount: scannedCount ?? this.scannedCount,
      totalCount: totalCount ?? this.totalCount,
    );
  }

  double get progress {
    if (totalCount == 0) return 0.0;
    return scannedCount / totalCount;
  }
}

// Network Scanner Provider
class NetworkScannerNotifier extends StateNotifier<NetworkScanState> {
  NetworkScannerNotifier() : super(const NetworkScanState());

  Future<void> startNetworkScan({String? customSubnet}) async {
    if (state.isScanning) return;

    state = state.copyWith(
      isScanning: true,
      currentProgress: 'Memulai pemindaian jaringan...',
      discoveredDevices: [],
      foundPrinters: [],
      error: null,
      scannedCount: 0,
      totalCount: 0,
    );

    try {
      final discoveredDevices =
          await NetworkDiscoveryService.discoverNetworkPrinters(
            customSubnet: customSubnet,
            onProgress: (progress) {
              state = state.copyWith(currentProgress: progress);
            },
            onProgressCount: (current, total) {
              state = state.copyWith(scannedCount: current, totalCount: total);
            },
          );

      // Convert discovered devices to printer models
      final foundPrinters =
          discoveredDevices
              .where((device) => device.isPotentialPrinter)
              .map((device) => device.toPrinterModel())
              .toList();

      state = state.copyWith(
        isScanning: false,
        discoveredDevices: discoveredDevices,
        foundPrinters: foundPrinters,
        currentProgress:
            'Pemindaian selesai. Ditemukan ${foundPrinters.length} printer.',
      );
    } catch (e) {
      state = state.copyWith(
        isScanning: false,
        error: e.toString(),
        currentProgress: 'Pemindaian gagal: ${e.toString()}',
      );
    }
  }

  Future<void> quickScan({String? subnet}) async {
    if (state.isScanning) return;

    state = state.copyWith(
      isScanning: true,
      currentProgress: 'Memulai quick scan...',
      discoveredDevices: [],
      foundPrinters: [],
      error: null,
    );

    try {
      final printerIPs = await NetworkDiscoveryService.quickScan(
        subnet: subnet,
        onProgress: (progress) {
          state = state.copyWith(currentProgress: progress);
        },
      );

      // Convert IPs to printer models (simplified)
      final foundPrinters =
          printerIPs.map((ip) {
            return BluetoothPrinterModel(
              name: 'Network Printer ($ip)',
              address: ip,
              connectionType: 'network',
              port: 9100,
              lastSeen: DateTime.now(),
              isOnline: true,
            );
          }).toList();

      state = state.copyWith(
        isScanning: false,
        foundPrinters: foundPrinters,
        currentProgress:
            'Quick scan selesai. Ditemukan ${foundPrinters.length} printer.',
      );
    } catch (e) {
      state = state.copyWith(
        isScanning: false,
        error: e.toString(),
        currentProgress: 'Quick scan gagal: ${e.toString()}',
      );
    }
  }

  void clearResults() {
    state = const NetworkScanState();
  }

  Future<bool> testConnection(BluetoothPrinterModel printer) async {
    if (!printer.isNetworkPrinter) return false;

    return await NetworkDiscoveryService.testConnection(
      printer.address,
      printer.networkPort,
    );
  }
}

// Network Printer Management Provider
class NetworkPrinterManagerNotifier
    extends StateNotifier<List<BluetoothPrinterModel>> {
  final Ref ref;
  late Box<BluetoothPrinterModel> _box;

  NetworkPrinterManagerNotifier(this.ref) : super([]) {
    _initializeBox();
  }

  void _initializeBox() {
    try {
      _box = ref.watch(printerBoxProvider);
      _loadNetworkPrinters();
    } catch (e) {
      print('❌ Error accessing shared Hive box: $e');
      state = [];
    }
  }

  void _loadNetworkPrinters() {
    try {
      final allPrinters = _box.values.toList();
      // Filter only network printers
      final networkPrinters =
          allPrinters.where((p) => p.isNetworkPrinter).toList();
      state = networkPrinters;
    } catch (e) {
      print('❌ Error loading network printers: $e');
      state = [];
    }
  }

  Future<void> savePrinter(BluetoothPrinterModel printer) async {
    if (!printer.isNetworkPrinter) {
      throw Exception(
        'Hanya network printer yang bisa disimpan melalui provider ini',
      );
    }

    try {
      // Use address as key (consistent with SavedPrintersNotifier)
      await _box.put(printer.address, printer);
      _loadNetworkPrinters();

      // Trigger update to savedPrintersProvider as well
      ref.invalidate(savedPrintersProvider);

      print('✅ Network printer saved: ${printer.name}');
    } catch (e) {
      print('❌ Error saving network printer: $e');
      throw Exception('Gagal menyimpan printer: $e');
    }
  }

  Future<void> updatePrinter(BluetoothPrinterModel printer) async {
    if (!printer.isNetworkPrinter) {
      throw Exception(
        'Hanya network printer yang bisa diupdate melalui provider ini',
      );
    }

    try {
      if (!_box.containsKey(printer.address)) {
        throw Exception('Printer tidak ditemukan');
      }

      await _box.put(printer.address, printer);
      _loadNetworkPrinters();

      // Trigger update to savedPrintersProvider as well
      ref.invalidate(savedPrintersProvider);

      print('✅ Network printer updated: ${printer.name}');
    } catch (e) {
      print('❌ Error updating network printer: $e');
      throw Exception('Gagal mengupdate printer: $e');
    }
  }

  Future<void> deletePrinter(String printerAddress) async {
    try {
      final printer = _box.get(printerAddress);
      if (printer == null || !printer.isNetworkPrinter) {
        throw Exception('Network printer tidak ditemukan');
      }

      await _box.delete(printerAddress);
      _loadNetworkPrinters();

      // Trigger update to savedPrintersProvider as well
      ref.invalidate(savedPrintersProvider);

      print('✅ Network printer deleted: $printerAddress');
    } catch (e) {
      print('❌ Error deleting network printer: $e');
      throw Exception('Gagal menghapus printer: $e');
    }
  }

  Future<void> refreshPrinterStatus() async {
    final updatedPrinters = <BluetoothPrinterModel>[];

    for (final printer in state) {
      if (printer.isNetworkPrinter) {
        final isOnline = await NetworkDiscoveryService.testConnection(
          printer.address,
          printer.networkPort,
        );

        final updatedPrinter = printer.copyWith(
          isOnline: isOnline,
          lastSeen: isOnline ? DateTime.now() : printer.lastSeen,
        );

        updatedPrinters.add(updatedPrinter);

        // Update in shared box
        await _box.put(printer.address, updatedPrinter);
      } else {
        updatedPrinters.add(printer);
      }
    }

    state = updatedPrinters;
    // Trigger update to savedPrintersProvider
    ref.invalidate(savedPrintersProvider);
  }

  List<BluetoothPrinterModel> getOnlinePrinters() {
    return state.where((printer) => printer.isOnline!).toList();
  }

  List<BluetoothPrinterModel> getPrintersByType(String jobType) {
    return state.where((printer) {
      switch (jobType) {
        case 'customer':
          return printer.canPrintCustomer;
        case 'kitchen':
          return printer.canPrintKitchen;
        case 'bar':
          return printer.canPrintBar;
        case 'waiter':
          return printer.canPrintWaiter;
        default:
          return false;
      }
    }).toList();
  }
}

// Providers
final networkScannerProvider =
    StateNotifierProvider<NetworkScannerNotifier, NetworkScanState>(
      (ref) => NetworkScannerNotifier(),
    );

final networkPrinterManagerProvider = StateNotifierProvider<
  NetworkPrinterManagerNotifier,
  List<BluetoothPrinterModel>
>((ref) => NetworkPrinterManagerNotifier(ref));

// Helper providers
final networkPrintersProvider = Provider<List<BluetoothPrinterModel>>((ref) {
  final allPrinters = ref.watch(networkPrinterManagerProvider);
  return allPrinters.where((p) => p.isNetworkPrinter).toList();
});

final onlineNetworkPrintersProvider = Provider<List<BluetoothPrinterModel>>((
  ref,
) {
  final networkPrinters = ref.watch(networkPrintersProvider);
  return networkPrinters.where((p) => p.isOnline!).toList();
});

// Test Print Provider
final testPrintProvider = FutureProvider.family<bool, BluetoothPrinterModel>((
  ref,
  printer,
) async {
  if (!printer.isNetworkPrinter) return false;

  // Generate test print data (you'll need to implement this)
  final testBytes = await _generateTestPrintBytes(printer);

  return await NetworkDiscoveryService.testPrintToNetworkPrinter(
    printer,
    testBytes,
  );
});

// Helper function to generate test print bytes
Future<List<int>> _generateTestPrintBytes(BluetoothPrinterModel printer) async {
  // You'll need to import your existing print service here
  // For now, return a simple test pattern

  final testData = <int>[];

  // ESC/POS commands for test print
  testData.addAll([0x1B, 0x40]); // ESC @ (Initialize)
  testData.addAll([0x1B, 0x61, 0x01]); // ESC a 1 (Center align)

  // Add test text
  final testText =
      'TEST PRINT\n${printer.name}\n${printer.displayAddress}\n${DateTime.now()}\n\n\n';
  testData.addAll(testText.codeUnits);

  // Cut paper (if supported)
  testData.addAll([0x1D, 0x56, 0x00]); // GS V 0 (Full cut)

  return testData;
}
