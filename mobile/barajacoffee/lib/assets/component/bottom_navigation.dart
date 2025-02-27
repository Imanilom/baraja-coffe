import 'package:flutter/material.dart';

class BottomNavigation extends StatefulWidget {
  const BottomNavigation({super.key});

  @override
  _BottomNavigationState createState() => _BottomNavigationState();
}

class _BottomNavigationState extends State<BottomNavigation> {
  int _currentIndex = 0; // Indeks awal

  // Daftar rute tujuan berdasarkan indeks
  final List<String> _routes = ['/home', '/menu', '/history', '/profile'];

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      selectedItemColor: Color(0xFF076A3B),
      unselectedItemColor: Colors.grey,
      currentIndex: _currentIndex, // Indeks tab aktif
      onTap: (index) {
        setState(() {
          _currentIndex = index; // Perbarui indeks tab aktif
        });
        Navigator.pushNamed(context, _routes[index]); // Navigasi ke halaman tujuan
      },
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.shopping_cart),
          label: 'Order',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.history),
          label: 'History',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: 'Profile',
        ),
      ],
    );
  }
}
