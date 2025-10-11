import 'package:barajacoffee/widgets/bottom_nav_screen.dart';
import 'package:flutter/material.dart';
import 'dart:async';
import 'package:hive_flutter/hive_flutter.dart';
import 'pages/login.dart';
import 'pages/register.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter(); // Inisialisasi Hive
  await Hive.openBox('session'); // Membuka box untuk menyimpan sesi login

  runApp(const BarajaCoffeeApp());
}

class BarajaCoffeeApp extends StatelessWidget {
  const BarajaCoffeeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Baraja Coffee',
      theme: ThemeData(
        primaryColor: const Color(0xFF076A3B),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: const BorderSide(color: Color(0xFF076A3B)),
            borderRadius: BorderRadius.circular(8),
          ),
          labelStyle: const TextStyle(color: Color(0xFF076A3B)),
        ),
      ),
      home: const SplashScreen(), // Mulai dari SplashScreen
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/main': (context) => const BottomNavScreen(), // Wrapper dengan BottomNavigation
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
    var box = Hive.box('session');
    bool isLoggedIn = box.get('isLoggedIn', defaultValue: false);

    Timer(const Duration(seconds: 3), () {
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
      backgroundColor: const Color(0xFF076A3B),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('../lib/assets/images/splash.png', width: 180, height: 180),
            const SizedBox(height: 20),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
