import 'package:flutter/material.dart';

class MenuDetailScreen extends StatefulWidget {
  const MenuDetailScreen({super.key});

  @override
  // ignore: library_private_types_in_public_api
  _MenuDetailScreenState createState() => _MenuDetailScreenState();
}

class _MenuDetailScreenState extends State<MenuDetailScreen> {
  int _quantity = 1;
  String _selectedCupSize = "Reg";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: Colors.black),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Gambar Produk
            Center(
              child: Image.network(
                'https://placehold.co/600x400/png',
                height: 300,
                width: 300,
                fit: BoxFit.contain,
              ),
            ),
            SizedBox(height: 20),

            // Nama Produk dan Deskripsi
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Hell Braun Coffee",
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 5),
                  Text(
                    "Deskripsi singkat produk",
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  ),
                  SizedBox(height: 20),

                  // Opsi Cupsize
                  Text(
                    "Cupsize",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 10),
                  Row(
                    children: [
                      _buildOptionButton("Reg"),
                      SizedBox(width: 10),
                      _buildOptionButton("Large"),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),

            // Harga dan Jumlah
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Harga
                  Text(
                    "Rp 25.000",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  // Jumlah
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(Icons.remove_circle_outline),
                        onPressed: () {
                          setState(() {
                            if (_quantity > 1) _quantity--;
                          });
                        },
                      ),
                      Text(
                        '$_quantity',
                        style: TextStyle(fontSize: 18),
                      ),
                      IconButton(
                        icon: Icon(Icons.add_circle_outline),
                        onPressed: () {
                          setState(() {
                            _quantity++;
                          });
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 30),

            // Tombol Tambah ke Keranjang
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF076A3B),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  minimumSize: Size(double.infinity, 50),
                ),
                onPressed: () {
                  // Tambahkan aksi untuk tambah ke keranjang
                },
                child: Text(
                  "Tambah ke keranjang",
                  style: TextStyle(fontSize: 16, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget untuk tombol opsi Cupsize
  Widget _buildOptionButton(String title) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCupSize = title;
        });
      },
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
        decoration: BoxDecoration(
          color: _selectedCupSize == title
              ? Color(0xFF076A3B)
              : Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: _selectedCupSize == title ? Colors.white : Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
