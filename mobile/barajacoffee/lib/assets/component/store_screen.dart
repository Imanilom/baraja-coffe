import 'package:barajacoffee/utils/nearest_store.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class StoreScreen extends StatefulWidget {
  final String orderType; // Tambahkan parameter ini agar bisa menerima nilai dari halaman sebelumnya

  const StoreScreen({super.key, required this.orderType});

  @override
  _StoreScreenState createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  late String selectedOrderType;
  Map<String, dynamic>? nearestStore;
  String currentAddress = "Mendeteksi lokasi...";

  @override
  void initState() {
    super.initState();
    selectedOrderType = widget.orderType; // Gunakan nilai yang diterima dari halaman sebelumnya
    getLocationAndStore();
  }

  Future<void> getLocationAndStore() async {
    Position? position = await getUserLocation();
    if (position != null) {
      Map<String, dynamic>? store = findNearestStore(position);
      setState(() {
        nearestStore = store;
        currentAddress = "Lat: ${position.latitude}, Lon: ${position.longitude}";
      });
    } else {
      setState(() {
        currentAddress = "Lokasi tidak tersedia";
      });
    }
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
      backgroundColor: Colors.grey[200],
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 40),

            // Hero Section Menampilkan Info Order dan Lokasi
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    selectedOrderType, // Pastikan order type yang dipilih ditampilkan
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    nearestStore != null
                        ? "${nearestStore!["name"]}, ${nearestStore!["distance"]?.toStringAsFixed(1)} km. Terdekat"
                        : "Mencari toko terdekat...",
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    "Lokasimu saat ini",
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    currentAddress,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Menu Categories
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16.0),
              color: Colors.white,
              child: const Text(
                'Kategori Menu',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.left,
              ),
            ),

            // List Menu (Tambahkan ListView untuk menampilkan menu)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 5, // Ganti dengan jumlah menu yang tersedia
              itemBuilder: (context, index) {
                return ListTile(
                  leading: Icon(Icons.fastfood, color: Colors.brown[700]),
                  title: Text("Menu ${index + 1}"),
                  subtitle: Text("Deskripsi singkat menu"),
                  trailing: Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                    // Navigasi ke detail menu jika perlu
                  },
                );
              },
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
