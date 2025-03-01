import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'store_screen.dart';
import '../utils/nearest_store.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      backgroundColor: Colors.grey[200], // Background utama abu muda
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 40), // Padding atas

            // Banner Carousel
            CarouselSlider(
              options: CarouselOptions(
                height: 180,
                autoPlay: true,
                enlargeCenterPage: true,
                viewportFraction: 0.9,
                autoPlayInterval: const Duration(seconds: 4),
                autoPlayAnimationDuration: const Duration(milliseconds: 800),
              ),
              items: [
                '../lib/assets/images/banner.png',
                '../lib/assets/images/banner.png',
                '../lib/assets/images/banner.png',
              ].map((item) {
                return ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset(item, fit: BoxFit.cover, width: double.infinity),
                );
              }).toList(),
            ),

            // Personalisasi User Info
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Card(
                margin: const EdgeInsets.only(top: 5),
                elevation: 6,
                shadowColor: Colors.black26,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Hai, Iman!',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'Selamat datang kembali!',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          const Icon(Icons.wallet_giftcard, color: Color(0xFF076A3B)),
                          const SizedBox(width: 6),
                          const Text('5', style: TextStyle(fontSize: 16)),
                          const SizedBox(width: 16),
                          const Icon(Icons.emoji_events, color: Colors.orange),
                          const SizedBox(width: 6),
                          const Text('150', style: TextStyle(fontSize: 16)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Pesan Sekarang Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16.0),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pesan Sekarang',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),

                  // Opsi Pesan dengan Navigasi ke StoreScreen
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      buildOrderOption(context, 'Dine-in', Icons.storefront),
                      buildOrderOption(context, 'Delivery', Icons.delivery_dining),
                      buildOrderOption(context, 'Pickup', Icons.shopping_bag),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Section "Yang Menarik"
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16.0),
              color: Colors.white,
              child: const Text(
                'Yang Menarik',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.left,
              ),
            ),

            // Grid Menu Menarik
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: GridView.count(
                shrinkWrap: true,
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  buildAttractiveCard('Member Rewards', Icons.card_giftcard, 'Nikmati hadiah eksklusif'),
                  buildAttractiveCard('Baraja Club', Icons.people, 'Bergabung dengan komunitas'),
                  buildAttractiveCard('Menu Baru', Icons.coffee_maker, 'Coba menu terbaru'),
                  buildAttractiveCard('Paket Hemat', Icons.attach_money, 'Dapatkan harga spesial'),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Customer Service & Legalitas
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16.0),
              color: Colors.white,
              child: Column(
                children: [
                  const Text(
                    'Customer Service',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Hubungi kami jika ada pertanyaan atau kendala terkait layanan Baraja Coffee.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.phone),
                    label: const Text('Hubungi Kami'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF076A3B),
                      foregroundColor: Colors.white,
                    ),
                  ),
                  const Divider(height: 30, thickness: 1, color: Colors.grey),

                  // Legalitas
                  const Text(
                    'Legalitas & Kehalalan',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Produk kami telah bersertifikat halal dan memenuhi standar keamanan pangan.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    
    );
  }

  // Widget untuk opsi Pesan Sekarang dengan navigasi
  Widget buildOrderOption(BuildContext context, String title, IconData icon) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => StoreScreen(orderType: title)),
          );
        },
        child: Card(
          elevation: 3,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Icon(icon, size: 30, color: Color(0xFF076A3B)),
                const SizedBox(height: 6),
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Widget untuk menu "Yang Menarik"
  Widget buildAttractiveCard(String title, IconData icon, String subtitle) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: Color(0xFF076A3B)),
            const SizedBox(height: 2),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(subtitle, style: TextStyle(color: Colors.grey[600], fontSize: 12), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
