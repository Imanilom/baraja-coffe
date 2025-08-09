import 'dart:io';
// import 'dart:typed_data';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:ping_discover_network_forked/ping_discover_network_forked.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';

class DiscoveredDevice {
  final String ipAddress;
  final bool isReachable;
  final Duration? responseTime;
  final List<int> openPorts;
  final Map<String, dynamic> deviceInfo;

  DiscoveredDevice({
    required this.ipAddress,
    required this.isReachable,
    this.responseTime,
    this.openPorts = const [],
    this.deviceInfo = const {},
  });

  bool get isPotentialPrinter {
    final printerPorts = [9100, 515, 631, 9101, 9102];
    return openPorts.any((port) => printerPorts.contains(port));
  }

  BluetoothPrinterModel toPrinterModel() {
    final defaultPort =
        openPorts.contains(9100)
            ? 9100
            : openPorts.contains(515)
            ? 515
            : openPorts.contains(631)
            ? 631
            : 9100;

    return BluetoothPrinterModel(
      name: deviceInfo['name'] ?? 'Network Printer ($ipAddress)',
      address: ipAddress,
      connectionType: 'network',
      port: defaultPort,
      manufacturer: deviceInfo['manufacturer'] ?? 'Unknown',
      model: deviceInfo['model'] ?? 'Thermal Printer',
      paperSize: PaperSizeConverter.toPaperString(
        deviceInfo['paperSize'] ?? 'mm80',
      ),
      lastSeen: DateTime.now(),
      isOnline: true,
    );
  }
}

class NetworkDiscoveryService {
  static Future<String?> _getCurrentSubnet() async {
    try {
      final info = NetworkInfo();
      final wifiIP = await info.getWifiIP();

      if (wifiIP != null) {
        final parts = wifiIP.split('.');
        if (parts.length == 4) {
          return '${parts[0]}.${parts[1]}.${parts[2]}';
        }
      }
      return null;
    } catch (e) {
      print('❌ Error getting subnet: $e');
      return null;
    }
  }

  static Future<List<DiscoveredDevice>> discoverNetworkPrinters({
    String? customSubnet,
    Duration timeout = const Duration(seconds: 3),
    Function(String)? onProgress,
    Function(int, int)? onProgressCount,
  }) async {
    try {
      final subnet = customSubnet ?? await _getCurrentSubnet();
      if (subnet == null) {
        throw Exception('Tidak dapat mendeteksi subnet jaringan');
      }

      onProgress?.call('🔍 Memindai jaringan $subnet.0/24...');
      print('🔍 Memindai jaringan: $subnet');

      final discoveredDevices = <DiscoveredDevice>[];

      // Scan range 1-254
      int currentHost = 0;
      const totalHosts = 254;

      // Use NetworkAnalyzer to discover devices on common printer ports
      final commonPrinterPorts = [9100, 515, 631];

      for (final port in commonPrinterPorts) {
        onProgress?.call('🔍 Memindai port $port...');

        final stream = NetworkAnalyzer.discover2(
          subnet,
          port,
          timeout: timeout,
        );

        await for (final device in stream) {
          currentHost++;
          onProgressCount?.call(
            currentHost,
            totalHosts * commonPrinterPorts.length,
          );

          if (device.exists) {
            onProgress?.call('✅ Perangkat ditemukan di ${device.ip}:$port');

            // Check if we already found this IP
            final existingDevice = discoveredDevices.firstWhere(
              (d) => d.ipAddress == device.ip,
              orElse: () => DiscoveredDevice(ipAddress: '', isReachable: false),
            );

            if (existingDevice.ipAddress.isEmpty) {
              // New device found
              final deviceDetails = await _analyzeDevice(device.ip, timeout);
              discoveredDevices.add(deviceDetails);
            } else {
              // Update existing device with new port
              final updatedPorts = List<int>.from(existingDevice.openPorts);
              if (!updatedPorts.contains(port)) {
                updatedPorts.add(port);
              }

              // Replace the device with updated ports
              final index = discoveredDevices.indexOf(existingDevice);
              discoveredDevices[index] = DiscoveredDevice(
                ipAddress: existingDevice.ipAddress,
                isReachable: existingDevice.isReachable,
                responseTime: existingDevice.responseTime,
                openPorts: updatedPorts,
                deviceInfo: existingDevice.deviceInfo,
              );
            }

            print('✅ Perangkat ditemukan: ${device.ip}:$port');
          }
        }
      }

      final printerDevices =
          discoveredDevices.where((d) => d.isPotentialPrinter).toList();

      onProgress?.call(
        '🔍 Pemindaian selesai. Ditemukan ${printerDevices.length} printer potensial',
      );
      print('🔍 Pemindaian selesai. Total printer: ${printerDevices.length}');

      return printerDevices;
    } catch (e) {
      print('❌ Error saat discover network: $e');
      throw Exception('Gagal memindai jaringan: $e');
    }
  }

