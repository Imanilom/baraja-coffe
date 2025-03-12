import 'package:barajapos/models/user_model.dart';
import 'package:flutter/material.dart';
import 'package:barajapos/providers/auth_provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<AsyncValue<UserModel?>>(authProvider, (_, state) {
      if (state.value != null) {
        context.go('/home'); // Ke Home jika sudah login
      } else {
        context.go('/login'); // Ke Login jika belum login
      }
    });

    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
