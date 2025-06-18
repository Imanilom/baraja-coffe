import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/screens/orders/order_screen.dart';

class MainScreen extends ConsumerWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentPageIndex = ref.watch(currentPageIndexProvider);
    final currentWidgetIndex = ref.watch(currentWidgetIndexProvider);
    //order onlineindicator provider
    final orderOnlineIndicator = ref.watch(orderOnlineIndicatorProvider);

    //kalo true tampilkan snackbar
    if (orderOnlineIndicator) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Ada Orderan Masuk!')));
    }

    return Scaffold(
      resizeToAvoidBottomInset: false,
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: <Widget>[
            const DrawerHeader(
              decoration: BoxDecoration(color: Colors.green),
              child: Text(
                'Baraja Amphitheater',
                style: TextStyle(color: Colors.white),
              ),
            ),
            ListTile(
              //leading icon new order
              leading: const Icon(Icons.home),
              title: const Text('New Order'),
              onTap: () {
                // Handle item 1 tap
                currentPageIndex == 0
                    ? null
                    : ref.read(currentPageIndexProvider.notifier).setIndex(0);
                currentWidgetIndex == 0
                    ? null
                    : ref.read(currentWidgetIndexProvider.notifier).setIndex(0);

                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.list),
              title: const Text('Online Order'),
              onTap: () {
                // Handle item 1 tap
                currentPageIndex == 0
                    ? null
                    : ref.read(currentPageIndexProvider.notifier).setIndex(0);
                currentWidgetIndex == 1
                    ? null
                    : ref.read(currentWidgetIndexProvider.notifier).setIndex(1);

                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('History'),
              onTap: () {
                // Handle item 1 tap
                currentPageIndex == 0
                    ? null
                    : ref.read(currentPageIndexProvider.notifier).setIndex(0);
                currentWidgetIndex == 2
                    ? null
                    : ref.read(currentWidgetIndexProvider.notifier).setIndex(2);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.receipt_long),
              title: const Text('Rekap Kasir'),
              onTap: () {
                // Handle item 1 tap
                currentPageIndex == 1
                    ? null
                    : ref.read(currentPageIndexProvider.notifier).setIndex(1);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Settings'),
              onTap: () {
                context.pushNamed('settings');
                print('tombol settings sudah ditekan');
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Ganti Operator'),
              onTap: () {
                // Handle item 2 tap
                ref.read(tryAuthProvider.notifier).logoutCashier();
                // context.goNamed('login-cashier');
              },
            ),
          ],
        ),
      ),
      appBar: AppBar(
        //warna tetap ketika ada scroll
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        leading: Builder(
          builder: (context) {
            return IconButton(
              //untuk menampilkan drawer
              icon: const Icon(Icons.menu),
              onPressed: () {
                Scaffold.of(context).openDrawer();
                // Scaffold.of(context).openEndDrawer();
              },
            );
          },
        ),

        title: const Text('Kasir Baraja'),
        centerTitle: true,

        actions: [
          // Icon dengan label "Keranjang"
          TextButton.icon(
            icon: const Icon(Icons.shopping_cart),
            label: const Text('Tersimpan'),
            onPressed: () {
              currentPageIndex == 0
                  ? null
                  : ref.read(currentPageIndexProvider.notifier).setIndex(0);
              currentWidgetIndex == 3
                  ? null
                  : ref.read(currentWidgetIndexProvider.notifier).setIndex(3);
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: currentPageIndex,
        children: const <Widget>[
          OrderScreen(),
          Center(child: Text('Rekap Kasir')),
        ],
      ),
    );
  }
}
