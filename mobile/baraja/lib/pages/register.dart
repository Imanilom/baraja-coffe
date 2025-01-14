import 'package:flutter/material.dart';
import './otp_screen.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Menambahkan controller untuk input nomor handphone
    final TextEditingController phoneController = TextEditingController();
    
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 30),
                Text(
                  'Baraja Coffee',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 30),
                Text(
                  'Daftar akun',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 16),
                TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Nama Lengkap',
                    hintText: 'Masukkan nama lengkap',
                  ),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: phoneController, // Menambahkan controller untuk nomor handphone
                  decoration: InputDecoration(
                    labelText: 'Nomor Handphone',
                    hintText: 'Masukkan nomor handphone',
                    prefixText: '+62 ',
                  ),
                  keyboardType: TextInputType.phone,
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
                SizedBox(height: 16),
                TextFormField(
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Konfirmasi Kata Sandi',
                    hintText: 'Konfirmasi kata sandi',
                    suffixIcon: Icon(Icons.visibility_off),
                  ),
                ),
                SizedBox(height: 24),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF076A3B),
                    minimumSize: Size(double.infinity, 50),
                  ),
                  onPressed: () {
                    // Navigasi ke halaman OTP setelah klik daftar
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OTPPage(phoneNumber: phoneController.text),
                      ),
                    );
                  },
                  child: Text('Daftar', style: TextStyle(color: Colors.white)),
                ),
                SizedBox(height: 16),
                Center(
                  child: RichText(
                    text: TextSpan(
                      text: 'Sudah memiliki akun? ',
                      style: TextStyle(color: Colors.black),
                      children: [
                        WidgetSpan(
                          child: GestureDetector(
                            onTap: () => Navigator.pushNamed(context, '/login'),
                            child: Text(
                              'Masuk',
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
      ),
    );
  }
}
