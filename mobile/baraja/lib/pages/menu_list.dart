import 'package:baraja/pages/order_screen.dart';
import 'package:flutter/material.dart';

class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});

  @override
  _MenuScreenState createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, int> cartItems = {}; // Map untuk menyimpan jumlah item per nama menu

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
          // Tabs
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

          ListTile(
            leading: Icon(Icons.location_on, color: Colors.grey),
            title: Text(
              "Baraja Amphitheater, Tuparev",
              style: TextStyle(fontSize: 14, color: Colors.black87),
            ),
            trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ),
          Divider(),

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
          SizedBox(height: 10),

          // ListView untuk item menu
          Expanded(
            child: ListView(
              children: [
                buildMenuItem('Hell Braun Coffee', 'Rp 25.000', 'https://placehold.co/600x400/png'),
                buildMenuItem('Dunkel Braun Coffee', 'Rp 28.000', 'https://placehold.co/600x400/png'),
                buildMenuItem('Latte Coffee', 'Rp 30.000', 'https://placehold.co/600x400/png'),
                buildMenuItem('Irish Coffee', 'Rp 35.000', 'https://placehold.co/600x400/png'),
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
                    'Keranjang (${cartItems.values.reduce((a, b) => a + b)})',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
               ElevatedButton(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                      ),
                      builder: (_) => DraggableScrollableSheet(
                        expand: false,
                        initialChildSize: 0.5, // Tinggi awal
                        minChildSize: 0.3, // Tinggi minimum
                        maxChildSize: 1.0, // Tinggi maksimum
                        builder: (BuildContext context, ScrollController scrollController) {
                          return CartScreen(
                            cartItems: cartItems,
                            scrollController: scrollController,
                          );
                        },
                      ),
                    );
                  },
                  child: Text('Lihat Keranjang'),
                ),

                ],
              ),
            ),
        ],
      ),
    );
  }

  // Widget untuk menu item
  Widget buildMenuItem(String title, String price, String imageUrl) {
    int quantity = cartItems[title] ?? 0; // Jumlah item dalam keranjang
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      elevation: 2,
      child: ListTile(
        contentPadding: EdgeInsets.symmetric(vertical: 12.0, horizontal: 16.0), 
        leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          imageUrl, // Use an image URL or asset path
          width: 50, // Set a fixed width
          height: 50, // Set a fixed height
          fit: BoxFit.cover, // Ensures the image fits inside the box
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
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (quantity > 0)
              IconButton(
                icon: Icon(Icons.remove_circle_outline, color: Colors.red),
                onPressed: () {
                  // Kurangi jumlah item
                  setState(() {
                    if (cartItems[title] == 1) {
                      cartItems.remove(title);
                    } else {
                      cartItems[title] = (cartItems[title] ?? 1) - 1;
                    }
                  });
                },
              ),
            if (quantity > 0)
              Text(
                '$quantity',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            IconButton(
              icon: Icon(Icons.add_circle_outline, color: Color(0xFF076A3B)),
              onPressed: () {
                // Tambahkan item ke keranjang
                setState(() {
                  cartItems[title] = (cartItems[title] ?? 0) + 1;
                });
              },
            ),
          ],
        ),
      ),
    );
  }
}

// Halaman Keranjang
class CartScreen extends StatelessWidget {
  final Map<String, int> cartItems;
  final ScrollController scrollController; // Tambahkan ScrollController

  const CartScreen({super.key, required this.cartItems, required this.scrollController});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white70,
        
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              margin: EdgeInsets.symmetric(vertical: 10),
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              'Keranjang',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF076A3B),
              ),
            ),
          ),
          Divider(),
          Expanded(
            child: ListView.builder(
              controller: scrollController,
              itemCount: cartItems.keys.length,
              itemBuilder: (context, index) {
                String title = cartItems.keys.elementAt(index);
                return ListTile(
                  leading: Icon(Icons.shopping_basket, color: Color(0xFF076A3B)),
                  title: Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Text(
                    'Jumlah: ${cartItems[title]}',
                    style: TextStyle(
                      color: Colors.black54,
                    ),
                  ),
                  trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
             onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => OrderScreen(cartItems: cartItems),
                ),
              );
            },

              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF076A3B),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: EdgeInsets.symmetric(vertical: 16),
              ),
              child: Center(
                child: Text(
                  'Buat Pesanan',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
