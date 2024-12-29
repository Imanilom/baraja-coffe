import 'package:flutter/material.dart';
import '../assets/component/bottom_navigation.dart';

class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});

  @override
  // ignore: library_private_types_in_public_api
  _MenuScreenState createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, String>> cartItems = []; // List untuk menyimpan item keranjang

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Menu"),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          // Dine In, Pickup, Delivery Tabs
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
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
                Tab(text: 'Dine in'),
                Tab(text: 'Pickup'),
                Tab(text: 'Delivery'),
              ],
            ),
          ),
          SizedBox(height: 8.0, width: 10),

          // Location Selector
          ListTile(
            leading: Icon(Icons.location_on, color: Colors.grey),
            title: Text(
              "Baraja Amphitheater, Tuparev",
              style: TextStyle(fontSize: 14, color: Colors.black87),
            ),
            trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ),
          Divider(),

          // Coffee, Non-Coffee, Food Tabs
          DefaultTabController(
            length: 3,
            child: TabBar(
              indicatorColor: Color(0xFF076A3B),
              labelColor: Colors.white,
              indicatorSize: TabBarIndicatorSize.tab,
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
          SizedBox(height: 10, width: 10,),

          // ListView untuk item menu
          Expanded(
            child: ListView(
              children: [
                buildMenuItem(
                  'Hell Braun Coffee',
                  'Rp 25.000',
                  'https://placehold.co/600x400',
                ),
                buildMenuItem(
                  'Dunkel Braun Coffee',
                  'Rp 28.000',
                  'https://placehold.co/600x400',
                ),
                buildMenuItem(
                  'Latte Coffee',
                  'Rp 30.000',
                  'https://placehold.co/600x400',
                ),
                buildMenuItem(
                  'Irish Coffee',
                  'Rp 35.000',
                  'https://placehold.co/600x400',
                ),
              ],
            ),
          ),

          // Jika keranjang tidak kosong, tampilkan tab keranjang
          if (cartItems.isNotEmpty)
            Container(
              color: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Keranjang (${cartItems.length})',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      // Navigasi ke halaman keranjang
                      Navigator.push(context, MaterialPageRoute(builder: (_) => CartScreen(cartItems: cartItems)));
                    },
                    child: Text('Lihat Keranjang'),
                  ),
                ],
              ),
            ),
        ],
      ),
      bottomNavigationBar: BottomNavigation(),
    );
  }

  // Widget untuk menu item
  Widget buildMenuItem(String title, String price, String imagePath) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      elevation: 2,
      child: ListTile(
        leading: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            image: DecorationImage(
              image: NetworkImage(imagePath),
              fit: BoxFit.cover,
            ),
          ),
        ),
        title: Text(
          title,
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          price,
          style: TextStyle(fontSize: 14, color: Colors.black54),
        ),
        trailing: Icon(Icons.add_circle_outline, color: Color(0xFF076A3B)),
        onTap: () {
          // Tambahkan item ke keranjang
          setState(() {
            cartItems.add({'title': title, 'price': price});
          });
        },
      ),
    );
  }
}

// Halaman Keranjang
class CartScreen extends StatelessWidget {
  final List<Map<String, String>> cartItems;

  const CartScreen({super.key, required this.cartItems});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Keranjang'),
        backgroundColor: Colors.green,
      ),
      body: ListView.builder(
        itemCount: cartItems.length,
        itemBuilder: (context, index) {
          final item = cartItems[index];
          return ListTile(
            title: Text(item['title']!),
            subtitle: Text(item['price']!),
          );
        },
      ),
    );
  }
}
