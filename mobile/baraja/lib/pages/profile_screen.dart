import 'package:baraja/widgets/level_widget.dart';
import 'package:baraja/widgets/voucher_screen.dart';
import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    int userPoints = 150; // Ambil data points dari backend atau state management

    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header Profil
            Container(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Column(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundImage: AssetImage('../lib/assets/images/logo.png'),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: CircleAvatar(
                          backgroundColor: Colors.white,
                          child: Icon(Icons.camera_alt, color: Colors.green[700]),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 10),
                  Text(
                    "Iman Baraja",
                    style: TextStyle(color: Colors.black, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  Text("iman.baraja@example.com", style: TextStyle(color: Colors.black)),
                ],
              ),
            ),
            SizedBox(height: 20),

            // Statistik Pengguna dengan Navigasi ke Voucher dan Points
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => VoucherScreen()),
                      );
                    },
                    child: buildStatCard("Voucher", "5", Icons.card_giftcard, Colors.blue),
                  ),
                  GestureDetector(
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        builder: (context) => Padding(
                          padding: EdgeInsets.all(16.0),
                          child: LevelWidget(points: userPoints),
                        ),
                      );
                    },
                    child: buildStatCard("Points", userPoints.toString(), Icons.star, Colors.orange),
                  ),
                  buildStatCard("Transaction", "3", Icons.shopping_cart, Colors.red),
                ],
              ),
            ),

            SizedBox(height: 20),

            // Informasi Tambahan
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                children: [
                  buildInfoTile("Edit Profile", Icons.edit, () {}),
                  buildInfoTile("Change Password", Icons.lock, () {}),
                  buildInfoTile("Payment Methods", Icons.credit_card, () {}),
                  buildInfoTile("Settings", Icons.settings, () {}),
                  buildInfoTile("Help & Support", Icons.help, () {}),
                ],
              ),
            ),

            SizedBox(height: 20),

            // Tombol Logout
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: Colors.redAccent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () {},
                  child: Text("Logout", style: TextStyle(fontSize: 16, color: Colors.white)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget Kartu Statistik
  Widget buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: 100,
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 30),
            SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Text(title, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
          ],
        ),
      ),
    );
  }
    // Widget List Tile
  Widget buildInfoTile(String title, IconData icon, VoidCallback onTap) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Icon(icon, color: Colors.green[700]),
        title: Text(title, style: TextStyle(fontSize: 16)),
        trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }
}
