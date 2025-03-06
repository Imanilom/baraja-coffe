import 'package:barajacoffee/widgets/OrderDetailScreen.dart';
import 'package:flutter/material.dart';


class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  _OrderHistoryScreenState createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("History"),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black),
      ),
      backgroundColor: Colors.grey[200],
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 12),
              child: TabBar(
                controller: _tabController,
                indicatorColor: Color(0xFF076A3B),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.black,
                indicator: BoxDecoration(
                  color: Color(0xFF076A3B),
                  borderRadius: BorderRadius.circular(8.0),
                ),
                tabs: [
                  Tab(text: "On Process"),
                  Tab(text: "History"),
                ],
              ),
            ),
            SizedBox(height: 8.0),

            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  buildOrderList("On Process"),
                  buildOrderList("History"),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildOrderList(String category) {
    List<Map<String, dynamic>> orders = [
  {
    "id": "#1234",
    "status": "On Process",
    "date": "12 Feb 2025",
    "total": "Rp 150.000",
    "payment_method": "Credit Card",
    "location": "Jakarta",
    "voucher": "DISKON20",
    "discount": "Rp 30.000",
    "final_total": "Rp 120.000",
    "rating": 5,
    "items": [
      { "name": "Burger", "quantity": 2, "price": "50.000" },
      { "name": "French Fries", "quantity": 1, "price": "50.000" }
    ]
  },
  {
    "id": "#5678",
    "status": "Completed",
    "date": "10 Feb 2025",
    "total": "Rp 200.000",
    "payment_method": "Cash",
    "location": "Surabaya",
    "voucher": "-",
    "discount": "Rp 0",
    "final_total": "Rp 200.000",
    "rating": 4.5,
    "items": [
      { "name": "Pizza", "quantity": 1, "price": "100.000" },
      { "name": "Soft Drink", "quantity": 2, "price": "50.000" }
    ]
  },
  {
    "id": "#9101",
    "status": "Cancelled",
    "date": "8 Feb 2025",
    "total": "Rp 50.000",
    "payment_method": "E-Wallet",
    "location": "Bandung",
    "voucher": "FREECOFFEE",
    "discount": "Rp 50.000",
    "final_total": "Rp 0",
    "rating": 5,
    "items": [
      { "name": "Coffee", "quantity": 1, "price": "50.000" }
    ]
  }


    ];

    List<Map<String, dynamic>> filteredOrders = orders.where((order) {
      if (category == "On Process") {
        return order["status"] == "On Process";
      } else {
        return order["status"] != "On Process";
      }
    }).toList();

    return filteredOrders.isEmpty
        ? Center(child: Text("No orders found", style: TextStyle(color: Colors.grey)))
        : ListView.builder(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: filteredOrders.length,
            itemBuilder: (context, index) {
              var order = filteredOrders[index];
              return buildOrderCard(order);
            },
          );
  }

  Widget buildOrderCard(Map<String, dynamic> order) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: EdgeInsets.symmetric(vertical: 8),
      elevation: 3,
      color: Colors.white,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(order["id"], style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(order["date"], style: TextStyle(color: Colors.grey[600])),
                buildStatusChip(order["status"]),
              ],
            ),
            SizedBox(height: 8),
            Text("Total: ${order["total"]}", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => OrderDetailScreen(order: order),
                    ),
                  );
                },
                child: Text("View Details", style: TextStyle(color: Colors.green[700])),
              ),
            ),
          ],
        ),
      ),
    );
  }

    // Widget untuk menampilkan status pesanan sebagai chip warna-warni
  Widget buildStatusChip(String status) {
    Color color;
    if (status == "On Process") {
      color = Colors.orange;
    } else if (status == "Completed") {
      color = Color(0xFF076A3B);
    } else {
      color = Colors.red;
    }

    return Chip(
      backgroundColor: color.withOpacity(0.2),
      label: Text(
        status,
        style: TextStyle(color: color, fontWeight: FontWeight.bold),
      ),
    );
  }
}


