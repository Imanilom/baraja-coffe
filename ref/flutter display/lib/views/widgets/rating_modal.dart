import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../controllers/display_controller.dart';
import '../../theme/app_theme.dart';

class RatingModal extends StatefulWidget {
  const RatingModal({super.key});
  @override
  State<RatingModal> createState() => _RatingModalState();
}

class _RatingModalState extends State<RatingModal> with SingleTickerProviderStateMixin {
  int _menuRating = 0;
  int _kasirRating = 0;
  final TextEditingController _commentController = TextEditingController();
  bool _submitted = false;
  late AnimationController _successAnim;

  @override
  void initState() {
    super.initState();
    _successAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
  }

  @override
  void dispose() {
    _commentController.dispose();
    _successAnim.dispose();
    super.dispose();
  }

  void _submitRating(DisplayController controller) {
    if (_menuRating == 0 || _kasirRating == 0) {
      controller.showToast(Icons.warning_amber_rounded, 'Pilih rating bintang terlebih dahulu');
      return;
    }
    setState(() => _submitted = true);
    _successAnim.forward();
    controller.showToast(Icons.star_rounded, 'Terima kasih atas penilaian Anda!');
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) controller.closeRating();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DisplayController>();
    if (!controller.isRatingOpen) return const SizedBox.shrink();

    return Material(
      color: Colors.black.withValues(alpha: 0.50),
      child: Center(
        child: Container(
          width: 460,
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppTheme.border),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1B2B20).withValues(alpha: 0.15),
                blurRadius: 40,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // ─── Header Bar ─────────────────────────────────────────────
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF2D4234), Color(0xFF1E2D23)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 42, height: 42,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF7A9E87).withValues(alpha: 0.20),
                          border: Border.all(color: const Color(0xFF7A9E87).withValues(alpha: 0.4)),
                        ),
                        child: const Icon(Icons.star_rounded, color: Color(0xFFE8C27A), size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('PENILAIAN PELANGGAN', style: AppTheme.labelFont(fontSize: 9, color: const Color(0xFFC7E0D0), letterSpacing: 2.0)),
                            const SizedBox(height: 2),
                            Text('Bagaimana pengalaman Anda?', style: AppTheme.headingFont(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => controller.closeRating(),
                        child: Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.10),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
                          ),
                          child: const Icon(Icons.close_rounded, color: Colors.white70, size: 16),
                        ),
                      ),
                    ],
                  ),
                ),

                // ─── Body ────────────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: _submitted ? _buildSuccess() : _buildForm(controller),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSuccess() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 8),
        // Large success circle
        Container(
          width: 88, height: 88,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppTheme.successBg,
            border: Border.all(color: AppTheme.successBdr, width: 2),
            boxShadow: [
              BoxShadow(
                color: AppTheme.success.withValues(alpha: 0.15),
                blurRadius: 20,
                spreadRadius: 4,
              ),
            ],
          ),
          child: const Icon(Icons.check_rounded, size: 44, color: AppTheme.success),
        ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),
        const SizedBox(height: 22),
        Text(
          'Terima Kasih!',
          style: AppTheme.headingFont(fontSize: 26, color: AppTheme.textPrimary),
        ).animate().fadeIn(delay: 200.ms),
        const SizedBox(height: 8),
        Text(
          'Penilaian Anda membantu Baraja Coffee\nterus menyajikan pengalaman terbaik.',
          textAlign: TextAlign.center,
          style: AppTheme.bodyFont(fontSize: 13, color: AppTheme.textMuted, height: 1.6),
        ).animate().fadeIn(delay: 300.ms),
        const SizedBox(height: 20),
        // Star row summary
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (i) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: Icon(
              i < _menuRating ? Icons.star_rounded : Icons.star_outline_rounded,
              size: 30,
              color: i < _menuRating ? const Color(0xFFE8C27A) : AppTheme.border,
            ),
          )),
        ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildForm(DisplayController controller) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _ratingRow('☕ Kualitas Menu & Minuman', _menuRating, (r) => setState(() => _menuRating = r)),
        const SizedBox(height: 12),
        _ratingRow('😊 Keramahan & Pelayanan', _kasirRating, (r) => setState(() => _kasirRating = r)),
        const SizedBox(height: 18),

        Text('Komentar (opsional)', style: AppTheme.labelFont(fontSize: 10, color: AppTheme.textMuted, letterSpacing: 1.0)),
        const SizedBox(height: 8),
        TextField(
          controller: _commentController,
          maxLines: 3,
          style: AppTheme.bodyFont(fontSize: 13, color: AppTheme.textPrimary),
          decoration: const InputDecoration(
            hintText: 'Ceritakan pengalaman menarik Anda...',
          ),
        ),
        const SizedBox(height: 20),

        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => controller.closeRating(),
                child: const Text('Lewati'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: () => _submitRating(controller),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.espresso,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                icon: const Icon(Icons.send_rounded, size: 16),
                label: const Text('Kirim Ulasan'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _ratingRow(String label, int current, void Function(int) onSelect) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: current > 0 ? AppTheme.borderHi : AppTheme.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: AppTheme.bodyFont(fontSize: 13, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
            ),
          ),
          Row(
            children: List.generate(5, (i) {
              final filled = i < current;
              return GestureDetector(
                onTap: () => onSelect(i + 1),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: Icon(
                    filled ? Icons.star_rounded : Icons.star_outline_rounded,
                    size: 34,
                    color: filled ? const Color(0xFFE8C27A) : AppTheme.textMuted,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
