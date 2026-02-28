import 'package:barajacoffee/utils/nearest_store.dart';
import 'package:barajacoffee/pages/order_screen.dart';
import 'package:barajacoffee/widgets/MenuDetailScreen.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class StoreScreen extends StatefulWidget {
  final String orderType;

  const StoreScreen({super.key, required this.orderType});

  @override
  _StoreScreenState createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  late String selectedOrderType;
  Map<String, dynamic>? nearestStore;
  String currentAddress = "Mendeteksi lokasi...";
  Map<String, int> cartItems = {};
  List<String> categories = ["Coffee", "Non Coffee", "Main Course", "Rice & Noodles", "Light Meals"];
  String selectedCategory = "Coffee";

  List<Map<String, dynamic>> menuItems = [
    {'title': 'Hell Braun Coffee', 'price': 'Rp 25.000', 'imageUrl': 'https://placehold.co/600x400/png', 'category': 'Coffee'},
    {'title': 'Green Tea Latte', 'price': 'Rp 28.000', 'imageUrl': 'https://placehold.co/600x400/png', 'category': 'Non Coffee'},
    {'title': 'Nasi Goreng Special', 'price': 'Rp 45.000', 'imageUrl': 'https://placehold.co/600x400/png', 'category': 'Rice & Noodles'},
    {'title': 'Chicken Steak', 'price': 'Rp 60.000', 'imageUrl': 'https://placehold.co/600x400/png', 'category': 'Main Course'},
    {'title': 'French Fries', 'price': 'Rp 25.000', 'imageUrl': 'https://placehold.co/600x400/png', 'category': 'Light Meals'},
  ];

  @override
  void initState() {
    super.initState();
    selectedOrderType = widget.orderType;
    getLocationAndStore();
  }

  Future<void> getLocationAndStore() async {
    Position? position = await getUserLocation();
    if (position != null) {
      Map<String, dynamic>? store = findNearestStore(position);
      setState(() {
        nearestStore = store;
        currentAddress = "Lat: ${position.latitude}, Lon: ${position.longitude}";
      });
    } else {
      setState(() {
        currentAddress = "Lokasi tidak tersedia";
      });
    }
  }

  void _navigateToDetail(Map<String, dynamic> item) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MenuDetailScreen(
          title: item['title'],
          price: item['price'],
          imageUrl: item['imageUrl'],
        ),
      ),
    );

    if (result != null) {
      setState(() {
        cartItems[result] = (cartItems[result] ?? 0) + 1;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    var filteredMenu = menuItems.where((item) => item['category'] == selectedCategory).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Menu", style: TextStyle(color: Colors.black)),
        backgroundColor: const Color.fromARGB(255, 255, 255, 255),
      ),
      body: Column(
        children: [
          // Store Info
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(selectedOrderType, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 5),
                Text(nearestStore != null ? "${nearestStore!["name"]}, ${nearestStore!["distance"]?.toStringAsFixed(1)} km. Terdekat" : "Mencari toko terdekat..."),
                const SizedBox(height: 10),
                const Text("Lokasimu saat ini", style: TextStyle(fontWeight: FontWeight.bold)),
                Text(currentAddress),
              ],
            ),
          ),

          // Categories - Scrollable
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              children: categories.map((category) {
                bool isSelected = category == selectedCategory;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  child: GestureDetector(
                    onTap: () => setState(() => selectedCategory = category),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF076A3B) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF076A3B)),
                      ),
                      child: Center(
                        child: Text(
                          category,
                          style: TextStyle(
                            color: isSelected ? Colors.white : const Color(0xFF076A3B),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Menu List
          Expanded(
            child: ListView.builder(
              itemCount: filteredMenu.length,
              itemBuilder: (context, index) {
                var item = filteredMenu[index];
                String title = item['title'];
                int quantity = cartItems[title] ?? 0;

                return Card(
                  margin: const EdgeInsets.all(10),
                  child: ListTile(
                    leading: Image.network(item['imageUrl'], width: 50, height: 50, fit: BoxFit.cover),
                    title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(item['price']),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (quantity > 0) ...[
                          IconButton(icon: const Icon(Icons.remove), onPressed: () => setState(() => cartItems[title] = quantity > 1 ? quantity - 1 : 0)),
                          Text('$quantity'),
                        ],
                        IconButton(icon: const Icon(Icons.add), onPressed: () => setState(() => cartItems[title] = quantity + 1)),
                      ],
                    ),
                    onTap: () => _navigateToDetail(item),
                  ),
                );
              },
            ),
          ),
             // Cart Summary
          if (cartItems.isNotEmpty)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total Items: ${cartItems.values.reduce((a, b) => a + b)}',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF076A3B)),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF076A3B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OrderScreen(cartItems: cartItems),
                      ),
                    ),
                    child: const Text('Checkout', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
