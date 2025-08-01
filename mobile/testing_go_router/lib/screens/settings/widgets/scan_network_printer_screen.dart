import 'package:flutter/material.dart';

class ScanNetworkPrinterScreen extends StatelessWidget {
  const ScanNetworkPrinterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Network Printer')),
      body: Center(
        child: Text(
          'Fitur ini belum tersedia. Silakan gunakan fitur scan printer Bluetooth.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ),
    );
  }
}
