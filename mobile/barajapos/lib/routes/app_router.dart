import 'package:barajapos/providers/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/boarding/splash_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authNotifier = ref.watch(authProvider.notifier);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isAuthenticated = authNotifier.isAuthenticated;

      if (!isAuthenticated && state.uri.toString() != '/login') {
        print("malah kesini gagal lagi");
        return '/login'; // 🔹 User belum login → arahkan ke Login
      }

      if (isAuthenticated && state.uri.toString() == '/login') {
        return '/home'; // 🔹 User sudah login → arahkan ke Home
      }
      print("malah gagal");
      return null; // Tetap di halaman yang diminta
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => LoginScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
    ],
  );
});
