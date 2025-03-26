import 'package:barajapos/providers/navigation_provider.dart';
import 'package:barajapos/screens/home/history_screen.dart';
import 'package:barajapos/screens/home/home_screen.dart';
import 'package:barajapos/screens/home/online_order_screen.dart';
import 'package:barajapos/screens/home/saved_order_screen.dart';
import 'package:barajapos/screens/order_details/order_detail_screen.dart';
// import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

class MainScreen extends ConsumerWidget {
  const MainScreen({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = ref.watch(navigationProvider);

    void onItemTapped(int index) {
      print('index: $index');
      ref.read(navigationProvider.notifier).setIndex(index);
    }

    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Scaffold(
            headers: [
              AppBar(
                title: const Text('BarajaPOS'),
                trailing: [
                  _NavItem(
                    icon: LucideIcons.house,
                    label: 'Home',
                    index: 0,
                    selectedIndex: selectedIndex,
                    onTap: onItemTapped,
                  ),
                  _NavItem(
                    icon: LucideIcons.smartphone,
                    label: 'Orders',
                    index: 1,
                    selectedIndex: selectedIndex,
                    onTap: onItemTapped,
                  ),
                  _NavItem(
                    icon: LucideIcons.history,
                    label: 'History',
                    index: 2,
                    selectedIndex: selectedIndex,
                    onTap: onItemTapped,
                  ),
                  _NavItem(
                    icon: LucideIcons.shoppingCart,
                    label: 'Saved',
                    index: 3,
                    selectedIndex: selectedIndex,
                    onTap: onItemTapped,
                  ),
                ],
              ),
            ],
            // body: _buildBody(selectedIndex),
            child: IndexedStack(
              index: selectedIndex,
              children: const [
                HomeScreen(),
                OnlineOrderScreen(),
                HistoryScreen(),
                SavedOrderScreen(),
              ],
            ),
          ),
        ),
        const Expanded(
          flex: 1,
          child: OrderDetailScreen(),
        ),
      ],
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index;
  final int selectedIndex;
  final Function(int) onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.index,
    required this.selectedIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = selectedIndex == index;
    return NavigationItem(
      index: index,
      selected: isSelected,
      child: GestureDetector(
        onTap: () => onTap(index),
        child: Container(
          color: isSelected ? Colors.primaries.first : Colors.transparent,
          child: Column(
            children: [
              Icon(icon),
              const SizedBox(width: 8),
              Text(label),
            ],
          ),
        ),
      ),
    );
  }
}
