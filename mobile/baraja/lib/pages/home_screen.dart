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
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              // Header Welcome Text
              SizedBox(height: 20),

              SizedBox(height: 10),

              // Stack to create the layered effect
              Stack(
                children: [
                  // Banner Carousel or Content
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

                  // Positioned Card over the banner
                  Positioned(
                    top: 180, // Adjust this value to place the card higher or lower
                    left: 12.0,
                    right: 12.0,
                    child: Card(
                      margin: EdgeInsets.zero,
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Greeting Text
                            Text(
                              'Hai Iman',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),

                            // Voucher Icon and Amount
                            Row(
                              children: [
                                Icon(Icons.card_giftcard, color: Colors.green),
                                SizedBox(width: 8),
                                Text('5', style: TextStyle(fontSize: 16)),
                              ],
                            ),

                            // Points Icon and Amount
                            Row(
                              children: [
                                Icon(Icons.star, color: Colors.orange),
                                SizedBox(width: 8),
                                Text('150', style: TextStyle(fontSize: 16)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              // Dummy Content Cards - Positioned after the banner
              SizedBox(height: 50), // Adjusted spacing to ensure no overlap
              
              Container(
                margin: EdgeInsets.symmetric(horizontal: 18.0),
                child: Column(
                  children: [
                    buildContentCard('Promo & Claim Voucher', 'Some additional text for Promo & Claim Voucher...'),
                    buildContentCard('Kemitraan Baraja Coffee', 'Some additional text for Kemitraan Baraja Coffee...'),
                    buildContentCard('About Baraja Coffee', 'Some additional text for About Baraja Coffee...'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigation(), // Referensi komponen BottomNavigation
    );
  }

  // Reusable Card Widget
  Widget buildContentCard(String title, String content) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      child: ExpansionTile(
        leading: Icon(Icons.local_offer, color: Color(0xFF076A3B)),
        title: Text(title),
        trailing: Icon(Icons.arrow_drop_down, size: 16, color: Colors.grey),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(content),
          ),
        ],
      ),
    );
  }
}
