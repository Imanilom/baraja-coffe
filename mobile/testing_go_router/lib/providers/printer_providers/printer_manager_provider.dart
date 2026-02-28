// Combined Printer Manager
// Location: lib/providers/printer_manager.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:kasirbaraja/services/network_discovery_service.dart';
import 'package:permission_handler/permission_handler.dart';

// ===============================
// Enums & Shared Data Classes
// ===============================

enum PrinterProtocol { bluetooth, network }

enum ConnectionStateEnum {
  disconnected,
  connecting,
  connected,
  failed,
  reconnecting,
}

class GenericPrinterScanState {
  final bool isScanning;
  final String? error;
  final List<BluetoothPrinterModel> foundPrinters;
  final PrinterProtocol protocol;
  final double progress; // 0..1

  const GenericPrinterScanState({
    required this.protocol,
    this.isScanning = false,
    this.error,
    this.foundPrinters = const [],
    this.progress = 0.0,
  });

  GenericPrinterScanState copyWith({
    bool? isScanning,
    String? error,
    List<BluetoothPrinterModel>? foundPrinters,
    PrinterProtocol? protocol,
    double? progress,
  }) {
    return GenericPrinterScanState(
      protocol: protocol ?? this.protocol,
      isScanning: isScanning ?? this.isScanning,
      error: error ?? this.error,
      foundPrinters: foundPrinters ?? this.foundPrinters,
      progress: progress ?? this.progress,
    );
  }
}

class PrinterStatus {
  final String address;
  final ConnectionStateEnum state;
  final String? errorMessage;
  final DateTime lastUpdated;

  const PrinterStatus({
    required this.address,
    required this.state,
    this.errorMessage,
    required this.lastUpdated,
  });

