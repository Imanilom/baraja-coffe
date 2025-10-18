import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/enums/order_status.dart';
import 'package:kasirbaraja/models/cashier.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/screens/orders/order_screen.dart';
import 'package:kasirbaraja/screens/orders/order_histories/order_history.dart';
import 'package:kasirbaraja/screens/orders/online_orders/online_order.dart';
import 'package:kasirbaraja/screens/orders/pending_orders/pending_order_screen.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});
  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final box = Hive.box('userBox');
      final cashier = box.get('cashier') as CashierModel?;
      if (cashier?.id != null && cashier!.id!.isNotEmpty) {
        ref.read(socketServiceProvider).connect(cashier.id!);
      }
    });
  }

  int _getOnlineOrderCount(WidgetRef ref) {
    final onlineOrders = ref.watch(onlineOrderProvider).valueOrNull ?? [];
    return onlineOrders
        .where((order) => order.status == OrderStatus.pending)
        .length;

    // Contoh static untuk demo
    // return 3; // Ganti dengan logika actual
  }

  Widget _buildBadge({
    required int count,
    double size = 16,
    Color backgroundColor = Colors.red,
    Color textColor = Colors.white,
  }) {
    if (count <= 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(size / 2),
        border: Border.all(color: Colors.white, width: 1),
      ),
      constraints: BoxConstraints(minWidth: size, minHeight: size),
      child: Text(
        count > 99 ? '99+' : count.toString(),
        style: TextStyle(
          color: textColor,
          fontSize: size * 0.6,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentPageIndex = ref.watch(currentPageIndexProvider);
    final currentWidgetIndex = ref.watch(currentWidgetIndexProvider);
    //order onlineindicator provider
    final orderOnlineIndicator = ref.watch(orderOnlineIndicatorProvider);

    final box = Hive.box('userBox');
    final cashier = box.get('cashier') as CashierModel;

    if (orderOnlineIndicator) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Ada Orderan Masuk!')));
    }

    return Scaffold(
      resizeToAvoidBottomInset: false,
      drawer: Drawer(
        child: Column(
          children: <Widget>[
            // Enhanced DrawerHeader with Profile
            Container(
              height: 180,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF4CAF50), Color(0xFF2E7D32)],
                ),
              ),
              padding: const EdgeInsets.fromLTRB(16, 40, 16, 16),
              child: Stack(
                children: [
                  // Update Button
                  Positioned(
                    top: 0,
                    right: 0,
                    child: TextButton.icon(
                      onPressed: () {
                        _showUpdateDataDialog(context, ref);
                      },
                      icon: const Icon(
                        Icons.refresh,
                        color: Colors.white,
                        size: 20,
                      ),
                      label: const Text(
                        'Update Data',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                      // Removed 'padding' and 'constraints' as they are not valid for TextButton.icon,
                    ),
                  ),
                  // Profile Content
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Profile Avatar
                      CircleAvatar(
                        radius: 25,
                        backgroundColor: Colors.white,
                        child: Icon(
                          Icons.person,
                          size: 28,
                          color: Color(0xFF4CAF50),
                        ),
                      ),
                      SizedBox(height: 8),
                      // Cashier Name
                      Text(
                        '${cashier.username}', // Ganti dengan data kasir actual
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 2),
                      // Store Name
                      Text(
                        // '${user.outletId}',
                        'Baraja Amphitheater',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 4),
                      // Status Indicator
                      Row(
                        children: [
                          Icon(
                            Icons.circle,
                            size: 6,
                            color: Colors.greenAccent,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Online',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Menu Items
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildDrawerItem(
                    context: context,
                    ref: ref,
                    icon: Icons.add_shopping_cart,
                    title: 'Order',
                    isSelected:
                        currentPageIndex == 0 && currentWidgetIndex == 0,
                    onTap: () {
                      if (currentPageIndex != 0) {
                        ref.read(currentPageIndexProvider.notifier).setIndex(0);
                      }
                      if (currentWidgetIndex != 0) {
                        ref
                            .read(currentWidgetIndexProvider.notifier)
                            .setIndex(0);
                      }
                      Navigator.pop(context);
                    },
                  ),
                  _buildDrawerItem(
                    context: context,
                    ref: ref,
                    icon: Icons.pending_actions,
                    title: 'Pending Order',
                    isSelected: currentPageIndex == 1,
                    onTap: () {
                      if (currentPageIndex != 1) {
                        ref.read(currentPageIndexProvider.notifier).setIndex(1);
                      }
                      Navigator.pop(context);
                    },
                    // count: _getOnlineOrderCount(ref),
                  ),
                  _buildDrawerItem(
                    context: context,
                    ref: ref,
                    icon: Icons.online_prediction,
                    title: 'Online Order',
                    isSelected: currentPageIndex == 3,
                    onTap: () {
                      if (currentPageIndex != 3) {
                        ref.read(currentPageIndexProvider.notifier).setIndex(3);
                      }
                      Navigator.pop(context);
                    },
                    count: _getOnlineOrderCount(ref),
                  ),
                  // _buildDrawerItem(
                  //   context: context,
                  //   ref: ref,
                  //   icon: Icons.event_seat,
                  //   title: 'Reserve Order',
                  //   isSelected: currentPageIndex == 1,
                  //   onTap: () {
                  //     if (currentPageIndex != 1) {
                  //       ref.read(currentPageIndexProvider.notifier).setIndex(1);
                  //     }
                  //     Navigator.pop(context);
                  //   },
                  // ),
                  _buildDrawerItem(
                    context: context,
                    ref: ref,
                    icon: Icons.history,
                    title: 'History',
                    isSelected: currentPageIndex == 2,
                    onTap: () {
                      if (currentPageIndex != 2) {
                        ref.read(currentPageIndexProvider.notifier).setIndex(2);
                      }
                      Navigator.pop(context);
                    },
                  ),
                  const Divider(height: 1),
                  _buildDrawerItem(
                    context: context,
                    ref: ref,
                    icon: Icons.receipt_long,
                    title: 'Rekap Kasir',
                    // isSelected: currentPageIndex == 2,
                    onTap: () {
                      // if (currentPageIndex != 2) {
                      //   ref.read(currentPageIndexProvider.notifier).setIndex(2);
                      // }
                      // Navigator.pop(context);
                      context.pushNamed('sales-report');
                    },
                  ),
                ],
              ),
            ),

            // Bottom Section
            const Divider(height: 1),
            _buildDrawerItem(
              context: context,
              ref: ref,
              icon: Icons.settings,
              title: 'Settings',
              onTap: () {
                context.pushNamed('settings');
                print('tombol settings sudah ditekan');
              },
            ),
            _buildDrawerItem(
              context: context,
              ref: ref,
              icon: Icons.logout,
              title: 'Ganti Operator',
              textColor: Colors.red[700],
              onTap: () {
                _showLogoutDialog(context, ref);
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
      appBar: AppBar(
        //warna tetap ketika ada scroll
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 1,
        leading: Stack(
          children: [
            Builder(
              builder: (context) {
                return IconButton(
                  //untuk menampilkan drawer
                  icon: const Icon(Icons.menu),
                  onPressed: () {
                    Scaffold.of(context).openDrawer();
                  },
                );
              },
            ),
            // if (_getOnlineOrderCount(ref) > 0)
            //   Positioned(
            //     right: 12,
            //     top: 8,
            //     child: Container(
            //       padding: const EdgeInsets.all(2),
            //       decoration: BoxDecoration(
            //         color: Colors.red,
            //         borderRadius: BorderRadius.circular(10),
            //         border: Border.all(color: Colors.white, width: 2),
            //       ),
            //       constraints: const BoxConstraints(
            //         minWidth: 16,
            //         minHeight: 16,
            //       ),
            //       child: Text(
            //         _getOnlineOrderCount(ref) > 99
            //             ? '99+'
            //             : _getOnlineOrderCount(ref).toString(),
            //         style: const TextStyle(
            //           color: Colors.white,
            //           fontSize: 10,
            //           fontWeight: FontWeight.bold,
            //         ),
            //         textAlign: TextAlign.center,
            //       ),
            //     ),
            //   ),
          ],
        ),

        title: const Text(
          'Kasir Baraja',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,

        actions: [
          // Icon dengan label "Keranjang"
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: TextButton.icon(
              icon: const Icon(Icons.shopping_cart_outlined, size: 20),
              label: const Text('Tersimpan', style: TextStyle(fontSize: 12)),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF4CAF50),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
              onPressed: () {
                if (currentPageIndex != 0) {
                  ref.read(currentPageIndexProvider.notifier).setIndex(0);
                }
                if (currentWidgetIndex != 1) {
                  ref.read(currentWidgetIndexProvider.notifier).setIndex(1);
                }
              },
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: currentPageIndex,
        children: const <Widget>[
          OrderScreen(),
          PendingOrderScreen(),
          OrderHistoryScreen(),
          OnlineOrderScreen(),
          // SalesReportScreen(),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required BuildContext context,
    required WidgetRef ref,
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isSelected = false,
    Color? textColor,
    int count = 0,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: isSelected ? const Color(0xFF4CAF50).withOpacity(0.1) : null,
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Icon(
          icon,
          color:
              isSelected
                  ? const Color(0xFF4CAF50)
                  : textColor ?? Colors.grey[700],
          size: 22,
        ),
        trailing: _buildBadge(count: count),
        title: Text(
          title,
          style: TextStyle(
            color:
                isSelected
                    ? const Color(0xFF4CAF50)
                    : textColor ?? Colors.grey[800],
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            fontSize: 15,
          ),
        ),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Konfirmasi'),
          content: const Text('Apakah Anda yakin ingin mengganti operator?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Batal', style: TextStyle(color: Colors.grey[600])),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                ref
                    .read(cashierLoginToDeviceProvider.notifier)
                    .logoutCashierFromDevice();
                ref.read(tryAuthProvider.notifier).logoutCashier();
              },
              child: const Text(
                'Ya, Ganti',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showUpdateDataDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.refresh, color: Color(0xFF4CAF50), size: 24),
              SizedBox(width: 8),
              Text('Update Data'),
            ],
          ),
          content: const Text(
            'Apakah Anda ingin memperbarui data aplikasi? Ini akan menyinkronkan data terbaru dari server.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Batal', style: TextStyle(color: Colors.grey[600])),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                _performDataUpdate(context, ref);
              },
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Update'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        );
      },
    );
  }

  void _performDataUpdate(BuildContext context, WidgetRef ref) {
    // Show loading snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            SizedBox(width: 12),
            Text('Memperbarui data...'),
          ],
        ),
        duration: Duration(seconds: 2),
      ),
    );

    // TODO: Implementasikan logic update data sesuai kebutuhan
    // Contoh: refresh provider data, sync dengan server, dll
    //
    // Misalnya:
    // ref.refresh(someDataProvider);
    // await apiService.syncData();

    // Show success message after delay (simulate API call)
    Future.delayed(const Duration(seconds: 2), () {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          //overlay alert success update data
          const SnackBar(
            content: Text('Data berhasil diperbarui!'),
            backgroundColor: Color(0xFF4CAF50),
          ),
        );
      }
    });
  }
}
