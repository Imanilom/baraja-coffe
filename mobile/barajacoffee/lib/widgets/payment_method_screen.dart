import 'package:flutter/material.dart';

class PaymentMethodsScreen extends StatefulWidget {
  const PaymentMethodsScreen({super.key});

  @override
  _PaymentMethodsScreenState createState() => _PaymentMethodsScreenState();
}

class _PaymentMethodsScreenState extends State<PaymentMethodsScreen> {
  List<String> savedPayments = ['Gopay - **** 1234'];
  String? selectedMethod;

  final List<Map<String, String>> availableMethods = [
    {'name': 'Gopay', 'logo': 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg'},
    {'name': 'OVO', 'logo': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo.svg'},
    {'name': 'Dana', 'logo': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_DANA.svg'},
    {'name': 'ShopeePay', 'logo': 'https://upload.wikimedia.org/wikipedia/commons/0/00/ShopeePay_logo.svg'},
    {'name': 'Kartu Kredit', 'logo': 'https://cdn-icons-png.flaticon.com/512/349/349221.png'},
  ];

  void _addPaymentMethod(String method) {
    setState(() {
      savedPayments.add("$method - **** ${1000 + savedPayments.length}");
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Metode Pembayaran"),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (savedPayments.isNotEmpty) ...[
              const Text("Metode Tersimpan", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...savedPayments.map((payment) => _buildSavedPaymentCard(payment)).toList(),
              const SizedBox(height: 20),
            ],
            const Text("Pilih Metode Pembayaran", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                children: availableMethods.map((method) => _buildPaymentOption(method)).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedPaymentCard(String payment) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        leading: const Icon(Icons.credit_card, color: Colors.green),
        title: Text(payment),
        trailing: IconButton(
          icon: const Icon(Icons.delete, color: Colors.red),
          onPressed: () {
            setState(() {
              savedPayments.remove(payment);
            });
          },
        ),
      ),
    );
  }

  Widget _buildPaymentOption(Map<String, String> method) {
    return ListTile(
      leading: Image.network(method['logo']!, width: 40, height: 40, errorBuilder: (context, error, stackTrace) => const Icon(Icons.payment)),
      title: Text(method['name']!),
      trailing: ElevatedButton(
        onPressed: () => _addPaymentMethod(method['name']!),
        child: const Text("Hubungkan"),
      ),
    );
  }
}