  PrinterStatus copyWith({
    String? address,
    ConnectionStateEnum? state,
    String? errorMessage,
    DateTime? lastUpdated,
  }) {
    return PrinterStatus(
      address: address ?? this.address,
      state: state ?? this.state,
      errorMessage: errorMessage ?? this.errorMessage,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

// Generic Result helper
class Result<T> {
  final T? data;
  final String? error;
  final bool isSuccess;

  const Result._({this.data, this.error, required this.isSuccess});

  factory Result.success(T data) => Result._(data: data, isSuccess: true);
  factory Result.failure(String error) =>
      Result._(error: error, isSuccess: false);

  bool get isFailure => !isSuccess;
}

// ===============================
// Services Interfaces (protocol specific)
// ===============================

abstract class IBluetoothPrinterService {
  Future<List<BluetoothPrinterModel>> scan();
  Future<bool> connect(String address);
  Future<void> disconnect();
  Future<bool> printBytes(List<int> bytes, {required String address});
}

abstract class INetworkPrinterService {
  Future<List<BluetoothPrinterModel>> scan({
    String? subnet,
    void Function(String)? onProgress,
  });
  Future<bool> testConnection(String ip, int port);
  Future<bool> printBytes(
    List<int> bytes, {
    required String address,
    required int port,
  });
}

// ===============================
// Concrete simple service adapters (wrap existing libs)
// Keep them small so we can swap easily or mock in tests
// ===============================

class BluetoothPrinterService implements IBluetoothPrinterService {
  @override
  Future<List<BluetoothPrinterModel>> scan() async {
    final isEnabled = await PrintBluetoothThermal.bluetoothEnabled;
    if (!isEnabled) return [];

    final paired = await PrintBluetoothThermal.pairedBluetooths;
    return paired
        .map((b) => BluetoothPrinterModel.fromBluetoothInfo(b))
        .toList();
  }

  @override
  Future<bool> connect(String address) async {
    try {
      await PrintBluetoothThermal.disconnect; // ensure clean
      final connected = await PrintBluetoothThermal.connect(
        macPrinterAddress: address,
      );
      return connected;
    } catch (e) {
      AppLogger.error('Bluetooth connect error', error: e);
      return false;
    }
  }

  @override
  Future<void> disconnect() async {
    try {
      await PrintBluetoothThermal.disconnect;
    } catch (e) {
      AppLogger.error('Bluetooth disconnect error', error: e);
    }
  }

  @override
  Future<bool> printBytes(List<int> bytes, {required String address}) async {
    try {
      // print_bluetooth_thermal package expects content builder usage, adapt as needed
      // For now we attempt to send bytes; implement according to your print service.
      // This is a placeholder to be replaced with your existing print implementation.
      // Return true to indicate success in this adapter stub.
      return true;
    } catch (e) {
      AppLogger.error('Bluetooth print error', error: e);
      return false;
    }
  }
}

class NetworkPrinterService implements INetworkPrinterService {
  @override
  Future<List<BluetoothPrinterModel>> scan({
    String? subnet,
    void Function(String)? onProgress,
  }) async {
    final discovered = await NetworkDiscoveryService.discoverNetworkPrinters(
      customSubnet: subnet,
      onProgress: (p) => onProgress?.call(p),
      onProgressCount: (c, t) {},
    );

    return discovered.map((d) => d.toPrinterModel()).toList();
  }

  @override
  Future<bool> testConnection(String ip, int port) async {
    return NetworkDiscoveryService.testConnection(ip, port);
  }

  @override
  Future<bool> printBytes(
    List<int> bytes, {
    required String address,
    required int port,
  }) async {
    return NetworkDiscoveryService.testPrintToNetworkPrinter(
      BluetoothPrinterModel(
        name: 'Network Printer',
        address: address,
        connectionType: 'network',
        port: port,
        lastSeen: DateTime.now(),
      ),
      bytes,
    );
  }
}

// ===============================
// Providers
// ===============================

final printerBoxProvider = Provider<Box<BluetoothPrinterModel>>((ref) {
  throw UnimplementedError('Override with real Hive box in main');
});

final bluetoothServiceProvider = Provider<IBluetoothPrinterService>((ref) {
  return BluetoothPrinterService();
});

final networkServiceProvider = Provider<INetworkPrinterService>((ref) {
  return NetworkPrinterService();
});

// Permission helper provider
final permissionServiceProvider = Provider<PermissionService>(
  (ref) => PermissionService(),
);

class PermissionService {
  Future<bool> ensureBluetoothPermissions() async {
    try {
      final perms =
          await [
            Permission.bluetoothScan,
            Permission.bluetoothConnect,
            Permission.locationWhenInUse,
          ].request();
      return perms.values.every((s) => s == PermissionStatus.granted);
    } catch (e) {
      AppLogger.error('Permission error', error: e);
      return false;
    }
  }
}

// ===============================
// Generic Printer Manager Notifier
// ===============================

class GenericPrinterManagerNotifier
    extends StateNotifier<GenericPrinterScanState> {
  final IBluetoothPrinterService bluetoothService;
  final INetworkPrinterService networkService;
  final Box<BluetoothPrinterModel> box;
  final Ref ref;

  GenericPrinterManagerNotifier({
    required this.bluetoothService,
    required this.networkService,
    required this.box,
    required this.ref,
  }) : super(
         const GenericPrinterScanState(protocol: PrinterProtocol.bluetooth),
       );

  Future<void> scan({required PrinterProtocol protocol, String? subnet}) async {
    state = state.copyWith(
      isScanning: true,
      protocol: protocol,
      error: null,
      progress: 0.0,
    );

    try {
      if (protocol == PrinterProtocol.bluetooth) {
        final perm =
            await ref
                .read(permissionServiceProvider)
                .ensureBluetoothPermissions();
        if (!perm) {
          state = state.copyWith(
            isScanning: false,
            error: 'Bluetooth permissions not granted',
          );
          return;
        }

        final results = await bluetoothService.scan();
        state = state.copyWith(
          isScanning: false,
          foundPrinters: results,
          progress: 1.0,
        );
      } else {
        final results = await networkService.scan(
          subnet: subnet,
          onProgress: (p) {
            // could parse p into progress if needed
            // state = state.copyWith(progress: someValue);
          },
        );
        state = state.copyWith(
          isScanning: false,
          foundPrinters: results,
          progress: 1.0,
        );
      }
    } catch (e) {
      state = state.copyWith(isScanning: false, error: e.toString());
    }
  }

  void clearScan() {
    state = state.copyWith(
      isScanning: false,
      foundPrinters: [],
      error: null,
      progress: 0.0,
    );
  }

  // Save / Update / Delete printers - single source of truth in Hive box
  Future<Result<void>> savePrinter(BluetoothPrinterModel printer) async {
    try {
      final key = _generateKey(printer);
      await box.put(key, printer);
      return Result.success(null);
    } catch (e) {
      return Result.failure('Gagal menyimpan printer: $e');
    }
  }

  Future<Result<void>> updatePrinter(BluetoothPrinterModel printer) async {
    try {
      final existingKey = box.keys.firstWhere(
        (k) => box.get(k)?.address == printer.address,
        orElse: () => null,
      );
      if (existingKey == null) return Result.failure('Printer tidak ditemukan');
      await box.put(existingKey, printer);
      return Result.success(null);
    } catch (e) {
      return Result.failure('Gagal update printer: $e');
    }
  }

  Future<Result<void>> deletePrinter(String address) async {
    try {
      final key = box.keys.firstWhere(
        (k) => box.get(k)?.address == address,
        orElse: () => null,
      );
      if (key == null) return Result.failure('Printer tidak ditemukan');
      await box.delete(key);
      return Result.success(null);
    } catch (e) {
      return Result.failure('Gagal menghapus printer: $e');
    }
  }

  List<BluetoothPrinterModel> getAllSavedPrinters() {
    try {
      return box.values.toList();
    } catch (e) {
      AppLogger.error('Load saved printers error', error: e);
      return [];
    }
  }

  List<BluetoothPrinterModel> getPrintersByProtocol(PrinterProtocol protocol) {
    return getAllSavedPrinters()
        .where(
          (p) =>
              p.connectionType ==
              (protocol == PrinterProtocol.bluetooth ? 'bluetooth' : 'network'),
        )
        .toList();
  }

  List<BluetoothPrinterModel> getPrintersByJobType(String jobType) {
    return getAllSavedPrinters().where((printer) {
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

  Future<Result<void>> testConnection(BluetoothPrinterModel printer) async {
    try {
      if (printer.isNetworkPrinter) {
        final ok = await networkService.testConnection(
          printer.address,
          printer.networkPort,
        );
        return ok
            ? Result.success(null)
            : Result.failure('Network connection failed');
      } else {
        final ok = await bluetoothService.connect(printer.address);
        if (ok) {
          await bluetoothService.disconnect();
          return Result.success(null);
        }
        return Result.failure('Bluetooth connection failed');
      }
    } catch (e) {
      return Result.failure(e.toString());
    }
  }

  Future<Result<void>> printOrder({
    required OrderDetailModel order,
    required BluetoothPrinterModel printer,
    required String printType,
  }) async {
    try {
      // Prepare print bytes according to order and printType
      final bytes = await _buildPrintBytes(
        order: order,
        printType: printType,
        printer: printer,
      );

      bool ok = false;
      if (printer.isNetworkPrinter) {
        ok = await networkService.printBytes(
          bytes,
          address: printer.address,
          port: printer.networkPort,
        );
      } else {
        ok = await bluetoothService.printBytes(bytes, address: printer.address);
      }

      return ok
          ? Result.success(null)
          : Result.failure('Gagal melakukan print');
    } catch (e) {
      return Result.failure(e.toString());
    }
  }

  Future<List<int>> _buildPrintBytes({
    required OrderDetailModel order,
    required String printType,
    required BluetoothPrinterModel printer,
  }) async {
    // Build ESC/POS bytes according to your template. This function should be replaced by your application's existing print builder.
    final buffer = <int>[];
    buffer.addAll([0x1B, 0x40]); // Initialize
    final text =
        'ORDER #${order.orderId}\nTotal: ${order.grandTotal}\nType: $printType\n\n';
    buffer.addAll(text.codeUnits);
    buffer.addAll([0x1D, 0x56, 0x00]); // Cut
    return buffer;
  }

  String _generateKey(BluetoothPrinterModel p) {
    if (p.isNetworkPrinter) {
      return 'net_${p.address.replaceAll('.', '_')}_${p.networkPort}';
    }
    return 'bt_${p.address}';
  }
}

// Provider factory for GenericPrinterManagerNotifier
final genericPrinterManagerProvider = StateNotifierProvider<
  GenericPrinterManagerNotifier,
  GenericPrinterScanState
>((ref) {
  final box = ref.watch(printerBoxProvider);
  return GenericPrinterManagerNotifier(
    bluetoothService: ref.watch(bluetoothServiceProvider),
    networkService: ref.watch(networkServiceProvider),
    box: box,
    ref: ref,
  );
});

// ===============================
// Optional: Separate small notifiers for Connection tracking / Active connection
// These can co-exist and subscribe to generic manager
// ===============================

final printerConnectionProvider =
    NotifierProvider<PrinterConnectionNotifier, Map<String, PrinterStatus>>(() {
      return PrinterConnectionNotifier();
    });

class PrinterConnectionNotifier extends Notifier<Map<String, PrinterStatus>> {
  @override
  Map<String, PrinterStatus> build() {
    return {};
  }

  PrinterStatus? getStatus(String address) => state[address];

  void update(String address, ConnectionStateEnum s, {String? error}) {
    state = {
      ...state,
      address: PrinterStatus(
        address: address,
        state: s,
        errorMessage: error,
        lastUpdated: DateTime.now(),
      ),
    };
  }

  void remove(String address) {
    final newMap = Map<String, PrinterStatus>.from(state);
    newMap.remove(address);
    state = newMap;
  }
}

final activePrinterProvider =
    NotifierProvider<ActivePrinterNotifier, PrinterStatus?>(() {
      return ActivePrinterNotifier();
    });

class ActivePrinterNotifier extends Notifier<PrinterStatus?> {
  @override
  PrinterStatus? build() => null;

  Future<Result<void>> connect(BluetoothPrinterModel printer, Ref ref) async {
    final connNotifier = ref.read(printerConnectionProvider.notifier);
    state = PrinterStatus(
      address: printer.address,
      state: ConnectionStateEnum.connecting,
      lastUpdated: DateTime.now(),
    );
    connNotifier.update(printer.address, ConnectionStateEnum.connecting);

    try {
      final svc = ref.read(bluetoothServiceProvider) as BluetoothPrinterService;
      final ok = await svc.connect(printer.address);
      final newState =
          ok ? ConnectionStateEnum.connected : ConnectionStateEnum.failed;
      state = state?.copyWith(state: newState, lastUpdated: DateTime.now());
      connNotifier.update(
        printer.address,
        newState,
        error: ok ? null : 'Failed to connect',
      );
      return ok ? Result.success(null) : Result.failure('Failed to connect');
    } catch (e) {
      connNotifier.update(
        printer.address,
        ConnectionStateEnum.failed,
        error: e.toString(),
      );
      state = state?.copyWith(
        state: ConnectionStateEnum.failed,
        lastUpdated: DateTime.now(),
        errorMessage: e.toString(),
      );
      return Result.failure(e.toString());
    }
  }

  Future<void> disconnect(Ref ref) async {
    try {
      final svc = ref.read(bluetoothServiceProvider);
      await svc.disconnect();
      if (state != null) {
        ref
            .read(printerConnectionProvider.notifier)
            .update(state!.address, ConnectionStateEnum.disconnected);
      }
      state = null;
    } catch (e) {
      AppLogger.error('Disconnect error', error: e);
    }
  }
}

// ===============================
// Usage notes:
// - Override `printerBoxProvider` in main.dart with actual Hive box instance
// - Replace placeholder printBytes implementations with your production print builder
// - The manager provides unified methods for scan/save/update/delete/test/print
// - UI can watch `genericPrinterManagerProvider` for scan results and use `getAllSavedPrinters()` to list saved devices
// ===============================
