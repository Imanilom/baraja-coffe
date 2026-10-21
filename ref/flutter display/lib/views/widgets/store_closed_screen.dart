import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/display_controller.dart';
import '../../theme/app_theme.dart';

class StoreClosedScreen extends StatefulWidget {
  const StoreClosedScreen({super.key});
  @override
  State<StoreClosedScreen> createState() => _StoreClosedScreenState();
}

class _StoreClosedScreenState extends State<StoreClosedScreen> {
  late Timer _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<DisplayController>();
    if (!c.isStoreClosed) return const SizedBox.shrink();

    final timeStr = DateFormat('HH:mm:ss').format(_now);
    final dateStr = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(_now);

    return Material(
      color: AppTheme.bg,
      child: Stack(
        children: [
          // Subtle background gradient
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0.0, -0.2),
                  radius: 1.2,
                  colors: [Color(0xFFFDF9F4), Color(0xFFEEE4D4)],
                ),
              ),
            ),
          ),

          // Faint logo watermark
          Positioned(
            bottom: -80,
            right: -80,
            child: Opacity(
              opacity: 0.03,
              child: Icon(Icons.coffee, size: 360, color: AppTheme.espresso),
            ),
          ),

          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Moon badge
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.bgCard,
                    border: Border.all(color: AppTheme.border),
                    boxShadow: AppTheme.cardShadow,
                  ),
                  child: Icon(Icons.nightlight_round, size: 36, color: AppTheme.caramel),
                ),
                const SizedBox(height: 28),

                Text('BARAJA COFFEE', style: AppTheme.labelFont(color: AppTheme.textMuted, fontSize: 11, letterSpacing: 3.0)),
                const SizedBox(height: 8),
                Text('Toko Sedang Tutup', style: AppTheme.headingFont(fontSize: 32, color: AppTheme.textPrimary)),
                const SizedBox(height: 12),
                Container(
                  width: 40, height: 2,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(colors: [AppTheme.gold, Colors.transparent]),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Jam Operasional: ${c.storeOpenHour.toString().padLeft(2, '0')}:00 — ${c.storeCloseHour.toString().padLeft(2, '0')}:00 WIB',
                  style: AppTheme.bodyFont(fontSize: 14, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 6),
                Text(
                  'Tablet akan aktif kembali pada pukul ${c.storeOpenHour.toString().padLeft(2, '0')}:00',
                  style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 48),

                // Clock
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
                  decoration: BoxDecoration(
                    color: AppTheme.bgCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.border),
                    boxShadow: AppTheme.cardShadow,
                  ),
                  child: Column(
                    children: [
                      Text(timeStr, style: AppTheme.monoFont(fontSize: 52, fontWeight: FontWeight.w300, color: AppTheme.espresso)),
                      const SizedBox(height: 4),
                      Text(dateStr, style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.textMuted)),
                    ],
                  ),
                ),

                const SizedBox(height: 32),
                GestureDetector(
                  onTap: () => c.openSettings(),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.settings_outlined, size: 14, color: AppTheme.textMuted),
                      const SizedBox(width: 6),
                      Text('Pengaturan', style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
