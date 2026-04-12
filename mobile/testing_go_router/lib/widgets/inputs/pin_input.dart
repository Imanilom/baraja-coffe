import 'package:kasirbaraja/widgets/keyboard/custom_keyboard.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ModernPinInput extends ConsumerStatefulWidget {
  final int pinLength;
  final Future<bool> Function(String) onCompleted;

  const ModernPinInput({
    super.key,
    required this.pinLength,
    required this.onCompleted,
  });

  @override
  ConsumerState<ModernPinInput> createState() => _ModernPinInputState();
}

class _ModernPinInputState extends ConsumerState<ModernPinInput>
    with TickerProviderStateMixin {
  String pin = '';
  bool isLoading = false;
  late AnimationController _shakeController;
  late AnimationController _pulseController;
  late Animation<double> _shakeAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _shakeAnimation = Tween<double>(begin: 0.0, end: 10.0).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.elasticIn),
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _shakeController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _addDigit(String digit) async {
    if (pin.length < widget.pinLength) {
      setState(() {
        pin += digit;
      });

      _pulseController.forward().then((_) => _pulseController.reverse());

      if (pin.length == widget.pinLength) {
        _submitPin();
      }
    }
  }

  Future<void> _submitPin() async {
    setState(() {
      isLoading = true;
    });

    await Future.delayed(const Duration(milliseconds: 500));
    bool isCorrect = await widget.onCompleted(pin);

    if (!isCorrect) {
      _resetPin();
      _shakeController.forward().then((_) => _shakeController.reverse());
    }

    setState(() {
      isLoading = false;
    });
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
    return LayoutBuilder(
      builder: (context, constraints) {
        final isSmallScreen = constraints.maxWidth < 400;
        final pinDotSize = isSmallScreen ? 16.0 : 20.0;
        final spacing = isSmallScreen ? 12.0 : 16.0;

        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // PIN Dots with animation
            AnimatedBuilder(
              animation: _shakeAnimation,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(_shakeAnimation.value, 0),
                  child: AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _pulseAnimation.value,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 16,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children:
                                isLoading
                                    ? [
                                      SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor:
                                              AlwaysStoppedAnimation<Color>(
                                                Colors.blue[600]!,
                                              ),
                                        ),
                                      ),
                                    ]
                                    : List.generate(
                                      widget.pinLength,
                                      (index) => Container(
                                        margin: EdgeInsets.symmetric(
                                          horizontal: spacing / 2,
                                        ),
                                        width: pinDotSize,
                                        height: pinDotSize,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color:
                                              index < pin.length
                                                  ? Colors.blue[600]
                                                  : Colors.grey[300],
                                          boxShadow:
                                              index < pin.length
                                                  ? [
                                                    BoxShadow(
                                                      color: Colors.blue
                                                          .withValues(
                                                            alpha: 0.3,
                                                          ),
                                                      blurRadius: 6,
                                                      offset: const Offset(
                                                        0,
                                                        2,
                                                      ),
                                                    ),
                                                  ]
                                                  : null,
                                        ),
                                      ),
                                    ),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),

            SizedBox(height: isSmallScreen ? 24 : 32),

            // Custom Keyboard
            ModernCustomKeyboard(
              onDigitPressed: _addDigit,
              onDelete: _deleteDigit,
              constraints: constraints,
            ),
          ],
        );
      },
    );
  }
}
