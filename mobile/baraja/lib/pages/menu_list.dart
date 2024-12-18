import 'package:flutter/material.dart';

class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});

  @override
  // ignore: library_private_types_in_public_api
  _MenuScreenState createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

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
          SizedBox(height: 8.0),

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
                buildMenuItem(
                  'Hell Braun Coffee',
                  'Rp 25.000',
                  'assets/images/hell_braun_coffee.png',
                ),
                buildMenuItem(
                  'Dunkel Braun Coffee',
                  'Rp 28.000',
                  'assets/images/dunkel_braun_coffee.png',
                ),
                buildMenuItem(
                  'Latte Coffee',
                  'Rp 30.000',
                  'assets/images/latte_coffee.png',
                ),
                buildMenuItem(
                  'Irish Coffee',
                  'Rp 35.000',
                  'assets/images/irish_coffee.png',
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: Color(0xFF076A3B),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.shopping_cart), label: 'Order'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
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
              image: AssetImage(imagePath),
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
          // Tambahkan aksi untuk add item
        },
      ),
    );
  }
}
