import 'package:flutter/material.dart';

class StoreSelectionWidget extends StatelessWidget {
  final List<String> stores;
  final Function(String) onStoreSelected;

  const StoreSelectionWidget({super.key, required this.stores, required this.onStoreSelected});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Pilih Toko Terdekat", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        DropdownButton<String>(
          hint: const Text("Pilih Toko"),
          items: stores.map((store) {
            return DropdownMenuItem<String>(
              value: store,
              child: Text(store),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) onStoreSelected(value);
          },
        ),
      ],
    );
  }
}

class UserAddressWidget extends StatelessWidget {
  final String address;

  const UserAddressWidget({super.key, required this.address});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.location_on, color: Colors.green),
      title: const Text("Alamat Pengiriman"),
      subtitle: Text(address, style: TextStyle(color: Colors.grey[700])),
    );
  }
}
