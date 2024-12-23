import 'package:flutter/material.dart';

class CheckoutPage extends StatefulWidget {
  @override
  _CheckoutPageState createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  String selectedMethod = "Pickup"; // Default metode
  final List<String> storeAddresses = [
    "Baraja Amphitheater, Tuaprev",
    "Downtown Plaza, Westfield",
    "Central Park Mall, New York",
    "Greenwood Square, Los Angeles"
  ];
  final List<String> savedAddresses = [
    "Home - Jalan Mawar 45, Jakarta",
    "Office - Jalan Sudirman 88, Jakarta",
    "Grandma's House - Jalan Melati 20, Bandung"
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          "Search Address",
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
          // Tab untuk metode Dine-in, Pickup, Delivery
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildTabOption(context, "Dine in"),
                _buildTabOption(context, "Pickup"),
                _buildTabOption(context, "Delivery"),
              ],
            ),
          ),
          Divider(color: Colors.grey[300]),

          // Daftar alamat berdasarkan metode
          Expanded(
            child: ListView.builder(
              itemCount: selectedMethod == "Delivery"
                  ? savedAddresses.length
                  : storeAddresses.length,
              itemBuilder: (context, index) {
                String address = selectedMethod == "Delivery"
                    ? savedAddresses[index]
                    : storeAddresses[index];
                return _buildAddressCard(address);
              },
            ),
          ),

          // Tombol Select Payment
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
              onPressed: () {
                // Aksi untuk memilih metode pembayaran
              },
              child: Text(
                "Select Payment",
                style: TextStyle(fontSize: 16, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Widget untuk tab metode
  Widget _buildTabOption(BuildContext context, String title) {
    bool isSelected = selectedMethod == title;
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedMethod = title;
        });
      },
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
        decoration: BoxDecoration(
          color: isSelected ? Color(0xFF076A3B) : Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  // Widget untuk kartu alamat
  Widget _buildAddressCard(String address) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        leading: Icon(Icons.location_pin, color: Color(0xFF076A3B)),
        title: Text(
          address.split(" - ").first,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        subtitle: Text(
          address.contains(" - ") ? address.split(" - ").last : "",
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
        onTap: () {
          // Aksi saat alamat dipilih
        },
      ),
    );
  }
}
