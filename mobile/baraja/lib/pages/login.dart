import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Add the image above the "Baraja Coffee" text
              Center(
                child: Image.asset(
                  '../lib/assets/images/logo.png', // Update with your image path
                  width: 180, // Adjust size as needed
                  height: 180, // Adjust size as needed
                ),
              ),
          
              SizedBox(height: 16),
              TextFormField(
                decoration: InputDecoration(
                  labelText: 'Username',
                  hintText: 'Masukkan username',
                ),
              ),
              SizedBox(height: 16),
              TextFormField(
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Kata Sandi',
                  hintText: 'Masukkan kata sandi',
                  suffixIcon: Icon(Icons.visibility_off),
                ),
              ),
              SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  'Lupa kata sandi?',
                  style: TextStyle(color: Colors.grey.shade700),
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF076A3B),
                  minimumSize: Size(double.infinity, 50),
                ),
                onPressed: () {},
                child: Text('Masuk', style: TextStyle(color: Colors.white)),
              ),
              SizedBox(height: 24),
              Center(
                child: RichText(
                  text: TextSpan(
                    text: 'Belum memiliki akun? ',
                    style: TextStyle(color: Colors.black),
                    children: [
                      WidgetSpan(
                        child: GestureDetector(
                          onTap: () => Navigator.pushNamed(context, '/register'),
                          child: Text(
                            'Daftar',
                            style: TextStyle(
                              color: Color(0xFF076A3B),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
