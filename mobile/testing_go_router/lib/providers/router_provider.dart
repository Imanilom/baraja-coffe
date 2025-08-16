import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';
import 'package:kasirbaraja/screens/auth/login_cashier_screen.dart';
import 'package:kasirbaraja/screens/data_sync_screen.dart';
import 'package:kasirbaraja/screens/main_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/screens/payments/payment_success_screen.dart';
import 'package:kasirbaraja/screens/payments/payment_type_screen.dart';
import 'package:kasirbaraja/screens/reservation/reservation_menu_screen.dart';
import 'package:kasirbaraja/screens/settings/setting_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/detail_printer_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/scan_network_printer_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/scan_printer_screen.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import '../screens/auth/login_screen.dart';
import '../screens/boarding/splash_screen.dart';
import 'package:flutter/material.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(tryAuthProvider);
  // final authCashierState = ref.watch(authCashierProvider);
  final cashierId = HiveService.getCashier();

  return GoRouter(
    errorBuilder: (context, state) {
      return const Scaffold(body: Center(child: Text('Page not found')));
    },
    routes: [
      GoRoute(
        path: '/',
        pageBuilder:
            (context, state) => const MaterialPage(child: SplashScreen()),
      ),
      GoRoute(
        path: '/login',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              child: const LoginScreen(),
              transitionsBuilder: (
                context,
                animation,
                secondaryAnimation,
                child,
              ) {
                const begin = Offset(1.0, 0.0);
                const end = Offset.zero;
                const curve = Curves.ease;
                final tween = Tween(
                  begin: begin,
                  end: end,
                ).chain(CurveTween(curve: curve));
                return SlideTransition(
                  position: animation.drive(tween),
                  child: child,
                );
              },
            ),
      ),
      GoRoute(
        path: '/data-sync',
        name: 'data-sync',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              child: DataSyncScreen(
                userToken: state.extra as String?,
                onSyncComplete: () {
                  // Navigate to main screen after sync completed
                  context.go('/main');
                },
              ),
              transitionsBuilder: (
                context,
                animation,
                secondaryAnimation,
                child,
              ) {
                const begin = Offset(0.0, 1.0); // Slide from bottom
                const end = Offset.zero;
                const curve = Curves.easeInOut;
                final tween = Tween(
                  begin: begin,
                  end: end,
                ).chain(CurveTween(curve: curve));
                return SlideTransition(
                  position: animation.drive(tween),
                  child: child,
                );
              },
            ),
      ),
      GoRoute(
        path: '/login-cashier',
        name: 'login-cashier',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              child: const ModernLoginCashierScreen(),
              transitionsBuilder: (
                context,
                animation,
                secondaryAnimation,
                child,
              ) {
                const begin = Offset(1.0, 0.0);
                const end = Offset.zero;
                const curve = Curves.ease;
                final tween = Tween(
                  begin: begin,
                  end: end,
                ).chain(CurveTween(curve: curve));
                return SlideTransition(
                  position: animation.drive(tween),
                  child: child,
                );
              },
            ),
      ),
      GoRoute(
        name: 'main',
        path: '/main',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              child: const MainScreen(),
              transitionsBuilder: (
                context,
                animation,
                secondaryAnimation,
                child,
              ) {
                const begin = Offset(1.0, 0.0);
                const end = Offset.zero;
                const curve = Curves.ease;
                final tween = Tween(
                  begin: begin,
                  end: end,
                ).chain(CurveTween(curve: curve));
                return SlideTransition(
                  position: animation.drive(tween),
                  child: child,
                );
              },
            ),
      ),
      GoRoute(
        name: 'settings',
        path: '/settings',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              child: const SettingScreen(),
              transitionsBuilder: (
                context,
                animation,
                secondaryAnimation,
                child,
              ) {
                const begin = Offset(1.0, 0.0);
                const end = Offset.zero;
                const curve = Curves.ease;
                final tween = Tween(
                  begin: begin,
                  end: end,
                ).chain(CurveTween(curve: curve));
                return SlideTransition(
                  position: animation.drive(tween),
                  child: child,
                );
              },
            ),
        routes: [
          // ScanPrinterScreen,
          GoRoute(
            path: 'scan-printer',
            name: 'scan-printer',
            pageBuilder:
                (context, state) => CustomTransitionPage(
                  arguments: state.extra,
                  child: const ScanPrinterScreen(),
                  transitionsBuilder: (
                    context,
                    animation,
                    secondaryAnimation,
                    child,
                  ) {
                    const begin = Offset(1.0, 0.0);
                    const end = Offset.zero;
                    const curve = Curves.ease;
                    final tween = Tween(
                      begin: begin,
                      end: end,
                    ).chain(CurveTween(curve: curve));
                    return SlideTransition(
                      position: animation.drive(tween),
                      child: child,
                    );
                  },
                ),
          ),
          GoRoute(
            path: 'scan-network-printer',
            name: 'scan-network-printer',
            pageBuilder:
                (context, state) => CustomTransitionPage(
                  arguments: state.extra,
                  child: const ScanNetworkPrinterScreen(),
                  transitionsBuilder: (
                    context,
                    animation,
                    secondaryAnimation,
                    child,
                  ) {
                    const begin = Offset(1.0, 0.0);
                    const end = Offset.zero;
                    const curve = Curves.ease;
                    final tween = Tween(
                      begin: begin,
                      end: end,
                    ).chain(CurveTween(curve: curve));
                    return SlideTransition(
                      position: animation.drive(tween),
                      child: child,
                    );
                  },
                ),
          ),
          GoRoute(
            path: 'detail-printer',
            name: 'detail-printer',
            pageBuilder:
                (context, state) => CustomTransitionPage(
                  arguments: state.extra as BluetoothPrinterModel,
                  child: const DetailPrinterScreen(),
                  transitionsBuilder: (
                    context,
                    animation,
                    secondaryAnimation,
                    child,
                  ) {
                    const begin = Offset(1.0, 0.0);
                    const end = Offset.zero;
                    const curve = Curves.ease;
                    final tween = Tween(
                      begin: begin,
                      end: end,
                    ).chain(CurveTween(curve: curve));
                    return SlideTransition(
                      position: animation.drive(tween),
                      child: child,
                    );
                  },
                ),
          ),
        ],
      ),
      GoRoute(
        name: 'payment-method',
        path: '/payment-method',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              arguments: state.extra,
              child: const PaymentMethodScreen(),
              transitionsBuilder: (
                context,
                animation,
                secondaryAnimation,
                child,
              ) {
                const begin = Offset(1.0, 0.0);
                const end = Offset.zero;
                const curve = Curves.ease;
                final tween = Tween(
                  begin: begin,
                  end: end,
                ).chain(CurveTween(curve: curve));
                return SlideTransition(
                  position: animation.drive(tween),
                  child: child,
                );
              },
            ),
      ),
      GoRoute(
        path: '/payment-success',
        name: 'payment-success',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              arguments: state.extra,
              child: const PaymentSuccessScreen(),
              transitionsBuilder: (
                context,
                animation,
                secondaryAnimation,
                child,
              ) {
                const begin = Offset(1.0, 0.0);
                const end = Offset.zero;
                const curve = Curves.ease;
                final tween = Tween(
                  begin: begin,
                  end: end,
                ).chain(CurveTween(curve: curve));
                return SlideTransition(
                  position: animation.drive(tween),
                  child: child,
                );
              },
            ),
      ),
      GoRoute(
        path: '/reservation-menu',
        name: 'reservation-menu',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              arguments: state.extra,
              child: const ReservationMenuScreen(),
              transitionsBuilder: (
                context,
                animation,
                secondaryAnimation,
                child,
              ) {
                const begin = Offset(1.0, 0.0);
                const end = Offset.zero;
                const curve = Curves.ease;
                final tween = Tween(
                  begin: begin,
                  end: end,
                ).chain(CurveTween(curve: curve));
                return SlideTransition(
                  position: animation.drive(tween),
                  child: child,
                );
              },
            ),
      ),
    ],
    redirect: (context, state) {
      final authStatus = authState.value;

      debugPrint('Redirect triggered for: ${state.uri.toString()}');

      // if (state.matchedLocation.startsWith('/settings')) {
      //   return null;
      // }
      if (![
        '/',
        '/login',
        '/data-sync',
        '/login-cashier',
        '/main',
      ].contains(state.matchedLocation)) {
        return null;
      }

      print('authStatus di go router 1: $authStatus');

      print('state di go router: ${authStatus == null}');

      if (authStatus == null) return null;
      print('authStatus di go router 2: $authStatus');

      final isGoingToAuth = state.matchedLocation == '/login';
      final isGoingToDataSync = state.matchedLocation == '/data-sync';
      final isGoingToPin = state.matchedLocation == '/login-cashier';
      final isGoingToMain = state.matchedLocation == '/main';

      print(
        'isGoingToAuth: $isGoingToAuth ,'
        'isGoingToDataSync: $isGoingToDataSync,'
        'isGoingToPin: $isGoingToPin',
      );
      // Redirect rules
      if (authStatus == AuthStatus.unauthenticated) {
        return isGoingToAuth ? null : '/login';
      } else if (authStatus == AuthStatus.needDataSync) {
        return isGoingToDataSync ? null : '/data-sync';
      } else if (authStatus == AuthStatus.needPin) {
        return isGoingToPin ? null : '/login-cashier';
      } else if (authStatus == AuthStatus.authenticated) {
        if (!isGoingToMain) {
          print('pertama disini');
          return '/main';
        }
      }

      print('authStatus di go router 3: $authStatus');
      final socket = ref.read(socketServiceProvider);
      print('sedang connect socket...');
      if (cashierId.toString() != '') {
        socket.connect(cashierId.toString());
      }
      print('connect socket di go router: ${socket.socket.connected}');

      return state.uri.toString(); // Allow navigation
    },
  );
});
