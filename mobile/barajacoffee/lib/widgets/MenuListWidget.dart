import 'package:flutter/material.dart';

class MenuListWidget extends StatelessWidget {
  final List<Map<String, dynamic>> menus;
  final Function(Map<String, dynamic>) onMenuSelected;

  const MenuListWidget({super.key, required this.menus, required this.onMenuSelected});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: menus.map((menu) {
        return ListTile(
          leading: Image.asset(menu['image'], width: 50, height: 50, fit: BoxFit.cover),
          title: Text(menu['name'], style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          subtitle: Text("Rp ${menu['price']}", style: TextStyle(color: Colors.grey[700])),
          trailing: Icon(Icons.add_shopping_cart, color: Colors.green),
          onTap: () => onMenuSelected(menu),
        );
      }).toList(),
    );
  }
}
