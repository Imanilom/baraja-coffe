import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/routes/go_router_refresh.dart';
import 'package:barajapos/screens/main_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/auth/login_screen.dart';
import '../screens/boarding/splash_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final authNotifier = ref.watch(authProvider.notifier);
  final isAuthenticated = authState.value != null;

  return GoRouter(
    initialLocation: '/',
    refreshListenable: GoRouterRefreshStream(authNotifier.stream),
    redirect: (context, state) {
      if (authState.isLoading) return '/';
      // return isAuthenticated ? '/main' : '/main';
      return isAuthenticated ? '/main' : '/login';
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/login-cashier',
        // builder: (context, state) => const LoginCashierScreen(),
        redirect: (context, state) => isAuthenticated ? '/main' : null,
      ),
      GoRoute(path: '/main', builder: (context, state) => const MainScreen()),
    ],
  );
});
