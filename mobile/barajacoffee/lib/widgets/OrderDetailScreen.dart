import 'package:flutter/material.dart';

class OrderDetailScreen extends StatelessWidget {
  final Map<String, dynamic> order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    // Menentukan estimasi waktu berdasarkan status pesanan
    String estimatedTime = getEstimatedTime(order["status"]);

    return Scaffold(
      appBar: AppBar(
        title: Text("Order Details"),
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
              "Order ID: ${order["id"]}",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 5),
            Text(
              "Date: ${order["date"]}",
              style: TextStyle(color: Colors.grey[600]),
            ),
            SizedBox(height: 10),

            // Estimasi waktu tiba
            Row(
              children: [
                Icon(Icons.access_time, color: Colors.green[700]),
                SizedBox(width: 5),
                Text(
                  "Estimated Arrival: $estimatedTime",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                ),
              ],
            ),

            SizedBox(height: 20),

            Text(
              "Items Ordered",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),

            // Daftar item dalam pesanan
            Expanded(
              child: ListView.builder(
                itemCount: order["items"].length,
                itemBuilder: (context, index) {
                  var item = order["items"][index];
                  return ListTile(
                    leading: Icon(Icons.fastfood, color: Color(0xFF076A3B)),
                    title: Text(item["name"]),
                    subtitle: Text("Quantity: ${item["quantity"]}"),
                    trailing: Text("Rp ${item["price"]}"),
                  );
                },
              ),
            ),

            Divider(),

            // Total harga
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                "Total: ${order["total"]}",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Menentukan estimasi waktu tiba
  String getEstimatedTime(String status) {
    if (status == "On Process") {
      return "15-30 min (Delivery)";
    } else if (status == "Completed") {
      return "Order Completed";
    } else {
      return "Order Cancelled";
    }
  }
}