  static Future<DiscoveredDevice> _analyzeDevice(
    String ipAddress,
    Duration timeout,
  ) async {
    final stopwatch = Stopwatch()..start();

    try {
      // Scan for open ports
      final openPorts = await _scanPorts(ipAddress, [
        9100,
        515,
        631,
        9101,
        9102,
      ]);

      stopwatch.stop();

      // Try to get device info
      final deviceInfo = await _getDeviceInfo(ipAddress, openPorts);

      return DiscoveredDevice(
        ipAddress: ipAddress,
        isReachable: openPorts.isNotEmpty,
        responseTime: stopwatch.elapsed,
        openPorts: openPorts,
        deviceInfo: deviceInfo,
      );
    } catch (e) {
      stopwatch.stop();
      return DiscoveredDevice(
        ipAddress: ipAddress,
        isReachable: false,
        responseTime: stopwatch.elapsed,
      );
    }
  }

  static Future<List<int>> _scanPorts(String ipAddress, List<int> ports) async {
    final openPorts = <int>[];

    for (final port in ports) {
      try {
        final socket = await Socket.connect(
          ipAddress,
          port,
          timeout: const Duration(seconds: 2),
        );
        await socket.close();
        openPorts.add(port);
      } catch (e) {
        // Port is closed or filtered
      }
    }

    return openPorts;
  }

  static Future<Map<String, dynamic>> _getDeviceInfo(
    String ipAddress,
    List<int> openPorts,
  ) async {
    final deviceInfo = <String, dynamic>{};

    try {
      // Try to get printer info via port 9100 (Raw/JetDirect)
      if (openPorts.contains(9100)) {
        final printerInfo = await _queryPrinterInfo(ipAddress, 9100);
        deviceInfo.addAll(printerInfo);
      }

      deviceInfo['detectedPorts'] = openPorts;
      deviceInfo['isPrinter'] = openPorts.any(
        (port) => [9100, 515, 631].contains(port),
      );
      deviceInfo['scanTime'] = DateTime.now().toIso8601String();
    } catch (e) {
      print('⚠️ Could not get device info for $ipAddress: $e');
    }

    return deviceInfo;
  }

  static Future<Map<String, dynamic>> _queryPrinterInfo(
    String ipAddress,
    int port,
  ) async {
    final info = <String, dynamic>{};

    try {
      final socket = await Socket.connect(
        ipAddress,
        port,
        timeout: const Duration(seconds: 3),
      );

      // Send ESC/P commands to get printer status
      final commands = [
        [0x1B, 0x40], // ESC @ (Initialize printer)
        [0x1D, 0x49, 0x01], // GS I 1 (Get printer ID)
        [0x1D, 0x49, 0x02], // GS I 2 (Get printer name)
      ];

      for (final command in commands) {
        socket.add(command);
        await socket.flush();
        await Future.delayed(const Duration(milliseconds: 200));
      }

      // Try to read response
      try {
        final response = await socket.first.timeout(const Duration(seconds: 2));
        if (response.isNotEmpty) {
          final responseStr = String.fromCharCodes(response);
          info['rawResponse'] = responseStr;
          info['supportsEscPos'] = true;

          // Try to extract printer info from response
          _parsePrinterResponse(responseStr, info);
        }
      } catch (e) {
        print('⚠️ Timeout waiting for printer response');
      }

      await socket.close();
    } catch (e) {
      print('⚠️ Could not query printer info: $e');
      info['supportsEscPos'] = false;
    }

    return info;
  }

