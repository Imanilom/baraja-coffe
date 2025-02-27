import 'package:flutter/material.dart';

class StoreListScreen extends StatefulWidget {
  final String orderType;

  const StoreListScreen({super.key, required this.orderType});

  @override
  _StoreListScreenState createState() => _StoreListScreenState();
}

class _StoreListScreenState extends State<StoreListScreen> {
  late String selectedOrderType;

  @override
  void initState() {
    super.initState();
    selectedOrderType = widget.orderType;
  }

  final List<Map<String, String>> stores = [
    {
      'name': 'Baraja Coffee - Sudirman',
      'address': 'Jl. Jend Sudirman No. 10, Jakarta',
      'distance': '1.2 km',
      'hours': '08:00 - 22:00',
    },
    {
      'name': 'Baraja Coffee - Thamrin',
      'address': 'Jl. MH Thamrin No. 15, Jakarta',
      'distance': '2.5 km',
      'hours': '07:30 - 21:30',
    },
    {
      'name': 'Baraja Coffee - Senayan',
      'address': 'Jl. Asia Afrika No. 30, Jakarta',
      'distance': '3.1 km',
      'hours': '09:00 - 23:00',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
     appBar: AppBar(
        title: Text("Store"),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Icon(Icons.storefront, color: Colors.green, size: 30),
                DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: selectedOrderType,
                    icon: const Icon(Icons.keyboard_arrow_down, color: Colors.green),
                    onChanged: (String? newValue) {
                      setState(() {
                        selectedOrderType = newValue!;
                      });
                    },
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black),
                    dropdownColor: Colors.white,
                    items: ['Dine-in', 'Delivery', 'Pickup'].map<DropdownMenuItem<String>>((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 2, color: Colors.grey),
          Expanded(
            child: ListView.builder(
              itemCount: stores.length,
              itemBuilder: (context, index) {
                final store = stores[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                  child: Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      title: Text(store['name']!, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(store['address']!, style: const TextStyle(color: Colors.grey, fontSize: 14)),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.location_on, color: Colors.green, size: 16),
                                  const SizedBox(width: 4),
                                  Text(store['distance']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                                ],
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.access_time, color: Colors.green, size: 16),
                                  const SizedBox(width: 4),
                                  Text(store['hours']!, style: const TextStyle(color: Colors.green, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}