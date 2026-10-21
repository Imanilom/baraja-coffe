import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../controllers/display_controller.dart';
import '../theme/app_theme.dart';
import 'widgets/header_bar.dart';
import 'widgets/promo_slider.dart';
import 'widgets/order_panel.dart';
import 'widgets/qris_modal.dart';
import 'widgets/receipt_modal.dart';
import 'widgets/rating_modal.dart';
import 'widgets/spin_wheel_modal.dart';
import 'widgets/sleep_screen.dart';
import 'widgets/store_closed_screen.dart';
import 'settings_dialog.dart';

class CustomerDisplayScreen extends StatelessWidget {
  const CustomerDisplayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DisplayController>();

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: Stack(
        children: [
          // ── Premium Dark Sage Green Background ─────────────────────────
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(-0.6, -0.7),
                  radius: 1.6,
                  colors: [
                    Color(0xFFF4F8F5),
                    Color(0xFFDDE8E1),
                    Color(0xFFCDD9D2),
                  ],
                  stops: [0.0, 0.55, 1.0],
                ),
              ),
            ),
          ),
          // Subtle vignette overlay
          Positioned.fill(
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment.center,
                    radius: 1.2,
                    colors: [
                      Colors.transparent,
                      const Color(0xFF1E2D23).withValues(alpha: 0.04),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Main Layout ──────────────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Sisi Kiri: HeaderBar di atas + PromoSlider di bawahnya
                  const Expanded(
                    flex: 14,
                    child: Column(
                      children: [
                        HeaderBar(),
                        SizedBox(height: 14),
                        Expanded(child: PromoSlider()),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),
                  // Sisi Kanan: OrderPanel memenuhi seluruh tinggi layar dari paling atas
                  const Expanded(
                    flex: 10,
                    child: OrderPanel(),
                  ),
                ],
              ),
            ),
          ),

          // ── Offline Network Banner (Feature 3) ───────────────────
          if (!controller.isNetworkConnected)
            Positioned(
              top: 0, left: 0, right: 0,
              child: Material(
                color: Colors.transparent,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                  decoration: const BoxDecoration(
                    color: Color(0xFFB91C1C),
                    boxShadow: [
                      BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 2)),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 13, height: 13,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '📡 Koneksi server terputus — Menghubungkan ulang secara otomatis...',
                        style: AppTheme.bodyFont(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // ── Toast ────────────────────────────────────────────────
          if (controller.toastMessage != null)
            Positioned(
              bottom: 28, left: 0, right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
                  decoration: BoxDecoration(
                    color: AppTheme.bgCard,
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: AppTheme.border),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF8B5E3C).withValues(alpha: 0.15),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (controller.toastIcon is IconData)
                        Icon(controller.toastIcon as IconData, size: 18, color: AppTheme.caramel)
                      else if (controller.toastIcon is String)
                        Text(controller.toastIcon as String, style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 10),
                      Text(
                        controller.toastMessage!,
                        style: AppTheme.bodyFont(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // ── Modals ───────────────────────────────────────────────
          const QrisModal(),
          const ReceiptModal(),
          const RatingModal(),
          const SpinWheelModal(),
          const SettingsDialog(),

          // ── Sleep Overlays ───────────────────────────────────────
          const SleepScreen(),
          const StoreClosedScreen(),
        ],
      ),
    );
  }
}
