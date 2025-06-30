import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/general/setting_menu_model.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/screens/settings/widgets/printer_connection.dart';
import 'package:kasirbaraja/screens/settings/widgets/printer_home_screen.dart';

class SettingScreen extends ConsumerWidget {
  const SettingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentMenuSettingIndex = ref.watch(currentMenuSettingsProvider);
    //membuat data setting menu dari model
    final menuSettings = [
      // SettingMenuModel(title: 'setting', icon: Icons.settings, index: 0),
      SettingMenuModel(title: 'Printer', icon: Icons.print, index: 1),
      SettingMenuModel(title: 'Logout', icon: Icons.logout, index: 2),
    ];

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // Handle back action
            Navigator.pop(context);
          },
        ),
        title: const Text('Settings'),
      ),
      body: Container(
        color: Colors.white,
        alignment: Alignment.center,
        child: Row(
          children: [
            Expanded(
              flex: 1,
              child: ListView.builder(
                itemCount: menuSettings.length,
                itemBuilder: (context, index) {
                  final item = menuSettings[index];
                  return ListTile(
                    leading: Icon(item.icon),
                    title: Text(item.title),
                    onTap: () {
                      ref
                          .read(currentMenuSettingsProvider.notifier)
                          .setIndex(item.index);
                    },
                  );
                },
              ),
            ),
            Expanded(
              flex: 2,
              child: Container(
                color: Colors.grey[200],
                child: IndexedStack(
                  index: currentMenuSettingIndex,
                  children: const <Widget>[
                    Center(child: Text('Setting')),
                    // PrinterConnection(),
                    PrinterHomeScreen(),
                    Center(child: Text('Logout')),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
