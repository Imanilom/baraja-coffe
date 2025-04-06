import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/routes/go_router_refresh.dart';
import 'package:barajapos/screens/auth/login_cashier_screen.dart';
import 'package:barajapos/screens/auth/pin_input_screen.dart';
import 'package:barajapos/screens/main_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/auth/login_screen.dart';
import '../screens/boarding/splash_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final authNotifier = ref.watch(authProvider.notifier);
  final authCashierState = ref.watch(authCashierProvider);
  // final authCashierNotifier = ref.watch(authCashierProvider.notifier);
  final isAuthenticatedManager = authState.value != null;
  final isAuthenticatedCashier = authCashierState.asData?.value != null;

  return GoRouter(
    initialLocation: '/',
    refreshListenable: GoRouterRefreshStream(authNotifier.stream),
    redirect: (context, state) {
      if (authState.isLoading) return '/';
      // return isAuthenticated ? '/main' : '/main';
      if (isAuthenticatedCashier) return '/main';
      if (isAuthenticatedManager) return '/login-cashier';

      return '/login';
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/login-cashier',
        builder: (context, state) => const LoginCashierScreen(),
      ),
      GoRoute(
        path: '/pin-input',
        builder: (context, state) => const PinInputScreen(),
      ),
      GoRoute(path: '/main', builder: (context, state) => const MainScreen()),
    ],
  );
});
