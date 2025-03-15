import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/routes/go_router_refresh.dart';
import 'package:barajapos/screens/home/history_screen.dart';
import 'package:barajapos/screens/home/online_order_screen.dart';
import 'package:barajapos/screens/home/saved_order_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/boarding/splash_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final authNotifier = ref.watch(authProvider.notifier);
  final isAuthenticated = authState.value != null;

  return GoRouter(
    initialLocation: '/',
    refreshListenable: GoRouterRefreshStream(authNotifier.stream),
    redirect: (context, state) {
      // saat melihat kodisi isAuthenticated, kita bisa mengarahkan pengguna ke halaman '/'
      if (authState.value == null) {
        return '/';
      }
      return isAuthenticated ? '/home' : '/login';
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
        redirect: (context, state) {
          final authState = ref.read(authProvider);
          if (authState.value == null) {
            return '/login';
          }
          return null;
        },
      ),
      GoRoute(
        path: '/online-order',
        builder: (context, state) => const OnlineOrderScreen(),
      ),
      GoRoute(
        path: '/history',
        builder: (context, state) => const HistoryScreen(),
      ),
      GoRoute(
        path: '/saved-order',
        builder: (context, state) => const SavedOrderScreen(),
      ),
    ],
  );
});
