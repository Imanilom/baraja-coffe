import 'dart:io';
// import 'dart:typed_data';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:ping_discover_network_forked/ping_discover_network_forked.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/utils/app_logger.dart';

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

    // Enhanced paper size detection
    String paperSize = _determinePaperSize();

    // Enhanced printer name
    String printerName = _generatePrinterName();

    AppLogger.debug('🖨️ Creating printer model for $ipAddress:');
    AppLogger.debug('   Name: $printerName');
    AppLogger.debug('   Paper Size: $paperSize');
    AppLogger.debug(
      '   Manufacturer: ${deviceInfo['manufacturer'] ?? 'Unknown'}',
    );
    AppLogger.debug('   Model: ${deviceInfo['model'] ?? 'Unknown'}');

    return BluetoothPrinterModel(
      name: printerName,
      address: ipAddress,
      connectionType: 'network',
      port: defaultPort,
      manufacturer: deviceInfo['manufacturer']?.toString(),
      model: deviceInfo['model']?.toString(),
      paperSize: paperSize,
      lastSeen: DateTime.now(),
      isOnline: true,
    );
  }

  String _determinePaperSize() {
    // Priority 1: Explicitly detected paper size
    if (deviceInfo.containsKey('paperSize') &&
        deviceInfo['paperSize'] != null) {
      final detectedSize = deviceInfo['paperSize'].toString();
      if (['mm58', 'mm80', 'mm112'].contains(detectedSize)) {
        return detectedSize;
      }
    }

    // Priority 2: Model-based inference
    final model = deviceInfo['model']?.toString().toUpperCase() ?? '';
    final manufacturer =
        deviceInfo['manufacturer']?.toString().toUpperCase() ?? '';

    // Specific model patterns for paper sizes
    final paperSizePatterns = {
      'mm58': [
        // Epson 58mm models
        'TM-P60', 'TM-P20', 'TM-T20X', 'TM-M10', 'TM-M30',
        // Star 58mm models
        'TSP100', 'SM-S210i', 'SM-S220i', 'SM-T300i',
        // Bixolon 58mm models
        'SRP-275', 'SPP-R200', 'SPP-R210',
        // Other 58mm indicators
        '58MM', '_58_', '-58-',
      ],
      'mm80': [
        // Epson 80mm models
        'TM-T82', 'TM-T88', 'TM-U220', 'TM-T70', 'TM-T81', 'TM-T83',
        // Star 80mm models
        'TSP650', 'TSP700', 'TSP800', 'SP700', 'SP742',
        // Bixolon 80mm models
        'SRP-350', 'SRP-380', 'SRP-330', 'SRP-Q300',
        // Citizen 80mm models
        'CT-S310', 'CT-S4000', 'CT-E351',
        // Other 80mm indicators
        '80MM', '_80_', '-80-',
      ],
    };

    // Check model against patterns
    for (final entry in paperSizePatterns.entries) {
      for (final pattern in entry.value) {
        if (model.contains(pattern)) {
          return entry.key;
        }
      }
    }

    // Priority 3: Manufacturer defaults
    final manufacturerDefaults = {
      'EPSON': 'mm80', // Most Epson thermal printers are 80mm
      'STAR': 'mm80', // Star has both, but 80mm is more common
      'BIXOLON': 'mm80', // Most Bixolon are 80mm
      'CITIZEN': 'mm80', // Most Citizen are 80mm
      'CUSTOM': 'mm58', // Custom often makes 58mm
      'RONGTA': 'mm80', // Rongta mostly 80mm
      'XPRINTER': 'mm80', // XPrinter mostly 80mm
    };

    if (manufacturerDefaults.containsKey(manufacturer)) {
      return manufacturerDefaults[manufacturer]!;
    }

    // Priority 4: Port-based inference
    if (openPorts.contains(9100)) {
      // Port 9100 is typically used by 80mm thermal printers
      return 'mm80';
    }

    // Priority 5: Response length heuristic
    final responseLength = deviceInfo['rawResponse']?.toString().length ?? 0;
    if (responseLength > 100) {
      return 'mm80'; // Longer response suggests more capable printer
    } else if (responseLength > 20) {
      return 'mm58'; // Shorter response might indicate simpler printer
    }

    // Default fallback
    return 'mm80';
  }

  String _generatePrinterName() {
    final manufacturer = deviceInfo['manufacturer']?.toString() ?? '';
    final model = deviceInfo['model']?.toString() ?? '';

    if (manufacturer.isNotEmpty && model.isNotEmpty) {
      return '$manufacturer $model ($ipAddress)';
    } else if (manufacturer.isNotEmpty) {
      return '$manufacturer Printer ($ipAddress)';
    } else if (model.isNotEmpty) {
      return '$model ($ipAddress)';
    } else {
      // Fallback: try to infer from response
      final response = deviceInfo['rawResponse']?.toString() ?? '';
      if (response.isNotEmpty) {
        // Extract any meaningful text from response
        final cleanResponse =
            response.replaceAll(RegExp(r'[^\w\s-]'), '').trim();
        final words = cleanResponse.split(RegExp(r'\s+'));
        final meaningfulWords = words
            .where(
              (word) =>
                  word.length >= 3 &&
                  ![
                    'THE',
                    'AND',
                    'FOR',
                    'ARE',
                    'BUT',
                    'NOT',
                  ].contains(word.toUpperCase()),
            )
            .take(2);

        if (meaningfulWords.isNotEmpty) {
          return '${meaningfulWords.join(' ')} ($ipAddress)';
        }
      }

      return 'Network Printer ($ipAddress)';
    }
  }

  // Helper method untuk debugging
  void printDebugInfo() {
    AppLogger.debug('🔍 DiscoveredDevice Debug Info:');
    AppLogger.debug('   IP: $ipAddress');
    AppLogger.debug('   Reachable: $isReachable');
    AppLogger.debug('   Open Ports: $openPorts');
    AppLogger.debug('   Response Time: ${responseTime?.inMilliseconds}ms');
    AppLogger.debug('   Device Info:');
    deviceInfo.forEach((key, value) {
      AppLogger.debug('     $key: $value');
    });
    AppLogger.debug('   Final Paper Size: ${_determinePaperSize()}');
    AppLogger.debug('   Final Name: ${_generatePrinterName()}');
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
      AppLogger.error('❌ Error getting subnet', error: e);
      return null;
    }
  }

  // static Future<List<DiscoveredDevice>> discoverNetworkPrinters({
  //   String? customSubnet,
  //   Duration timeout = const Duration(seconds: 3),
  //   Function(String)? onProgress,
  //   Function(int, int)? onProgressCount,
  // }) async {
  //   try {
  //     final subnet = customSubnet ?? await _getCurrentSubnet();
  //     if (subnet == null) {
  //       throw Exception('Tidak dapat mendeteksi subnet jaringan');
  //     }

  //     onProgress?.call('🔍 Memindai jaringan $subnet.0/24...');
  //     print('🔍 Memindai jaringan: $subnet');

  //     final discoveredDevices = <DiscoveredDevice>[];

  //     // Scan range 1-254
  //     int currentHost = 0;
  //     const totalHosts = 254;

  //     // Use NetworkAnalyzer to discover devices on common printer ports
  //     final commonPrinterPorts = [9100, 515, 631];

  //     for (final port in commonPrinterPorts) {
  //       onProgress?.call('🔍 Memindai port $port...');

  //       final stream = NetworkAnalyzer.discover2(
  //         subnet,
  //         port,
  //         timeout: timeout,
  //       );

  //       await for (final device in stream) {
  //         currentHost++;
  //         onProgressCount?.call(
  //           currentHost,
  //           totalHosts * commonPrinterPorts.length,
  //         );

  //         if (device.exists) {
  //           onProgress?.call('✅ Perangkat ditemukan di ${device.ip}:$port');
  //           print('✅ Detail Perangkat ditemukan: $device');
  //           // Check if we already found this IP
  //           final existingDevice = discoveredDevices.firstWhere(
  //             (d) => d.ipAddress == device.ip,
  //             orElse: () => DiscoveredDevice(ipAddress: '', isReachable: false),
  //           );

  //           if (existingDevice.ipAddress.isEmpty) {
  //             // New device found
  //             final deviceDetails = await _analyzeDevice(device.ip, timeout);
  //             discoveredDevices.add(deviceDetails);
  //           } else {
  //             // Update existing device with new port
  //             final updatedPorts = List<int>.from(existingDevice.openPorts);
  //             if (!updatedPorts.contains(port)) {
  //               updatedPorts.add(port);
  //             }

  //             // Replace the device with updated ports
  //             final index = discoveredDevices.indexOf(existingDevice);
  //             discoveredDevices[index] = DiscoveredDevice(
  //               ipAddress: existingDevice.ipAddress,
  //               isReachable: existingDevice.isReachable,
  //               responseTime: existingDevice.responseTime,
  //               openPorts: updatedPorts,
  //               deviceInfo: existingDevice.deviceInfo,
  //             );
  //           }

  //           print('✅ Perangkat ditemukan: ${device.ip}:$port');
  //         }
  //       }
  //     }

  //     final printerDevices =
  //         discoveredDevices.where((d) => d.isPotentialPrinter).toList();

  //     onProgress?.call(
  //       '🔍 Pemindaian selesai. Ditemukan ${printerDevices.length} printer potensial',
  //     );
  //     print('🔍 Pemindaian selesai. Total printer: ${printerDevices.length}');

  //     return printerDevices;
  //   } catch (e) {
  //     print('❌ Error saat discover network: $e');
  //     throw Exception('Gagal memindai jaringan: $e');
  //   }
  // }

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
      AppLogger.info('✅ Dapatkan info printer untuk $ipAddress: $deviceInfo');

      deviceInfo['detectedPorts'] = openPorts;
      deviceInfo['isPrinter'] = openPorts.any(
        (port) => [9100, 515, 631].contains(port),
      );
      deviceInfo['scanTime'] = DateTime.now().toIso8601String();
    } catch (e) {
      AppLogger.warning(
        '⚠️ Could not get device info for $ipAddress',
        error: e,
      );
    }

    return deviceInfo;
  }

  // Enhanced NetworkDiscoveryService dengan deteksi paper size
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

      AppLogger.debug('🔍 Querying printer info for $ipAddress:$port');

      // Initialize printer and get status
      final commands = [
        [0x1B, 0x40], // ESC @ (Initialize printer)
        [0x1D, 0x49, 0x01], // GS I 1 (Get printer ID)
        [0x1D, 0x49, 0x02], // GS I 2 (Get printer type)
        [0x1D, 0x49, 0x03], // GS I 3 (Get serial number)
        // Paper size detection commands
        [0x1B, 0x61, 0x00], // ESC a 0 (Left align for test)
        [0x1D, 0x50, 0x00, 0x00], // GS P (Get paper sensor status)
        [0x10, 0x04, 0x01], // DLE EOT (Real-time status)
      ];

      // Send commands with delays
      for (int i = 0; i < commands.length; i++) {
        socket.add(commands[i]);
        await socket.flush();
        await Future.delayed(Duration(milliseconds: 300 + (i * 100)));
      }

      // Collect all responses
      final responses = <List<int>>[];
      try {
        await for (final response in socket.timeout(
          const Duration(seconds: 4),
        )) {
          if (response.isNotEmpty) {
            responses.add(response);
          }
        }
      } catch (e) {
        AppLogger.warning('⚠️ Timeout collecting responses', error: e);
      }

      await socket.close();

      // Process collected responses
      if (responses.isNotEmpty) {
        info['supportsEscPos'] = true;

        // Combine all responses
        final allBytes = <int>[];
        for (final response in responses) {
          allBytes.addAll(response);
        }

        final responseStr = String.fromCharCodes(
          allBytes.where((byte) => byte >= 32 && byte <= 126).toList(),
        );

        if (responseStr.isNotEmpty) {
          info['rawResponse'] = responseStr;
          AppLogger.debug('📝 Printer response: $responseStr');
        }

        // Enhanced parsing with paper size detection
        await _enhancedParsePrinterResponse(
          allBytes,
          responseStr,
          info,
          ipAddress,
        );
      }
    } catch (e) {
      AppLogger.warning('⚠️ Could not query printer info', error: e);
      info['supportsEscPos'] = false;
    }

    return info;
  }

  static Future<void> _enhancedParsePrinterResponse(
    List<int> rawBytes,
    String response,
    Map<String, dynamic> info,
    String ipAddress,
  ) async {
    try {
      // Set default values
      info['name'] = 'Network Printer';
      info['paperSize'] = 'mm80'; // Default paper size

      // Clean response
      final cleanResponse =
          response.replaceAll(RegExp(r'[^\x20-\x7E]'), '').trim();

      if (cleanResponse.isNotEmpty) {
        AppLogger.debug('📄 Clean response: $cleanResponse');

        // Manufacturer detection (enhanced)
        final manufacturerPatterns = {
          'EPSON': ['EPSON', 'TM-', 'LQ-', 'FX-'],
          'Star': ['STAR', 'TSP', 'SP7', 'mC-Print', 'SM-'],
          'Citizen': ['CITIZEN', 'CT-', 'CTS', 'CBM'],
          'Bixolon': ['BIXOLON', 'SRP', 'XQ'],
          'IWare': ['IWARE', 'IW-'],
          'Custom': ['CUSTOM', 'VKP'],
          'Rongta': ['RONGTA', 'RP'],
          'Xprinter': ['XPRINTER', 'XP'],
        };

        for (final entry in manufacturerPatterns.entries) {
          for (final pattern in entry.value) {
            if (cleanResponse.toUpperCase().contains(pattern)) {
              info['manufacturer'] = entry.key;
              break;
            }
          }
          if (info.containsKey('manufacturer')) break;
        }

        // Model detection (enhanced)
        final modelPatterns = [
          RegExp(
            r'(TM-[T,U,P,H,m][0-9]{2,3}[A-Z]*)',
            caseSensitive: false,
          ), // Epson TM series
          RegExp(
            r'(TSP[0-9]{3}[A-Z]*)',
            caseSensitive: false,
          ), // Star TSP series
          RegExp(
            r'(SRP-[0-9]{3}[A-Z]*)',
            caseSensitive: false,
          ), // Bixolon SRP series
          RegExp(
            r'(XP-[0-9]{3}[A-Z]*)',
            caseSensitive: false,
          ), // Xprinter series
          RegExp(r'(RP[0-9]{2}[A-Z]*)', caseSensitive: false), // Rongta series
          RegExp(
            r'([A-Z]{2,}-[A-Z0-9]+)',
            caseSensitive: false,
          ), // Generic pattern
          RegExp(
            r'([A-Z]+[0-9]{2,}[A-Z]*)',
            caseSensitive: false,
          ), // Another generic pattern
        ];

        for (final pattern in modelPatterns) {
          final match = pattern.firstMatch(cleanResponse);
          if (match != null) {
            info['model'] = match.group(0);
            break;
          }
        }
      }

      // Paper size detection using multiple methods
      final detectedPaperSize = await _detectPaperSize(
        ipAddress,
        info,
        cleanResponse,
      );
      if (detectedPaperSize != null) {
        info['paperSize'] = detectedPaperSize;
        AppLogger.info(
          '📏 Detected paper size: $detectedPaperSize for $ipAddress',
        );
      }

      // Status byte analysis for additional info
      _analyzeStatusBytes(rawBytes, info);
    } catch (e) {
      AppLogger.error('⚠️ Error in enhanced parsing', error: e);
    }
  }

  static Future<String?> _detectPaperSize(
    String ipAddress,
    Map<String, dynamic> info,
    String response,
  ) async {
    // Method 1: Model-based detection
    final model = info['model']?.toString().toUpperCase() ?? '';
    final manufacturer = info['manufacturer']?.toString().toUpperCase() ?? '';

    // Common model patterns for different paper sizes
    if (model.isNotEmpty) {
      // 58mm patterns
      if (model.contains('58') ||
          model.contains('TM-P60') ||
          model.contains('TM-P20') ||
          model.contains('TSP100') ||
          model.contains('SRP-275')) {
        return 'mm58';
      }

      // 80mm patterns
      if (model.contains('80') ||
          model.contains('TM-T82') ||
          model.contains('TM-T88') ||
          model.contains('TM-U220') ||
          model.contains('TSP650') ||
          model.contains('TSP700') ||
          model.contains('SRP-350') ||
          model.contains('SRP-380')) {
        return 'mm80';
      }
    }

    // Method 2: Direct paper width test (experimental)
    try {
      final testResult = await _testPaperWidth(ipAddress);
      if (testResult != null) {
        return testResult;
      }
    } catch (e) {
      AppLogger.warning('⚠️ Paper width test failed', error: e);
    }

    // Method 3: Manufacturer default patterns
    if (manufacturer == 'EPSON') {
      // Most Epson thermal printers are 80mm
      return 'mm80';
    } else if (manufacturer == 'STAR') {
      // Star has both 58mm and 80mm, default to 80mm
      return 'mm80';
    } else if (manufacturer == 'BIXOLON') {
      // Most Bixolon thermal printers are 80mm
      return 'mm80';
    }

    // Method 4: Response pattern analysis
    if (response.length > 50) {
      // Longer responses typically indicate wider paper (80mm)
      return 'mm80';
    } else if (response.length > 20) {
      return 'mm58';
    }

    // Default fallback
    return 'mm80';
  }

  static Future<String?> _testPaperWidth(String ipAddress) async {
    try {
      final socket = await Socket.connect(
        ipAddress,
        9100,
        timeout: const Duration(seconds: 2),
      );

      // Test print width by sending different width patterns
      final testCommands = [
        [0x1B, 0x40], // Initialize,
        // Test 58mm width (32 characters)
        ...('A' * 32).codeUnits,
        [0x0A], // Line feed,
        // Test 80mm width (48 characters)
        ...('B' * 48).codeUnits,
        [0x0A], // Line feed
        [0x1B, 0x64, 0x05], // Feed 5 lines
      ];

      // Flatten testCommands to List<int>
      final flattenedCommands = <int>[];
      for (final cmd in testCommands) {
        if (cmd is int) {
          flattenedCommands.add(cmd);
        } else if (cmd is List<int>) {
          flattenedCommands.addAll(cmd);
        }
      }

      socket.add(flattenedCommands);
      await socket.flush();

      // Wait for potential response
      await Future.delayed(const Duration(milliseconds: 500));

      await socket.close();

      // This is experimental - in practice, we can't easily determine
      // the paper size from the response, but we tried
      AppLogger.debug('📏 Paper width test completed for $ipAddress');
    } catch (e) {
      AppLogger.error('⚠️ Paper width test error', error: e);
    }

    return null; // Unable to determine from test
  }

  static void _analyzeStatusBytes(
    List<int> rawBytes,
    Map<String, dynamic> info,
  ) {
    try {
      // Look for status response patterns
      for (int i = 0; i < rawBytes.length; i++) {
        final byte = rawBytes[i];

        // ESC/POS status responses often start with specific bytes
        if (byte == 0x16 && i + 1 < rawBytes.length) {
          // SYN character
          final statusByte = rawBytes[i + 1];
          info['printerStatus'] = _interpretStatusByte(statusByte);
        }

        // DLE EOT response
        if (byte == 0x10 &&
            i + 1 < rawBytes.length &&
            rawBytes[i + 1] == 0x04) {
          if (i + 2 < rawBytes.length) {
            final statusByte = rawBytes[i + 2];
            info['realtimeStatus'] = _interpretStatusByte(statusByte);
          }
        }
      }
    } catch (e) {
      AppLogger.error('⚠️ Status byte analysis error', error: e);
    }
  }

  static Map<String, dynamic> _interpretStatusByte(int statusByte) {
    return {
      'paperPresent': (statusByte & 0x04) == 0,
      'coverClosed': (statusByte & 0x08) == 0,
      'cutterOk': (statusByte & 0x10) == 0,
      'drawerClosed': (statusByte & 0x01) == 0,
      'rawStatus': statusByte,
    };
  }

  // Update the main discovery method to ensure paper size is detected
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
      AppLogger.info('🔍 Memindai jaringan: $subnet');

      final discoveredDevices = <DiscoveredDevice>[];
      int currentHost = 0;
      const totalHosts = 254;
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

            final existingDevice = discoveredDevices.firstWhere(
              (d) => d.ipAddress == device.ip,
              orElse: () => DiscoveredDevice(ipAddress: '', isReachable: false),
            );

            if (existingDevice.ipAddress.isEmpty) {
              // New device - analyze it thoroughly
              final deviceDetails = await _analyzeDevice(device.ip, timeout);
              discoveredDevices.add(deviceDetails);

              // Log the detected paper size
              final paperSize =
                  deviceDetails.deviceInfo['paperSize'] ?? 'unknown';
              AppLogger.debug(
                '📏 Device ${device.ip} - Paper size: $paperSize',
              );
            } else {
              // Update existing device with new port
              final updatedPorts = List<int>.from(existingDevice.openPorts);
              if (!updatedPorts.contains(port)) {
                updatedPorts.add(port);
              }

              final index = discoveredDevices.indexOf(existingDevice);
              discoveredDevices[index] = DiscoveredDevice(
                ipAddress: existingDevice.ipAddress,
                isReachable: existingDevice.isReachable,
                responseTime: existingDevice.responseTime,
                openPorts: updatedPorts,
                deviceInfo: existingDevice.deviceInfo,
              );
            }
          }
        }
      }

      final printerDevices =
          discoveredDevices.where((d) => d.isPotentialPrinter).toList();

      // Log paper sizes found
      for (final device in printerDevices) {
        final paperSize = device.deviceInfo['paperSize'] ?? 'unknown';
        AppLogger.info(
          '📋 Final: ${device.ipAddress} -> Paper size: $paperSize',
        );
      }

      onProgress?.call(
        '🔍 Pemindaian selesai. Ditemukan ${printerDevices.length} printer potensial',
      );

      return printerDevices;
    } catch (e) {
      AppLogger.error('❌ Error saat discover network', error: e);
      throw Exception('Gagal memindai jaringan: $e');
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
      AppLogger.error(
        '❌ Test connection failed for $ipAddress:$port',
        error: e,
      );
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

      AppLogger.info('✅ Test print berhasil dikirim ke ${printer.name}');
      return true;
    } catch (e) {
      AppLogger.error('❌ Test print gagal ke ${printer.name}', error: e);
      return false;
    } finally {
      try {
        await socket?.close();
      } catch (e) {
        AppLogger.warning('⚠️ Error closing socket', error: e);
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
