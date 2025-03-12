import 'package:flutter/material.dart';

class CustomizationOption {
  String title;
  double additionalPrice;
  bool isSelected;

  CustomizationOption({
    required this.title,
    required this.additionalPrice,
    this.isSelected = false,
  });
}

class MenuDetailScreen extends StatefulWidget {
  final String title;
  final String price;
  final String imageUrl;

  const MenuDetailScreen({
    super.key,
    required this.title,
    required this.price,
    required this.imageUrl,
  });

  @override
  State<MenuDetailScreen> createState() => _MenuDetailScreenState();
}

class _MenuDetailScreenState extends State<MenuDetailScreen> {
  final List<CustomizationOption> _customizations = [
    CustomizationOption(title: 'Extra Keju', additionalPrice: 5000),
    CustomizationOption(title: 'Tambahkan Pedas', additionalPrice: 3000),
    CustomizationOption(title: 'Ekstra Sauce', additionalPrice: 4000),
    CustomizationOption(title: 'Bawang Merah Extra', additionalPrice: 2000),
  ];

  double get _totalPrice {
    final basePrice = double.tryParse(
            widget.price.replaceAll(RegExp(r'[^0-9]'), ''))! ;
    final extras = _customizations
        .where((element) => element.isSelected)
        .fold(0.0, (sum, element) => sum + element.additionalPrice);
    return basePrice + extras;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          widget.title,
          style: const TextStyle(
            color: Colors.black,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 250,
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(15),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.3),
                    blurRadius: 8,
                    spreadRadius: 2,
                    offset: const Offset(0, 4),
                  ),
                ],
                image: DecorationImage(
                  image: NetworkImage(widget.imageUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.price,
                    style: TextStyle(
                      fontSize: 20,
                      color: Colors.green[700],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Deskripsi:',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Ini adalah deskripsi singkat dari produk ini. Anda bisa menambahkan lebih banyak informasi tentang produk di sini.',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.black54,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Card(
              margin: const EdgeInsets.all(16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              elevation: 3,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Kustomisasi',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ..._customizations.map((option) => Column(
                          children: [
                            CheckboxListTile(
                              title: Text(option.title),
                              subtitle: Text(
                                '+ Rp ${option.additionalPrice.toInt()}',
                                style: TextStyle(
                                  color: Colors.green[700],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              value: option.isSelected,
                              onChanged: (value) => setState(() {
                                option.isSelected = value ?? false;
                              }),
                              activeColor: Colors.green[700],
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            const Divider(height: 1),
                          ],
                        )),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total Harga:',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Rp ${_totalPrice.toInt()}',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.green[700],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: () {
                  final selectedOptions = _customizations
                      .where((element) => element.isSelected)
                      .map((e) => e.title)
                      .toList();
                  // Tambahkan logika untuk menangani hasil kustomisasi
                  Navigator.pop(context, {
                    'item': widget.title,
                    'customizations': selectedOptions,
                    'totalPrice': _totalPrice
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF076A3B),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 5,
                ),
                child: const Center(
                  child: Text(
                    'Tambah ke Keranjang',
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
      ),
    );
  }
}