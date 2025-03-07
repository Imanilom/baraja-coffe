import 'package:barajacoffee/pages/order_screen.dart';
import 'package:barajacoffee/widgets/MenuDetailScreen.dart';
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
        title: const Text("Menu"),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          // Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: TabBar(
              controller: _tabController,
              indicatorColor: const Color(0xFF076A3B),
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.black,
              indicator: BoxDecoration(
                color: const Color(0xFF076A3B),
                borderRadius: BorderRadius.circular(8.0),
              ),
              tabs: const [
                Tab(text: 'Dine in'),
                Tab(text: 'Pickup'),
                Tab(text: 'Delivery'),
              ],
            ),
          ),
          const SizedBox(height: 8.0, width: 10),

          const ListTile(
            leading: Icon(Icons.location_on, color: Colors.grey),
            title: Text(
              "Baraja Amphitheater, Tuparev",
              style: TextStyle(fontSize: 14, color: Colors.black87),
            ),
            trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ),
          const Divider(),

          DefaultTabController(
            length: 3,
            child: TabBar(
              indicatorColor: const Color(0xFF076A3B),
              labelColor: Colors.white,
              indicatorSize: TabBarIndicatorSize.tab,
              unselectedLabelColor: Colors.black,
              indicator: BoxDecoration(
                color: const Color(0xFF076A3B),
                borderRadius: BorderRadius.circular(8.0),
              ),
              tabs: const [
                Tab(text: 'Coffee'),
                Tab(text: 'Non Coffee'),
                Tab(text: 'Food'),
              ],
            ),
          ),
          const SizedBox(height: 10),

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
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Keranjang (${cartItems.values.reduce((a, b) => a + b)})',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
               ElevatedButton(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      shape: const RoundedRectangleBorder(
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
                  child: const Text('Lihat Keranjang'),
                ),

                ],
              ),
            ),
        ],
      ),
    );
  }

  // Widget untuk menu item
// Widget untuk menu item
Widget buildMenuItem(String title, String price, String imageUrl) {
  int quantity = cartItems[title] ?? 0; // Jumlah item dalam keranjang

  return Card(
    margin: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    elevation: 2,
    child: InkWell(
    onTap: () async {
      // Navigasi ke halaman detail menu dan tangkap hasilnya
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => MenuDetailScreen(
            title: title,
            price: price,
            imageUrl: imageUrl,
          ),
        ),
      );

      if (result != null) {
        // Perbarui keranjang jika ada item yang ditambahkan
        setState(() {
          cartItems[result] = (cartItems[result] ?? 0) + 1;
        });
      }
    },
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 16.0),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            imageUrl, // Gunakan URL gambar atau jalur aset
            width: 50, // Tetapkan lebar tetap
            height: 50, // Tetapkan tinggi tetap
            fit: BoxFit.cover, // Memastikan gambar masuk ke dalam kotak
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          price,
          style: const TextStyle(fontSize: 14, color: Colors.black54),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (quantity > 0)
              IconButton(
                icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
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
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            IconButton(
              icon: const Icon(Icons.add_circle_outline, color: Color(0xFF076A3B)),
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
      decoration: const BoxDecoration(
        color: Colors.white70,
        
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 10),
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Text(
              'Keranjang',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF076A3B),
              ),
            ),
          ),
          const Divider(),
          Expanded(
            child: ListView.builder(
              controller: scrollController,
              itemCount: cartItems.keys.length,
              itemBuilder: (context, index) {
                String title = cartItems.keys.elementAt(index);
                return ListTile(
                  leading: const Icon(Icons.shopping_basket, color: Color(0xFF076A3B)),
                  title: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Text(
                    'Jumlah: ${cartItems[title]}',
                    style: const TextStyle(
                      color: Colors.black54,
                    ),
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
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
                backgroundColor: const Color(0xFF076A3B),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Center(
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
