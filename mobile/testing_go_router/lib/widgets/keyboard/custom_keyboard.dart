import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CustomKeyboard extends ConsumerWidget {
  final Function(String) onDigitPressed;
  final VoidCallback onDelete;

  const CustomKeyboard({
    super.key,
    required this.onDigitPressed,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 10,
        childAspectRatio: 1.5,
      ),
      itemCount: 12,
      itemBuilder: (context, index) {
        if (index == 9) {
          return _buildCancelButton(ref);
        } else if (index == 10) {
          return _buildButton('0');
        } else if (index == 11) {
          return _buildDeleteButton();
        } else {
          return _buildButton((index + 1).toString());
        }
      },
    );
  }

  //button cancle
  Widget _buildCancelButton(WidgetRef ref) {
    return GestureDetector(
      onTap: () => ref.read(selectedCashierProvider.notifier).state = null,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.grey[200],
          boxShadow: [
            BoxShadow(
              color: Colors.grey[400]!,
              offset: const Offset(0, 2),
              blurRadius: 2,
            ),
          ],
          shape: BoxShape.circle,
        ),
        child: const Text('C'),
      ),
    );
  }

  Widget _buildButton(String digit) {
    return GestureDetector(
      onTap: () => onDigitPressed(digit),
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.grey[400]!,
              offset: const Offset(0, 2),
              blurRadius: 2,
            ),
          ],
          shape: BoxShape.circle,
        ),
        child: Text(
          digit,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildDeleteButton() {
    return GestureDetector(
      onTap: onDelete,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.red[300],
          boxShadow: [
            BoxShadow(
              color: Colors.grey[400]!,
              offset: const Offset(0, 2),
              blurRadius: 2,
            ),
          ],
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.backspace, size: 24, color: Colors.white),
      ),
    );
  }
}
