import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_ce/hive.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:overlay_support/overlay_support.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/notification_service.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/router_provider.dart';

Future<void> _safe(String label, Future<void> Function() run) async {
  try {
    await run();
  } catch (e, st) {
    // Jangan biarkan init gagal menghentikan runApp di release
    debugPrint('INIT FAILED [$label]: $e\n$st');
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Tangkap error framework
  FlutterError.onError = (details) {
    FlutterError.dumpErrorToConsole(details);
  };

  // Tangkap semua error yang tidak tertangkap
  await runZonedGuarded<Future<void>>(
    () async {
      await _safe('dotenv', () async {
        // Pastikan .env dibundel di pubspec.yaml (lihat bagian 3)
        await dotenv.load(fileName: '.env');
      });

      await _safe('hive', () async {
        await HiveService.init();
        print('init hive');
      });

      await _safe('intl', () async {
        await initializeDateFormatting('id_ID', null);
      });

      await _safe('notification', () async {
        await NotificationService.init();
      });

      await _safe('orientation', () async {
        await SystemChrome.setPreferredOrientations([
          DeviceOrientation.landscapeRight,
          DeviceOrientation.landscapeLeft,
        ]);
      });

      // Ambil box printer jika ada; jangan biarkan error menghentikan runApp
      Box<BluetoothPrinterModel>? printerBox;
      try {
        printerBox = Hive.box<BluetoothPrinterModel>('printers');
      } catch (_) {
        // box belum ada? biarkan null, kita tidak override provider
      }

      runApp(
        ProviderScope(
          overrides: [
            if (printerBox != null)
              printerBoxProvider.overrideWithValue(printerBox),
          ],
          child: const OverlaySupport.global(child: MyApp()),
        ),
      );
    },
    (e, st) {
      debugPrint('UNCAUGHT ERROR: $e\n$st');
    },
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Baraja POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Poppins',
        scaffoldBackgroundColor: const Color.fromARGB(255, 236, 236, 236),
        textTheme: const TextTheme(
          bodySmall: TextStyle(fontSize: 10),
          bodyMedium: TextStyle(fontSize: 12),
          bodyLarge: TextStyle(fontSize: 14),
        ),
        colorScheme: ColorScheme.fromSeed(
          brightness: Brightness.light,
          primary: const Color.fromARGB(255, 24, 138, 39),
          seedColor: const Color.fromARGB(255, 24, 138, 39),
          inversePrimary: const Color(0xFFB39DDB),
        ),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
