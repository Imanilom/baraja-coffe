import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../controllers/display_controller.dart';
import '../../theme/app_theme.dart';

class SpinWheelModal extends StatefulWidget {
  const SpinWheelModal({super.key});
  @override
  State<SpinWheelModal> createState() => _SpinWheelModalState();
}

class _SpinWheelModalState extends State<SpinWheelModal> with TickerProviderStateMixin {
  bool _isSpinning = false;
  bool _spinDone = false;
  String? _resultMessage;
  String? _resultEmoji;
  bool _isWin = false;
  late AnimationController _pulseCtrl;
  late AnimationController _spinAnimCtrl;

  final List<Map<String, String>> _prizes = [
    {'emoji': '☕', 'label': 'Gratis 1 Cup Kopi Susu Baraja'},
    {'emoji': '🥐', 'label': 'Diskon 20% Pastry / Croissant'},
    {'emoji': '🎁', 'label': 'Merchandise Exclusive Pin Baraja'},
    {'emoji': '😅', 'label': 'Belum Beruntung'},
    {'emoji': '🎫', 'label': 'Voucher Cashback Rp 25.000'},
    {'emoji': '🍰', 'label': 'Gratis Slice Cake of The Day'},
  ];

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);
    _spinAnimCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 3200));
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _spinAnimCtrl.dispose();
    super.dispose();
  }

  void _spin(DisplayController controller) {
    if (_isSpinning || _spinDone) return;
    setState(() { _isSpinning = true; _resultMessage = null; });
    _spinAnimCtrl.forward(from: 0);

    final winIndex = Random().nextInt(_prizes.length);
    Future.delayed(const Duration(milliseconds: 3200), () {
      if (!mounted) return;
      final prize = _prizes[winIndex];
      final isWin = prize['label'] != 'Belum Beruntung';
      setState(() {
        _isSpinning = false;
        _spinDone = true;
        _isWin = isWin;
        _resultEmoji = prize['emoji'];
        _resultMessage = isWin ? prize['label'] : 'Coba lagi di transaksi berikutnya! 💪';
      });
      if (isWin) controller.showToast(Icons.card_giftcard_rounded, 'Hadiah: ${prize['label']}');
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DisplayController>();
    if (!controller.isSpinOpen) return const SizedBox.shrink();

    return Material(
      color: Colors.black.withValues(alpha: 0.60),
      child: Center(
        child: Container(
          width: 480,
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppTheme.border),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6B21A8).withValues(alpha: 0.20),
                blurRadius: 40,
                spreadRadius: 4,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // ─── Header ────────────────────────────────────────────────
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF6B21A8), Color(0xFF4C1D95)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.15),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.30)),
                        ),
                        child: const Icon(Icons.casino_rounded, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('LUCKY REWARD', style: AppTheme.labelFont(fontSize: 9, color: Colors.white70, letterSpacing: 2.0)),
                            const SizedBox(height: 2),
                            Text('Baraja Lucky Spin 🎉', style: AppTheme.headingFont(fontSize: 17, color: Colors.white, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => controller.closeSpin(),
                        child: Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.15),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                          ),
                          child: const Icon(Icons.close_rounded, color: Colors.white70, size: 16),
                        ),
                      ),
                    ],
                  ),
                ),

                // ─── Body ─────────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Subtitle
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3E8FF),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFD0B8F8)),
                        ),
                        child: Text(
                          '🎁  Apresiasi min. transaksi Rp 500.000 · Satu kali per transaksi',
                          style: AppTheme.bodyFont(fontSize: 11, color: const Color(0xFF6B3FB5), fontWeight: FontWeight.w600),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // ── Prize List (before spin) ───────────────────────────
                      if (!_spinDone && !_isSpinning)
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _prizes.asMap().entries.map((entry) {
                            final i = entry.key;
                            final p = entry.value;
                            final isBad = p['label'] == 'Belum Beruntung';
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                              decoration: BoxDecoration(
                                color: isBad ? AppTheme.surface : const Color(0xFFF3E8FF),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: isBad ? AppTheme.border : const Color(0xFFD0B8F8)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(p['emoji']!, style: const TextStyle(fontSize: 16)),
                                  const SizedBox(width: 8),
                                  Text(p['label']!, style: AppTheme.bodyFont(fontSize: 12, color: isBad ? AppTheme.textMuted : const Color(0xFF4C1D95), fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ).animate().fadeIn(duration: 300.ms, delay: Duration(milliseconds: 60 * i));
                          }).toList(),
                        ),

                      // ── Spinning animation ──────────────────────────────────
                      if (_isSpinning)
                        AnimatedBuilder(
                          animation: _spinAnimCtrl,
                          builder: (_, _) {
                            final idx = (_spinAnimCtrl.value * _prizes.length * 8).floor() % _prizes.length;
                            final p = _prizes[idx];
                            return Container(
                              width: double.infinity,
                              height: 120,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF6B21A8), Color(0xFF4C1D95)],
                                ),
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF6B21A8).withValues(alpha: 0.3),
                                    blurRadius: 20,
                                  ),
                                ],
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(p['emoji']!, style: const TextStyle(fontSize: 38)),
                                  const SizedBox(height: 6),
                                  Text(p['label']!, style: AppTheme.bodyFont(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white), textAlign: TextAlign.center),
                                ],
                              ),
                            );
                          },
                        ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 800.ms, color: Colors.white.withValues(alpha: 0.2)),

                      // ── Result ──────────────────────────────────────────────
                      if (_spinDone)
                        AnimatedBuilder(
                          animation: _pulseCtrl,
                          builder: (_, _) => Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              gradient: _isWin
                                  ? const LinearGradient(colors: [Color(0xFF6B21A8), Color(0xFF4C1D95)])
                                  : null,
                              color: _isWin ? null : AppTheme.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: _isWin
                                    ? const Color(0xFF9B59B6).withValues(alpha: 0.5 + 0.4 * _pulseCtrl.value)
                                    : AppTheme.border,
                                width: _isWin ? 2.0 : 1.0,
                              ),
                              boxShadow: _isWin ? [
                                BoxShadow(
                                  color: const Color(0xFF6B21A8).withValues(alpha: 0.25 + 0.1 * _pulseCtrl.value),
                                  blurRadius: 20,
                                  spreadRadius: 2,
                                ),
                              ] : null,
                            ),
                            child: Column(
                              children: [
                                if (_isWin) ...[
                                  Text(_resultEmoji ?? '🎉', style: const TextStyle(fontSize: 48)).animate().scale(duration: 600.ms, curve: Curves.elasticOut),
                                  const SizedBox(height: 10),
                                  Text('SELAMAT! 🎊', style: AppTheme.labelFont(fontSize: 12, color: Colors.white70, letterSpacing: 2.0)),
                                  const SizedBox(height: 6),
                                  Text(
                                    _resultMessage ?? '',
                                    textAlign: TextAlign.center,
                                    style: AppTheme.headingFont(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 10),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      '📋  Tunjukkan layar ini ke kasir untuk klaim hadiah',
                                      style: AppTheme.bodyFont(fontSize: 11, color: Colors.white70),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ] else ...[
                                  const Text('😅', style: TextStyle(fontSize: 40)),
                                  const SizedBox(height: 10),
                                  Text(
                                    _resultMessage ?? '',
                                    textAlign: TextAlign.center,
                                    style: AppTheme.headingFont(fontSize: 16, color: AppTheme.textMuted),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.9, 0.9), end: const Offset(1, 1)),

                      const SizedBox(height: 20),

                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => controller.closeSpin(),
                              child: const Text('Tutup'),
                            ),
                          ),
                          if (!_spinDone) ...[
                            const SizedBox(width: 12),
                            Expanded(
                              flex: 2,
                              child: ElevatedButton.icon(
                                onPressed: _isSpinning ? null : () => _spin(controller),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF6B21A8),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                icon: const Icon(Icons.casino_rounded, size: 18),
                                label: Text(_isSpinning ? 'Memutar...' : 'Putar Sekarang!'),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
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
