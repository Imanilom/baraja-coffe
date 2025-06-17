import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../providers/message_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>(); // Untuk validasi form
  bool _isLoading = false;
  DateTime? lastPressed;
  bool canPop = false;

  // Menampilkan snackbar
  void _showSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 2)),
    );
  }

  // Fungsi untuk handle login
  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true; // Mulai loading
      });

      try {
        await ref
            .read(tryAuthProvider.notifier)
            .login(_usernameController.text, _passwordController.text);
      } catch (e) {
        if (mounted) {
          _showSnackBar(context, "Login failed: ${e.toString()}");
        }
      } finally {
        setState(() {
          _isLoading = false; // Selesai loading
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // final authState = ref.watch(authProvider);
    final messageNotifier = ref.watch(messageProvider);

    // Menampilkan snackbar jika state messageProvider berubah
    if (messageNotifier != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showSnackBar(context, messageNotifier);
        ref.read(messageProvider.notifier).clearMessage();
      });
    }

    return Scaffold(
      // appBar: AppBar(
      //   title: const Text("Login"),
      // ),
      body: SingleChildScrollView(
        // Untuk menghindari overflow saat keyboard muncul
        padding: const EdgeInsets.all(16.0),
        child: Card(
          margin: const EdgeInsets.all(16),
          elevation: 4,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey, // Key untuk validasi form
              child: Column(
                children: [
                  const Text(
                    "Login",
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _usernameController,
                    decoration: const InputDecoration(
                      labelText: "Username",
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return "Username tidak boleh kosong";
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _passwordController,
                    decoration: const InputDecoration(
                      labelText: "Password",
                      border: OutlineInputBorder(),
                    ),
                    obscureText: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return "Password tidak boleh kosong";
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  _isLoading
                      ? const CircularProgressIndicator() // Tampilkan loading indicator
                      : ElevatedButton(
                        onPressed:
                            _isLoading
                                ? null
                                : _handleLogin, // Non-aktifkan tombol saat loading
                        style: ElevatedButton.styleFrom(
                          backgroundColor:
                              Theme.of(context).colorScheme.primary,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 50),
                        ),
                        child: const Text("Login"),
                      ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
