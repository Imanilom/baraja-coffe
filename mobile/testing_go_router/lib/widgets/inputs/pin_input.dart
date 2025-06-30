import 'package:kasirbaraja/widgets/keyboard/custom_keyboard.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// membuat ConsumerStatefulWidget
class PinInput extends ConsumerStatefulWidget {
  final int pinLength;
  final Function(String) onCompleted;

  const PinInput({
    super.key,
    required this.pinLength,
    required this.onCompleted,
  });

  @override
  ConsumerState<PinInput> createState() => _PinInputState();
}

class _PinInputState extends ConsumerState<PinInput> {
  // membuat variabel untuk menyimpan pin yang telah diinput
  String pin = '';
  bool isLoading = false;

  // membuat fungsi untuk memproses pin yang telah diinput
  void _addDigit(String digit) async {
    // menambahkan pin ke variabel _pin
    if (pin.length < widget.pinLength) {
      setState(() {
        pin += digit;
      });

      if (pin.length == widget.pinLength) {
        _submitPin();
      }
    }
  }

  void _submitPin() async {
    setState(() {
      isLoading = true;
    });

    await Future.delayed(
      const Duration(seconds: 2),
    ); // Simulasi loading (misalnya API request)

    bool isCorrect = await widget.onCompleted(pin);
    if (!isCorrect) {
      _resetPin();
      setState(() {
        isLoading = false;
      });
    }
  }

  void _resetPin() {
    setState(() {
      pin = "";
    });
  }

  void _deleteDigit() {
    if (pin.isNotEmpty) {
      setState(() {
        pin = pin.substring(0, pin.length - 1);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children:
                isLoading
                    ? [const CircularProgressIndicator()]
                    : List.generate(
                      widget.pinLength,
                      (index) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color:
                              index < pin.length
                                  ? Colors.grey[800]
                                  : Colors.grey,
                        ),
                      ),
                    ),
          ),
          const SizedBox(height: 32),
          // Keyboard Kustom
          CustomKeyboard(onDigitPressed: _addDigit, onDelete: _deleteDigit),
        ],
      ),
    );
  }
}
