// lib/providers/bluetooth_scan_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

final bluetoothScanProvider =
    StateNotifierProvider<BluetoothScanNotifier, List<BluetoothDevice>>((ref) {
  return BluetoothScanNotifier();
});

class BluetoothScanNotifier extends StateNotifier<List<BluetoothDevice>> {
  BluetoothScanNotifier() : super([]);

  Future<void> startScan() async {
    state = []; // reset
    FlutterBluePlus.startScan(timeout: const Duration(seconds: 4));
    FlutterBluePlus.scanResults.listen((results) {
      final devices = results.map((r) => r.device).toSet().toList();
      state = devices;
    });
  }

  Future<void> stopScan() async {
    await FlutterBluePlus.stopScan();
  }
}
