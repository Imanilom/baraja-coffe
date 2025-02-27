import 'package:barajacoffee/widgets/bottom_nav_screen.dart';
import 'package:flutter/material.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';

import 'pages/login.dart';
import 'pages/register.dart';
// Tambahkan ini

void main() {
  runApp(BarajaCoffeeApp());
}

class BarajaCoffeeApp extends StatelessWidget {
  const BarajaCoffeeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Baraja Coffee',
      theme: ThemeData(
        primaryColor: Color(0xFF076A3B),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Color(0xFF076A3B)),
            borderRadius: BorderRadius.circular(8),
          ),
          labelStyle: TextStyle(color: Color(0xFF076A3B)),
        ),
      ),
      home: SplashScreen(), // Mulai dari SplashScreen
      routes: {
        '/login': (context) => LoginScreen(),
        '/register': (context) => RegisterScreen(),
        '/main': (context) => BottomNavScreen(), // Wrapper dengan BottomNavigation
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  void _checkSession() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    bool isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

    Timer(Duration(seconds: 3), () {
      if (isLoggedIn) {
        Navigator.pushReplacementNamed(context, '/main'); // Pergi ke halaman utama
      } else {
        Navigator.pushReplacementNamed(context, '/login');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF076A3B),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('../lib/assets/images/splash.png', width: 180, height: 180),
            SizedBox(height: 20),
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
