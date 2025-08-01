import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/providers/router_provider.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/services/notification_service.dart';
import 'package:overlay_support/overlay_support.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  await HiveService.init();
  await initializeDateFormatting('id_ID', null);

  final printerBox = Hive.box<BluetoothPrinterModel>('printers');

  // Inisialisasi notifikasi
  await NotificationService.init();

  // SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeRight,
    DeviceOrientation.landscapeLeft,
  ]).then((_) {
    runApp(
      ProviderScope(
        overrides: [
          // Override dengan Hive box yang sudah diinisialisasi
          printerBoxProvider.overrideWithValue(printerBox),
        ],
        child: OverlaySupport.global(child: MyApp()),
      ),
    );
    // runApp(const MyWidget());
  });
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
