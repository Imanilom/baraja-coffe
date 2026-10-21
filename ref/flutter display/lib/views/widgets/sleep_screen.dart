import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/display_controller.dart';
import '../../theme/app_theme.dart';

class SleepScreen extends StatefulWidget {
  const SleepScreen({super.key});

  @override
  State<SleepScreen> createState() => _SleepScreenState();
}

class _SleepScreenState extends State<SleepScreen> with SingleTickerProviderStateMixin {
  late Timer _timer;
  DateTime _now = DateTime.now();
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _timer.cancel();
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<DisplayController>();
    if (!c.isScreenSleeping || c.isStoreClosed) return const SizedBox.shrink();

    final timeStr = DateFormat('HH:mm').format(_now);
    final dateStr = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(_now);

    return GestureDetector(
      onTap: () => c.wakeScreenManual(),
      child: Material(
        color: const Color(0xFF070809), // Pure OLED dark obsidian
        child: Stack(
          alignment: Alignment.center,
          children: [
            // ── Background Ambient Radial Glow ────────────────────────
            AnimatedBuilder(
              animation: _pulseCtrl,
              builder: (context, child) {
                return Container(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: Alignment.center,
                      radius: 0.85 + 0.15 * _pulseCtrl.value,
                      colors: [
                        const Color(0xFFD4A853).withValues(alpha: 0.09 + 0.04 * _pulseCtrl.value),
                        const Color(0xFF1E160A).withValues(alpha: 0.03),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.45, 1.0],
                    ),
                  ),
                );
              },
            ),

            // ── Decorative Subtle Watermark ───────────────────────────
            Positioned(
              bottom: -40,
              right: -40,
              child: Opacity(
                opacity: 0.025,
                child: Icon(Icons.local_cafe_rounded, size: 380, color: const Color(0xFFD4A853)),
              ),
            ),

            // ── Main Center Content ───────────────────────────────────
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Breathing Logo Ring Avatar
                  AnimatedBuilder(
                    animation: _pulseCtrl,
                    builder: (context, child) {
                      final val = _pulseCtrl.value;
                      return Container(
                        width: 140,
                        height: 140,
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              const Color(0xFFE5C178).withValues(alpha: 0.4 + 0.3 * val),
                              const Color(0xFF9A7B38).withValues(alpha: 0.2 + 0.1 * val),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFD4A853).withValues(alpha: 0.18 + 0.12 * val),
                              blurRadius: 30 + 10 * val,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Container(
                          padding: const EdgeInsets.all(22),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFF120E09),
                          ),
                          child: Image.asset(
                            'assets/images/icon.png',
                            fit: BoxFit.contain,
                            errorBuilder: (_, _, _) => const Icon(
                              Icons.local_cafe_outlined,
                              size: 56,
                              color: Color(0xFFD4A853),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 32),

                  // Brand Tagline Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2C2214).withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFD4A853).withValues(alpha: 0.3), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFD4A853)),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'BARAJA COFFEE  ·  AMPHITHEATER',
                          style: AppTheme.labelFont(
                            color: const Color(0xFFE5C178),
                            fontSize: 11,
                            letterSpacing: 2.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Large Clock Display
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.white, Color(0xFFE0E0E0)],
                    ).createShader(bounds),
                    child: Text(
                      timeStr,
                      style: GoogleFonts.spaceMono(
                        fontSize: 110,
                        fontWeight: FontWeight.w200,
                        letterSpacing: 2.0,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Date Badge
                  Text(
                    dateStr,
                    style: GoogleFonts.manrope(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),

            // ── Touch Hint (Bottom Center) ────────────────────────────
            Positioned(
              bottom: 36,
              child: AnimatedBuilder(
                animation: _pulseCtrl,
                builder: (context, child) {
                  return Opacity(
                    opacity: 0.4 + 0.5 * _pulseCtrl.value,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.touch_app_outlined, size: 16, color: Color(0xFFD4A853)),
                        const SizedBox(width: 8),
                        Text(
                          'Sentuh layar untuk membangunkan',
                          style: GoogleFonts.manrope(
                            fontSize: 12,
                            color: Colors.white60,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // ── Top Status Bar & Actions ──────────────────────────────
            Positioned(
              top: 24,
              left: 24,
              right: 24,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFD4A853),
                        ),
                      ).animate().scale(duration: 800.ms, curve: Curves.easeInOut),
                      const SizedBox(width: 8),
                      Text(
                        'DISPLAY READY  ·  ${c.deviceId}',
                        style: AppTheme.labelFont(color: Colors.white38, fontSize: 10, letterSpacing: 1.5),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      _miniBtn(
                        icon: Icons.settings_outlined,
                        label: 'Pengaturan',
                        onTap: () => c.openSettings(),
                      ),
                      const SizedBox(width: 10),
                      _miniBtn(
                        icon: Icons.wb_sunny_outlined,
                        label: 'Bangunkan',
                        onTap: () => c.wakeScreenManual(),
                        accent: true,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniBtn({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool accent = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: accent ? const Color(0xFFD4A853).withValues(alpha: 0.6) : Colors.white24,
            width: 1,
          ),
          color: accent ? const Color(0xFF2C2214).withValues(alpha: 0.85) : Colors.black.withValues(alpha: 0.6),
          boxShadow: accent
              ? [
                  BoxShadow(
                    color: const Color(0xFFD4A853).withValues(alpha: 0.15),
                    blurRadius: 10,
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: accent ? const Color(0xFFE5C178) : Colors.white70),
            const SizedBox(width: 6),
            Text(
              label,
              style: AppTheme.bodyFont(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: accent ? const Color(0xFFE5C178) : Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
