import 'package:flutter/material.dart';

class VoucherScreen extends StatefulWidget {
  const VoucherScreen({super.key});

  @override
  _VoucherScreenState createState() => _VoucherScreenState();
}

class _VoucherScreenState extends State<VoucherScreen> {
  final TextEditingController _voucherController = TextEditingController();
  List<Map<String, dynamic>> vouchers = [
    {"code": "DISKON50", "description": "Potongan Rp 50.000", "expiry": "30 Feb 2025"},
    {"code": "FREESHIP", "description": "Gratis Ongkir", "expiry": "15 Mar 2025"},
    {"code": "CASHBACK10", "description": "Cashback 10%", "expiry": "20 Apr 2025"},
  ];

  void applyVoucher() {
    String inputCode = _voucherController.text.trim().toUpperCase();
    bool isValid = vouchers.any((voucher) => voucher["code"] == inputCode);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isValid ? "Voucher berhasil digunakan!" : "Kode voucher tidak valid!"),
        backgroundColor: isValid ? Colors.green : Colors.red,
      ),
    );

    if (isValid) {
      _voucherController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text("Vouchers"),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Input Manual Voucher
            TextField(
              controller: _voucherController,
              decoration: InputDecoration(
                hintText: "Enter Voucher Code",
                suffixIcon: IconButton(
                  icon: Icon(Icons.check_circle, color: Colors.green[700]),
                  onPressed: applyVoucher,
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            SizedBox(height: 20),

            // List Voucher
            Expanded(
              child: ListView.builder(
                itemCount: vouchers.length,
                itemBuilder: (context, index) {
                  var voucher = vouchers[index];
                  return Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 3,
                    child: ListTile(
                      contentPadding: EdgeInsets.all(16),
                      title: Text(voucher["code"], style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      subtitle: Text(voucher["description"]),
                      trailing: Text("Exp: ${voucher["expiry"]}", style: TextStyle(color: Colors.red)),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
