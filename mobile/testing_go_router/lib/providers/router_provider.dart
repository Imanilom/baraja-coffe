// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:go_router/go_router.dart';
// import 'package:kasirbaraja/screens/main_screen.dart';
// import 'package:kasirbaraja/screens/settings/setting_screen.dart';

// final routerProvider = Provider<GoRouter>((ref) {
//   const initialLocation = '/';
//   return GoRouter(
//     initialLocation: initialLocation,
//     routes: [
//       GoRoute(path: '/', builder: (context, state) => const MainScreen()),
//       GoRoute(
//         path: '/settings',
//         builder: (context, state) => const SettingScreen(),
//       ),
//     ],
//   );
// });

import 'package:flutter/widgets.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/go_router_refresh.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';
import 'package:kasirbaraja/screens/auth/login_cashier_screen.dart';
import 'package:kasirbaraja/screens/auth/pin_input_screen.dart';
import 'package:kasirbaraja/screens/main_screen.dart';
// import 'package:kasirbaraja/widgets/payment/success_payment.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/screens/payments/payment_method_screen.dart';
import 'package:kasirbaraja/screens/payments/payment_success_screen.dart';
import 'package:kasirbaraja/screens/payments/payment_type_screen.dart';
import 'package:kasirbaraja/screens/reservation/reservation_menu_screen.dart';
import 'package:kasirbaraja/screens/settings/setting_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/detail_printer_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/printer_connection.dart';
import 'package:kasirbaraja/screens/settings/widgets/scan_network_printer_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/scan_printer_screen.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import '../screens/auth/login_screen.dart';
import '../screens/boarding/splash_screen.dart';
import 'package:flutter/material.dart';

// final routerProvider = Provider<GoRouter>((ref) {
//   final authState = ref.watch(authProvider);
//   final authNotifier = ref.watch(authProvider.notifier);
//   final authCashierState = ref.watch(authCashierProvider);
//   // final authCashierNotifier = ref.watch(authCashierProvider.notifier);
//   final isAuthenticatedManager = authState.value != null;
//   final isAuthenticatedCashier = authCashierState.asData?.value != null;

//   return GoRouter(
//     initialLocation: '/',
//     refreshListenable: GoRouterRefreshStream(authNotifier.stream),
//     redirect: (context, state) {
//       // return '/main';
//       // return null;

//       if (authState.isLoading) return '/';
//       // return isAuthenticated ? '/main' : '/main';
//       if (isAuthenticatedCashier) return '/main';
//       if (isAuthenticatedManager) return '/login-cashier';

//       return '/login';
//     },
//     routes: [
//       GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
//       GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
//       GoRoute(
//         path: '/login-cashier',
//         builder: (context, state) => const LoginCashierScreen(),
//       ),
//       GoRoute(
//         path: '/pin-input',
//         builder: (context, state) => const PinInputScreen(),
//       ),
//       GoRoute(path: '/main', builder: (context, state) => const MainScreen()),
//       // GoRoute(
//       //   path: '/payment-success',
//       //   builder: (context, state) => const SuccessPayment(),
//       // ),
//       GoRoute(
//         path: '/settings',
//         builder: (context, state) => const SettingScreen(),
//       ),
//     ],
//   );
// });

// final routerProvider = Provider<GoRouter>((ref) {
//   final authState = ref.watch(authProvider);
//   final authNotifier = ref.read(authProvider.notifier);
//   final authCashierState = ref.watch(authCashierProvider);

//   return GoRouter(
//     initialLocation: '/',
//     // debugLogDiagnostics: true,
//     refreshListenable: GoRouterRefreshStream(authNotifier.stream),
//     redirect: (context, GoRouterState state) async {
//       final isSplash = state.uri.toString() == '/';
//       if (isSplash) return null;

//       final isAuthenticatedManager = authState.value != null;
//       final isAuthenticatedCashier = authCashierState.asData?.value != null;

//       // Daftar route yang boleh diakses tanpa auth
//       final publicRoutes = ['/login', '/login-cashier', '/pin-input'];

//       // Jika sedang menuju public route, biarkan
//       if (publicRoutes.contains(state.uri.toString())) {
//         return null;
//       }

//       // Jika belum login dan bukan di public route
//       if (!isAuthenticatedManager && !isAuthenticatedCashier) {
//         return '/login';
//       }

//       // Jika manager sudah login tapi mencoba akses cashier login
//       if (isAuthenticatedManager && state.uri.toString() == '/login-cashier') {
//         return '/main';
//       }

//       // Jika cashier sudah login tapi mencoba akses manager login
//       if (isAuthenticatedCashier && state.uri.toString() == '/login') {
//         return '/main';
//       }

//       // Default: biarkan navigasi berlanjut
//       return null;
//     },
//     routes: [
//       GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
//       GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
//       GoRoute(
//         path: '/login-cashier',
//         builder: (context, state) => const LoginCashierScreen(),
//       ),
//       GoRoute(
//         path: '/pin-input',
//         builder: (context, state) => const PinInputScreen(),
//       ),
//       GoRoute(path: '/main', builder: (context, state) => const MainScreen()),
//       // GoRoute(
//       //   path: '/payment-success',
//       //   builder: (context, state) => const SuccessPayment(),
//       // ),
//       GoRoute(
//         path: '/settings',
//         builder: (context, state) => const SettingScreen(),
//       ),
//     ],
//   );
// });
// final routerProvider = Provider<GoRouter>((ref) {
//   final authNotifier = ref.read(authProvider.notifier);
//   final authState = ref.watch(authProvider);
//   final authCashierState = ref.watch(authCashierProvider);

//   return GoRouter(
//     debugLogDiagnostics: true,
//     initialLocation: '/',
//     refreshListenable: GoRouterRefreshStream(authNotifier.stream),
//     redirect: (context, GoRouterState state) {
//       // Debugging helper
//       print('Redirect triggered for: ${state.uri.toString()}');

//       // Skip redirect for splash screen
//       if (state.uri.toString() == '/') return null;

//       final isAuthenticatedManager = authState.value != null;
//       final isAuthenticatedCashier = authCashierState.asData?.value != null;

//       // Public routes that don't require auth
//       final publicRoutes = ['/login', '/login-cashier', '/pin-input'];
//       if (publicRoutes.contains(state.uri.toString())) return null;

//       // Auth handling
//       if (!isAuthenticatedManager && !isAuthenticatedCashier) {
//         return '/login';
//       }

//       // Role-based redirection
//       if (isAuthenticatedManager && state.uri.toString() == '/login-cashier') {
//         return '/main';
//       }
//       if (isAuthenticatedCashier && state.uri.toString() == '/login') {
//         return '/main';
//       }

//       return null;
//     },
//     routes: [
//       // Splash Screen
//       GoRoute(path: '/', builder: (context, state) => const SplashScreen()),

//       // Auth Routes
//       GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
//       GoRoute(
//         path: '/login-cashier',
//         builder: (context, state) => const LoginCashierScreen(),
//       ),
//       GoRoute(
//         path: '/pin-input',
//         builder: (context, state) => const PinInputScreen(),
//       ),

//       // Main App Structure with Stateful Shell
//     ],
//   );
// });

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(tryAuthProvider);
  final authCashierState = ref.watch(authCashierProvider);
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
      final isGoingToPin = state.matchedLocation == '/login-cashier';
      final isGoingToMain = state.matchedLocation == '/main';

      print(
        'isGoingToAuth: $isGoingToAuth ,'
        'isGoingToPin: $isGoingToPin',
      );
      // Redirect rules
      if (authStatus == AuthStatus.unauthenticated) {
        return isGoingToAuth ? null : '/login';
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
