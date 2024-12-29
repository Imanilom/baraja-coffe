import 'package:flutter/material.dart';
import '../assets/component/bottom_navigation.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
     
      body: SingleChildScrollView(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Header Welcome Text
              SizedBox(height: 20),
              
              SizedBox(height: 10),

              // Banner Carousel atau Content Lainnya
              Container(
                margin: EdgeInsets.all(12.0),
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.green[100],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    'Banner Placeholder',
                    style: TextStyle(fontSize: 16, color: Colors.black54),
                  ),
                ),
              ),

              // Dummy Content Cards
              buildContentCard('Promo & Claim Voucher'),
              buildContentCard('Kemitraan Baraja Coffee'),
              buildContentCard('About Baraja Coffee'),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigation(), // Referensi komponen BottomNavigation
    );
  }

  // Reusable Card Widget
  Widget buildContentCard(String title) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        leading: Icon(Icons.local_offer, color: Color(0xFF076A3B)),
        title: Text(title),
        trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
        onTap: () {
          // Tambahkan aksi saat card ditekan
        },
      ),
    );
  }
}
