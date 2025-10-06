import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';

class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    print(
      'progres telah melewati splash screen ini menandakan aplikasi telah dimulai dari splash screen',
    );
    ref.listen<AsyncValue<AuthStatus>>(tryAuthProvider, (prev, next) {
      next.when(
        data: (s) {
          switch (s) {
            case AuthStatus.unauthenticated:
              context.go('/login');
              break;
            case AuthStatus.needDataSync:
              context.go('/data-sync');
              break;
            case AuthStatus.needPin:
              context.go('/login-cashier');
              break;
            case AuthStatus.authenticated:
              context.go('/main');
              break;
          }
        },
        error: (e, st) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error: $e')));
        },
        loading: () {},
      );
    });

    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
