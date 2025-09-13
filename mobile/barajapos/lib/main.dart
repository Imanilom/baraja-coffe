import 'package:barajapos/routes/app_router.dart';
import 'package:barajapos/services/hive_service.dart';
// import 'package:barajapos/screens/layout/layout.dart';
// import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  await HiveService.init();

  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]).then((_) {
    runApp(const ProviderScope(child: MyApp()));
    // runApp(const MyWidget());
  });
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goRouter = ref.watch(goRouterProvider);

    return ShadcnApp.router(
      theme: ThemeData(
        colorScheme: ColorSchemes.lightBlue(),
        radius: 0.5,
      ),
      scaling: const AdaptiveScaling(0.8),
      debugShowCheckedModeBanner: false,
      routerConfig: goRouter,
      // home: const MyHomePage(),
    );
  }
}

// class MyWidget extends ConsumerWidget {
//   const MyWidget({super.key});

//   @override
//   Widget build(BuildContext context, WidgetRef ref) {
//     return ShadcnApp(
//       theme: ThemeData(
//         colorScheme: ColorSchemes.darkZinc(),
//         useMaterial3: true,
//         radius: 0.5,
//       ),
//       debugShowCheckedModeBanner: false,
//       home: const Layout(),
//     );
//   }
// }

// import 'package:flutter/services.dart';
// import 'package:shadcn_flutter/shadcn_flutter.dart';

// void main() {
//   WidgetsFlutterBinding.ensureInitialized();
//   SystemChrome.setSystemUIOverlayStyle(
//       const SystemUiOverlayStyle(systemNavigationBarColor: Colors.transparent));
//   SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
//   SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
//   SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
//   runApp(const MyApp());
// }

// class MyApp extends StatelessWidget {
//   const MyApp({super.key});

//   @override
//   Widget build(BuildContext context) {
//     return ShadcnApp(
//       title: 'My App',
//       home: const Layout(),
//       theme: ThemeData(
//         colorScheme: ColorSchemes.lightBlue(),
//         radius: 0.8,
//       ),
//       debugShowCheckedModeBanner: false,
//       scaling: const AdaptiveScaling(0.8),
//     );
//   }
// }
