import 'package:flutter/material.dart';

class OTPPage extends StatefulWidget {
  final String phoneNumber; // Nomor telepon yang didaftarkan

  const OTPPage({super.key, required this.phoneNumber, required Map<String, String> userData});

  @override
  _OTPPageState createState() => _OTPPageState();
}

class _OTPPageState extends State<OTPPage> {
  final TextEditingController _otpController = TextEditingController();
  List<String> otp = ['', '', '', '']; // Menyimpan OTP sebagai list (4 digit)

  void _verifyOTP() {
    String otpString = otp.join('');
    if (otpString == "123456") { // Misalnya OTP yang benar adalah 123456
      // Verifikasi berhasil, lanjutkan ke halaman utama atau dashboard
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      // Jika OTP salah
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('OTP salah!')),
      );
    }
  }

  Widget buildOTPField(int index) {
  return SizedBox(
    width: 60,
    child: TextField(
      controller: TextEditingController(text: otp[index]),
      onChanged: (value) {
        if (value.isNotEmpty) {
          // Hanya menerima angka
          if (RegExp(r'^[0-9]$').hasMatch(value)) {
            otp[index] = value;
            if (index < 3) {
              FocusScope.of(context).nextFocus();
            }
            setState(() {});
          }
        } else if (value.isEmpty) {
          otp[index] = '';
          if (index > 0) {
            FocusScope.of(context).previousFocus();
          }
          setState(() {});
        }
      },
      textInputAction: TextInputAction.next,
      maxLength: 1,
      keyboardType: TextInputType.numberWithOptions(signed: false, decimal: false), // Hanya angka
      decoration: InputDecoration(
        counterText: '',
        border: OutlineInputBorder(),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Color(0xFF076A3B)),
        ),
      ),
      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
      textAlign: TextAlign.center, // Memastikan angka di tengah
    ),
  );
}


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                 Center(
                  child: Image.asset(
                    '../lib/assets/images/logo.png', // Update with your image path
                    width: 180, // Adjust size as needed
                    height: 180, // Adjust size as needed
                  ),
                ),
               
                SizedBox(height: 30),
                Text(
                  'Verifikasi OTP',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 16),
                Text(
                  'Masukkan kode OTP yang dikirim ke +62 ${widget.phoneNumber}',
                  style: TextStyle(fontSize: 16),
                ),
                SizedBox(height: 30),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(4, (index) => buildOTPField(index)),
                ),
                SizedBox(height: 24),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF076A3B),
                    minimumSize: Size(double.infinity, 50),
                  ),
                  onPressed: _verifyOTP,
                  child: Text('Verifikasi OTP', style: TextStyle(color: Colors.white)),
                ),
                SizedBox(height: 16),
                Center(
                  child: RichText(
                    text: TextSpan(
                      text: 'Tidak menerima kode? ',
                      style: TextStyle(color: Colors.black),
                      children: [
                        WidgetSpan(
                          child: GestureDetector(
                            onTap: () {
                              // Resend OTP logic
                            },
                            child: Text(
                              'Kirim ulang',
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
