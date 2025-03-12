import 'package:barajapos/providers/menu_item_provider.dart';
import 'package:barajapos/providers/order_provider.dart';
import 'package:barajapos/utils/format_rupiah.dart';
import 'package:barajapos/widgets/dialogs/order_option_dialogs.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  await Hive.initFlutter();

  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]).then((_) {
    runApp(const ProviderScope(child: MyApp()));
  });
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent),
        useMaterial3: true,
      ),
      debugShowCheckedModeBanner: false,
      home: const MyHomePage(),
    );
  }
}

final counterProvider = StateProvider<int>((ref) => 0);

class MyHomePage extends ConsumerWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final menu = ref.watch(menuItemProvider);
    final order = ref.watch(orderProvider);
    final totalPrices = ref.watch(orderProvider.notifier).totalPrice;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Pesan Menu'),
      ),
      body: Row(
        children: [
          // Daftar Menu (Sebelah Kiri)
          Expanded(
            flex: 2,
            child: menu.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Error: $error')),
              data: (menuItems) {
                return ListView.builder(
                  itemCount: menuItems.length,
                  itemBuilder: (context, index) {
                    final menuItem = menuItems[index];
                    return ListTile(
                      title: Text(menuItem.name),
                      subtitle: Text('Price: ${formatRupiah(menuItem.price)}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.add),
                        onPressed: () {
                          // Tampilkan dialog pemilihan topping dan addon
                          showDialog(
                            context: context,
                            builder: (context) {
                              return OrderOptionDialogs(
                                menuItem: menuItem,
                                onAddToOrder: (orderItem) {
                                  // Tambahkan ke daftar pesanan
                                  ref
                                      .read(orderProvider.notifier)
                                      .addToOrder(orderItem);
                                },
                              );
                            },
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),

          // Daftar Pesanan (Sebelah Kanan)
          Expanded(
            flex: 1,
            child: Column(
              children: [
                const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Text(
                    'Daftar Pesanan',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: order.length,
                    itemBuilder: (context, index) {
                      final orderItem = order[index];
                      return ListTile(
                        title: Text(orderItem.menuItem.name),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (orderItem.selectedToppings.isNotEmpty)
                              Text(
                                  'Topping: ${orderItem.selectedToppings.map((t) => t.name).join(', ')}'),
                            if (orderItem.selectedAddons.isNotEmpty)
                              Text(
                                  'Addon: ${orderItem.selectedAddons.map((a) => a.label).join(', ')}'),
                            Text(
                                'Sub total: ${formatRupiah(orderItem.subTotalPrice)}'),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.remove),
                          onPressed: () {
                            ref
                                .read(orderProvider.notifier)
                                .removeFromOrder(orderItem);
                          },
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    'Total: ${formatRupiah(totalPrices)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: ElevatedButton(
                    onPressed: () {
                      ref.read(orderProvider.notifier).clearOrder();
                    },
                    child: const Text('Clear Order'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
