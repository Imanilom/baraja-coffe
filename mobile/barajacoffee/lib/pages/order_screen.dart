import 'package:flutter/material.dart';
import 'dart:async';

class OrderScreen extends StatefulWidget {
  final Map<String, int> cartItems;

  const OrderScreen({super.key, required this.cartItems});

  @override
  _OrderScreenState createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  String? selectedPaymentMethod; // Menyimpan metode pembayaran yang dipilih
  bool isProcessing = false; // Untuk menampilkan animasi

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Konfirmasi Pesanan"),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Ringkasan Pesanan",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),

            // Daftar item yang dipesan
            Expanded(
              child: ListView.builder(
                itemCount: widget.cartItems.length,
                itemBuilder: (context, index) {
                  String itemName = widget.cartItems.keys.elementAt(index);
                  int quantity = widget.cartItems[itemName]!;
                  return ListTile(
                    leading: Icon(Icons.fastfood, color: Color(0xFF076A3B)),
                    title: Text(itemName),
                    subtitle: Text("Jumlah: $quantity"),
                  );
                },
              ),
            ),

            Divider(),

            Text(
              "Pilih Metode Pembayaran",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),

            // Metode pembayaran (E-Wallet & Debit)
            Column(
              children: [
                buildPaymentOption("E-Wallet", Icons.account_balance_wallet),
                buildPaymentOption("Debit Card", Icons.credit_card),
              ],
            ),

            SizedBox(height: 20),

            // **Tombol di tengah layar**
            Center(
              child: ElevatedButton(
                onPressed: selectedPaymentMethod == null || isProcessing
                    ? null
                    : () {
                        setState(() {
                          isProcessing = true;
                        });

                        // Animasi loading, lalu checklist, lalu kembali ke /main
                        Future.delayed(Duration(seconds: 2), () {
                          setState(() {
                            isProcessing = false;
                          });

                          showDialog(
                            context: context,
                            barrierDismissible: false,
                            builder: (context) {
                              return AlertDialog(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                content: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.check_circle, color: Colors.green, size: 80),
                                    SizedBox(height: 10),
                                    Text(
                                      "Pembayaran Berhasil!",
                                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                    ),
                                    SizedBox(height: 10),
                                    Text("Terima kasih atas pesanan Anda."),
                                  ],
                                ),
                              );
                            },
                          );

                          Future.delayed(Duration(seconds: 2), () {
                            Navigator.pop(context); // Tutup dialog
                            Navigator.pushNamed(context, "/main"); // Kembali ke /main
                          });
                        });
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF076A3B),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: EdgeInsets.symmetric(vertical: 16, horizontal: 40),
                ),
                child: isProcessing
                    ? CircularProgressIndicator(color: Colors.white) // Animasi loading di tengah
                    : Text(
                        "Konfirmasi Pembayaran",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget untuk metode pembayaran
  Widget buildPaymentOption(String title, IconData icon) {
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedPaymentMethod = title;
        });
      },
      child: Card(
        elevation: selectedPaymentMethod == title ? 5 : 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(
            color: selectedPaymentMethod == title ? Color(0xFF076A3B) : Colors.grey.shade300,
            width: 2,
          ),
        ),
        child: ListTile(
          leading: Icon(icon, color: Color(0xFF076A3B)),
          title: Text(title),
          trailing: selectedPaymentMethod == title
              ? Icon(Icons.check_circle, color: Color(0xFF076A3B))
              : null,
        ),
      ),
    );
  }
}
