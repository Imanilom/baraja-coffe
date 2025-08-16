import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ModernCustomKeyboard extends ConsumerWidget {
  final Function(String) onDigitPressed;
  final VoidCallback onDelete;
  final BoxConstraints constraints;

  const ModernCustomKeyboard({
    super.key,
    required this.onDigitPressed,
    required this.onDelete,
    required this.constraints,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSmallScreen = constraints.maxWidth < 400;
    final buttonSize = isSmallScreen ? 60.0 : 70.0;
    final fontSize = isSmallScreen ? 18.0 : 24.0;
    final digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: isSmallScreen ? 12 : 16,
        crossAxisSpacing: isSmallScreen ? 12 : 16,
        childAspectRatio: 1.9,
      ),

      itemCount: 12,

      itemBuilder: (context, index) {
        if (index < 9) {
          return _buildNumberButton(digits[index], buttonSize, fontSize);
        } else if (index == 9) {
          return _buildCancelButton(ref, buttonSize, fontSize);
        } else if (index == 10) {
          return _buildNumberButton('0', buttonSize, fontSize);
        } else if (index == 11) {
          return _buildDeleteButton(buttonSize, fontSize);
        } else {
          return const SizedBox.shrink();
        }
      },
    );
  }

  Widget _buildCancelButton(WidgetRef ref, double size, double fontSize) {
    print('Cancel button pressed');
    return _buildButton(
      onTap: () => ref.read(selectedCashierProvider.notifier).state = null,
      child: Icon(Icons.close_rounded, size: fontSize, color: Colors.white),
      backgroundColor: const Color(0xFFEF4444),
      shadowColor: const Color(0xFFEF4444).withOpacity(0.3),
    );
  }

  Widget _buildNumberButton(String digit, double size, double fontSize) {
    // print('Digit: $digit');
    return _buildButton(
      onTap: () {
        print('Pressed digit: $digit');
        onDigitPressed(digit);
      },
      child: Text(
        digit,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: Colors.black,
        ),
      ),
      backgroundColor: Colors.white.withOpacity(0.1),
      shadowColor: Colors.white.withOpacity(0.1),
    );
  }

  Widget _buildDeleteButton(double size, double fontSize) {
    print('Delete button pressed');
    return _buildButton(
      onTap: onDelete,
      child: Icon(
        Icons.backspace_rounded,
        size: fontSize * 0.8,
        color: Colors.white,
      ),
      backgroundColor: const Color(0xFFF59E0B),
      shadowColor: const Color(0xFFF59E0B).withOpacity(0.3),
    );
  }

  Widget _buildButton({
    required VoidCallback onTap,
    required Widget child,
    required Color backgroundColor,
    required Color shadowColor,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey, width: 1),
            boxShadow: [
              BoxShadow(
                color: shadowColor,
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
              BoxShadow(
                color: Colors.white.withOpacity(0.1),
                blurRadius: 1,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Center(child: child),
        ),
      ),
    );
  }
}
