// providers/ble_scan_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_reactive_ble/flutter_reactive_ble.dart';

final ble = FlutterReactiveBle();

final bleScanProvider =
    StateNotifierProvider<BLEScanNotifier, List<DiscoveredDevice>>((ref) {
  return BLEScanNotifier();
});

class BLEScanNotifier extends StateNotifier<List<DiscoveredDevice>> {
  BLEScanNotifier() : super([]);

  late Stream<DiscoveredDevice> _scanStream;

  void startScan() {
    state = [];
    _scanStream =
        ble.scanForDevices(withServices: [], scanMode: ScanMode.lowLatency);

    _scanStream.listen((device) {
      if (!state.any((d) => d.id == device.id)) {
        state = [...state, device];
      }
    }, onError: (e) {
      print("BLE scan error: $e");
    });
  }

  void stopScan() {
    ble.deinitialize();
  }
}
