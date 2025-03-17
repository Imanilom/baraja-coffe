// import 'package:barajapos/routes/app_router.dart';
import 'package:barajapos/screens/home/history_screen.dart';
import 'package:barajapos/screens/home/saved_order_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class Layout extends ConsumerWidget {
  const Layout({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget currentScreen = const HistoryScreen();

    return MaterialApp(
      home: Row(children: [
        Expanded(
          flex: 2,
          child: Scaffold(
            appBar: AppBar(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Theme.of(context).colorScheme.onPrimary,
              title: const Text('BarajaPOS'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.history),
                  //
                  onPressed: () => currentScreen = const HistoryScreen(),
                ),
                IconButton(
                  icon: const Icon(Icons.save),
                  onPressed: () => currentScreen = const SavedOrderScreen(),
                ),
              ],
            ),
            body: currentScreen,
          ),
        ),
        Expanded(
          flex: 1,
          child: Scaffold(
            appBar: AppBar(
              backgroundColor: Theme.of(context).colorScheme.inversePrimary,
              title: Text(
                'Detail pesanan',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
            body: const SavedOrderScreen(),
          ),
        ),
      ]),
    );
  }
}
