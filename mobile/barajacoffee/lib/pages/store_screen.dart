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

class _StoreScreenState extends State<StoreScreen> with SingleTickerProviderStateMixin {
  late String selectedOrderType;
  Map<String, dynamic>? nearestStore;
  String currentAddress = "Mendeteksi lokasi...";
  Map<String, int> cartItems = {};
  List<Map<String, dynamic>> menuItems = [
    {
      'title': 'Hell Braun Coffee',
      'price': 'Rp 25.000',
      'imageUrl': 'https://placehold.co/600x400/png',
      'category': 'Coffee'
    },
    {
      'title': 'Dunkel Braun Coffee',
      'price': 'Rp 28.000',
      'imageUrl': 'https://placehold.co/600x400/png',
      'category': 'Coffee'
    },
    {
      'title': 'Latte Coffee',
      'price': 'Rp 30.000',
      'imageUrl': 'https://placehold.co/600x400/png',
      'category': 'Coffee'
    },
    {
      'title': 'Irish Coffee',
      'price': 'Rp 35.000',
      'imageUrl': 'https://placehold.co/600x400/png',
      'category': 'Coffee'
    },
    {
      'title': 'Green Tea Latte',
      'price': 'Rp 28.000',
      'imageUrl': 'https://placehold.co/600x400/png',
      'category': 'Non Coffee'
    },
    {
      'title': 'Chocolate Frappe',
      'price': 'Rp 32.000',
      'imageUrl': 'https://placehold.co/600x400/png',
      'category': 'Non Coffee'
    },
    {
      'title': 'Sandwich',
      'price': 'Rp 40.000',
      'imageUrl': 'https://placehold.co/600x400/png',
      'category': 'Food'
    },
    {
      'title': 'Croissant',
      'price': 'Rp 35.000',
      'imageUrl': 'https://placehold.co/600x400/png',
      'category': 'Food'
    },
  ];
  String selectedCategory = 'Coffee';
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    selectedOrderType = widget.orderType;
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_handleTabSelection);
    getLocationAndStore();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging) {
      setState(() {
        selectedCategory = ['Coffee', 'Non Coffee', 'Food'][_tabController.index];
      });
    }
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
        title: Text("Menu", style: TextStyle(color: Colors.white)),
        backgroundColor: Color(0xFF076A3B),
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.white),
      ),
      backgroundColor: Colors.grey[200],
      body: Column(
        children: [
          // Store Info Section
            Container(
            padding: EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  selectedOrderType,
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 5),
                Text(
                  nearestStore != null
                      ? "${nearestStore!["name"]}, ${nearestStore!["distance"]?.toStringAsFixed(1)} km. Terdekat"
                      : "Mencari toko terdekat...",
                  style: TextStyle(color: Colors.grey[600]),
                ),
                SizedBox(height: 10),
                Text(
                  "Lokasimu saat ini",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  currentAddress,
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          // Category Tabs
          SizedBox(height: 10), 
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              indicatorColor: Color(0xFF076A3B),
              labelColor: Colors.white,
              unselectedLabelColor: Colors.black,
              indicator: BoxDecoration(
                color: Color(0xFF076A3B),
                
                borderRadius: BorderRadius.circular(8.0),
              ),
              tabs: [
                Tab(text: 'Coffee'),
                Tab(text: 'Non Coffee'),
                Tab(text: 'Food'),
              ],
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
                  margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  elevation: 3,
                  child: ListTile(
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(item['imageUrl'], width: 50, height: 50, fit: BoxFit.cover),
                    ),
                    title: Text(title, style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(item['price'], style: TextStyle(color: Colors.grey[600])),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (quantity > 0) ...[
                          IconButton(
                            icon: Icon(Icons.remove, color: Color(0xFF076A3B)),
                            onPressed: () => setState(() {
                              if (cartItems[title] == 1) {
                                cartItems.remove(title);
                              } else {
                                cartItems[title] = quantity - 1;
                              }
                            }),
                          ),
                          Text('$quantity', style: TextStyle(color: Color(0xFF076A3B))),
                        ],
                        IconButton(
                          icon: Icon(Icons.add, color: Color(0xFF076A3B)),
                          onPressed: () => setState(() => cartItems[title] = (quantity) + 1),
                        ),
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
              padding: EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total Items: ${cartItems.values.reduce((a, b) => a + b)}',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF076A3B)),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF076A3B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OrderScreen(cartItems: cartItems),
                      ),
                    ),
                    child: Text('Checkout', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}