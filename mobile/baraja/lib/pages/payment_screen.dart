import 'package:flutter/material.dart';

class PaymentScreen extends StatefulWidget {
  final double totalAmount;

  PaymentScreen({required this.totalAmount});

  @override
  _PaymentScreenState createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String? selectedPaymentMethod;

  final List<Map<String, String>> paymentMethods = [
    {"icon": "assets/images/e_wallet.png", "name": "E-Wallet"},
    {"icon": "assets/images/debit_card.png", "name": "Debit Card"},
    {"icon": "assets/images/credit_card.png", "name": "Credit Card"},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          "Payment",
          style: TextStyle(color: Colors.black),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: Column(
        children: [
          // Total Amount Display
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 24.0),
            child: Container(
              padding: EdgeInsets.symmetric(vertical: 12.0),
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Center(
                child: Text(
                  "Rp ${widget.totalAmount.toStringAsFixed(3)}",
                  style: TextStyle(fontSize: 20.0, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),

          // Payment Method Section
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: ListView.builder(
                itemCount: paymentMethods.length,
                itemBuilder: (context, index) {
                  final payment = paymentMethods[index];
                  return Card(
                    margin: EdgeInsets.symmetric(vertical: 8.0),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: ListTile(
                      leading: Image.asset(
                        payment["icon"]!,
                        width: 40,
                        height: 40,
                      ),
                      title: Text(
                        payment["name"]!,
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      trailing: Radio<String>(
                        value: payment["name"]!,
                        groupValue: selectedPaymentMethod,
                        onChanged: (String? value) {
                          setState(() {
                            selectedPaymentMethod = value;
                          });
                        },
                      ),
                      onTap: () {
                        setState(() {
                          selectedPaymentMethod = payment["name"];
                        });
                      },
                    ),
                  );
                },
              ),
            ),
          ),

          // Pay Button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF076A3B),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                minimumSize: Size(double.infinity, 50),
              ),
              onPressed: selectedPaymentMethod != null
                  ? () {
                      // Aksi untuk melakukan pembayaran
                      showDialog(
                        context: context,
                        builder: (context) {
                          return AlertDialog(
                            title: Text("Payment Successful"),
                            content: Text(
                                "You have successfully paid using $selectedPaymentMethod."),
                            actions: [
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                },
                                child: Text("OK"),
                              ),
                            ],
                          );
                        },
                      );
                    }
                  : null,
              child: Text(
                "Pay",
                style: TextStyle(fontSize: 16, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
