import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/screens/auth/login_cashier_screen.dart';
import 'package:kasirbaraja/screens/data_sync_screen.dart';
import 'package:kasirbaraja/screens/main_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/screens/orders/edit_order/edit_order_screen.dart';
import 'package:kasirbaraja/screens/payments/payment_success_screen.dart';
import 'package:kasirbaraja/screens/payments/payment_type_screen.dart';
import 'package:kasirbaraja/screens/reports/sales_report_screen.dart';
import 'package:kasirbaraja/screens/reservation/reservation_menu_screen.dart';
import 'package:kasirbaraja/screens/settings/setting_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/detail_printer_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/scan_network_printer_screen.dart';
import 'package:kasirbaraja/screens/settings/widgets/scan_printer_screen.dart';
import 'package:kasirbaraja/screens/orders/online_orders/widgets/payment_process_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/boarding/splash_screen.dart';
import 'package:flutter/material.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(tryAuthProvider);
  // final authCashierState = ref.watch(authCashierProvider);
  // final cashierId = HiveService.getCashier();

  return GoRouter(
    // Agar router refresh saat auth status berubah
    // refreshListenable: GoRouterRefreshStream(ref.watch(tryAuthProvider.stream)),
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
        name: 'payment-process',
        path: '/payment-process',
        pageBuilder: (context, state) {
          // Ambil PaymentModel dari state.extra
          // extra: {'payment': payment, 'order': orders},
          final Map<String, dynamic> extras =
              state.extra as Map<String, dynamic>;

          final PaymentModel payment = extras['payment'] as PaymentModel;
          final OrderDetailModel orders = extras['order'] as OrderDetailModel;

          return CustomTransitionPage(
            arguments: state.extra,
            child: PaymentProcessScreen(
              payment: payment,
              order: orders,
            ), // Pass payment parameter
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
          );
        },
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
      //sales report page,
      GoRoute(
        path: '/sales-report',
        name: 'sales-report',
        pageBuilder:
            (context, state) => CustomTransitionPage(
              arguments: state.extra,
              child: const SalesReportScreen(),
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
      //edit orderitem,
      GoRoute(
        path: '/:id/edit-order-item',
        name: 'edit-order-item',
        pageBuilder: (context, state) {
          final extra = state.extra;
          final orderMongoId = state.pathParameters['id']!;

          return CustomTransitionPage(
            arguments: state.extra,
            // child: const EditOrderItemScreen(orderMongoId: state.pathParameters['id']!),
            child: EditOrderScreen(orderDetail: extra as OrderDetailModel),
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
          );
        },
      ),
    ],
    redirect: (context, state) {
      // Saat status masih loading, biarkan di splash
      if (authState.isLoading) return null;

      final s = authState.value;
      if (s == null) return null;

      const guardable = {
        '/',
        '/login',
        '/data-sync',
        '/login-cashier',
        '/main',
      };
      if (!guardable.contains(state.matchedLocation)) return null;

      final isLogin = state.matchedLocation == '/login';
      final isSync = state.matchedLocation == '/data-sync';
      final isPin = state.matchedLocation == '/login-cashier';
      final isMain = state.matchedLocation == '/main';

      switch (s) {
        case AuthStatus.unauthenticated:
          return isLogin ? null : '/login';
        case AuthStatus.needDataSync:
          return isSync ? null : '/data-sync';
        case AuthStatus.needPin:
          return isPin ? null : '/login-cashier';
        case AuthStatus.authenticated:
          return isMain ? null : '/main';
      }
    },
  );
});
