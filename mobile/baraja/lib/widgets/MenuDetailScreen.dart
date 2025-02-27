import 'package:flutter/material.dart';

class MenuDetailScreen extends StatefulWidget {
  final Map<String, dynamic> menu;

  const MenuDetailScreen({super.key, required this.menu});

  @override
  _MenuDetailScreenState createState() => _MenuDetailScreenState();
}

class _MenuDetailScreenState extends State<MenuDetailScreen> {
  int quantity = 1;
  String sweetness = "Normal";
  String espresso = "Single";

  @override
  Widget build(BuildContext context) {
    double finalPrice = widget.menu['price'] * quantity;

    return Scaffold(
      appBar: AppBar(title: Text(widget.menu['name'])),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Image.asset(widget.menu['image'], width: 200, height: 200, fit: BoxFit.cover),
            ),
            SizedBox(height: 20),
            Text(widget.menu['name'], style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text(widget.menu['description'], style: TextStyle(color: Colors.grey[700])),
            SizedBox(height: 10),
            Text("Rp ${widget.menu['price']}", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.brown)),

            // Sweetness selection
            DropdownButton<String>(
              value: sweetness,
              items: ["Less", "Normal", "Extra"].map((value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text("Sweetness: $value"),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) setState(() => sweetness = value);
              },
            ),

            // Espresso selection
            DropdownButton<String>(
              value: espresso,
              items: ["Single", "Double"].map((value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text("Espresso: $value"),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) setState(() => espresso = value);
              },
            ),

            SizedBox(height: 20),

            // Quantity & Price
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: Icon(Icons.remove),
                      onPressed: () => setState(() {
                        if (quantity > 1) quantity--;
                      }),
                    ),
                    Text(quantity.toString(), style: TextStyle(fontSize: 18)),
                    IconButton(
                      icon: Icon(Icons.add),
                      onPressed: () => setState(() {
                        quantity++;
                      }),
                    ),
                  ],
                ),
                Text("Rp $finalPrice", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),

            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context, {'menu': widget.menu, 'quantity': quantity, 'sweetness': sweetness, 'espresso': espresso});
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: Text("Tambah ke Keranjang"),
            ),
          ],
        ),
      ),
    );
  }
}
