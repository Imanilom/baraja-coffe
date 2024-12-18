import 'package:flutter/material.dart';
import 'dart:async'; // Untuk Timer
import 'package:shared_preferences/shared_preferences.dart';
import 'pages/login.dart';
import 'pages/register.dart';
import 'pages/home_screen.dart'; // Tambahkan halaman HomeScreen

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
        '/home': (context) => HomeScreen(), // Rute ke HomeScreen
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  // ignore: library_private_types_in_public_api
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkSession(); // Pengecekan session
  }

  void _checkSession() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    bool isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

    Timer(Duration(seconds: 3), () {
      if (isLoggedIn) {
        // Jika sudah login, ke halaman home
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        // Jika belum login, ke halaman login
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
            Image.asset('assets/images/splash.png', width: 150, height: 150), // Logo Splash
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