  static void _parsePrinterResponse(
    String response,
    Map<String, dynamic> info,
  ) {
    try {
      // Clean response and try to extract useful information
      final cleanResponse =
          response.replaceAll(RegExp(r'[^\x20-\x7E]'), '').trim();

      if (cleanResponse.isNotEmpty) {
        info['name'] = 'Network Printer';

        // Try to detect manufacturer
        if (cleanResponse.toUpperCase().contains('EPSON')) {
          info['manufacturer'] = 'Epson';
        } else if (cleanResponse.toUpperCase().contains('STAR')) {
          info['manufacturer'] = 'Star';
        } else if (cleanResponse.toUpperCase().contains('CITIZEN')) {
          info['manufacturer'] = 'Citizen';
        } else if (cleanResponse.toUpperCase().contains('BIXOLON')) {
          info['manufacturer'] = 'Bixolon';
        } else if (cleanResponse.toUpperCase().contains('IWARE')) {
          info['manufacturer'] = 'IWare';
        }

        // Try to detect model
        final modelMatch = RegExp(
          r'([A-Z]{2,}-[A-Z0-9]+|[A-Z]+[0-9]+)',
          caseSensitive: false,
        ).firstMatch(cleanResponse);
        if (modelMatch != null) {
          info['model'] = modelMatch.group(0);
        }
      }
    } catch (e) {
      print('⚠️ Error parsing printer response: $e');
    }
  }

  static Future<bool> testConnection(String ipAddress, int port) async {
    try {
      final socket = await Socket.connect(
        ipAddress,
        port,
        timeout: const Duration(seconds: 5),
      );
      await socket.close();
      return true;
    } catch (e) {
      print('❌ Test connection failed for $ipAddress:$port - $e');
      return false;
    }
  }

  static Future<bool> testPrintToNetworkPrinter(
    BluetoothPrinterModel printer,
    List<int> printData,
  ) async {
    Socket? socket;
    try {
      socket = await Socket.connect(
        printer.address,
        printer.networkPort,
        timeout: const Duration(seconds: 5),
      );

      // Send print data
      socket.add(printData);
      await socket.flush();

      // Wait a bit to ensure data is sent
      await Future.delayed(const Duration(milliseconds: 500));

      print('✅ Test print berhasil dikirim ke ${printer.name}');
      return true;
    } catch (e) {
      print('❌ Test print gagal ke ${printer.name}: $e');
      return false;
    } finally {
      try {
        await socket?.close();
      } catch (e) {
        print('⚠️ Error closing socket: $e');
      }
    }
  }

  // Quick scan untuk IP range yang lebih kecil
  static Future<List<String>> quickScan({
    String? subnet,
    Function(String)? onProgress,
  }) async {
    final currentSubnet = subnet ?? await _getCurrentSubnet();
    if (currentSubnet == null) return [];

    final printerIPs = <String>[];
    final commonPrinterPorts = [9100];

    onProgress?.call('🔍 Quick scan dimulai...');

    // Scan first 50 IPs for speed
    for (int i = 1; i <= 50; i++) {
      final ip = '$currentSubnet.$i';

      for (final port in commonPrinterPorts) {
        try {
          final socket = await Socket.connect(
            ip,
            port,
            timeout: const Duration(milliseconds: 800),
          );
          await socket.close();

          if (!printerIPs.contains(ip)) {
            printerIPs.add(ip);
            onProgress?.call('✅ Printer ditemukan: $ip:$port');
          }
          break;
        } catch (e) {
          // Continue to next IP
        }
      }
    }

    onProgress?.call(
      '🔍 Quick scan selesai. Ditemukan ${printerIPs.length} printer',
    );
    return printerIPs;
  }
}
