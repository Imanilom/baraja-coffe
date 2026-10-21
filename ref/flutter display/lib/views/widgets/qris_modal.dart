import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../controllers/display_controller.dart';
import '../../theme/app_theme.dart';

class QrisModal extends StatelessWidget {
  const QrisModal({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DisplayController>();
    final state = controller.state;

    // Tampilkan modal jika ada QRIS Image URL dan status dalam tahap Pembayaran (status == 1)
    if (state.qrisImageUrl == null || state.status != 1) {
      return const SizedBox.shrink();
    }

    final qrUrl = state.qrisImageUrl!;

    return Material(
      color: Colors.black.withValues(alpha: 0.65),
      child: Center(
        child: Container(
          width: 440,
          margin: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF2C1810), Color(0xFF190C05)],
            ),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: const Color(0xFFD32F2F).withValues(alpha: 0.5),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.red.withValues(alpha: 0.25),
                blurRadius: 36,
                offset: const Offset(0, 10),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ─── Header Strip ───────────────────────────────────────
              Container(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                  border: Border(
                    bottom: BorderSide(
                      color: Colors.white.withValues(alpha: 0.1),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: Colors.red.withValues(alpha: 0.3),
                        ),
                      ),
                      child: const Icon(
                        Icons.qr_code_2_rounded,
                        color: Colors.white,
                        size: 26,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'PEMBAYARAN QRIS',
                            style: AppTheme.labelFont(
                              color: AppTheme.headerGold,
                              fontSize: 11,
                              letterSpacing: 2.0,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Silakan scan QR code untuk membayar',
                            style: AppTheme.bodyFont(
                              fontSize: 12,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.red.shade700,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withValues(alpha: 0.4),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: Text(
                        'MIDTRANS',
                        style: AppTheme.labelFont(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: Column(
                  children: [
                    // ─── Total Amount Display Box ─────────────────────
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.amber.shade900.withValues(alpha: 0.3),
                            Colors.orange.shade900.withValues(alpha: 0.2),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppTheme.headerGold.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'TOTAL PEMBAYARAN',
                            style: AppTheme.labelFont(
                              color: AppTheme.headerGold,
                              fontSize: 10,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppTheme.formatRupiah(state.grandTotal.toDouble()),
                            style: AppTheme.monoFont(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          if (state.orderNumber != '-') ...[
                            const SizedBox(height: 4),
                            Text(
                              'No. Antrean: ${state.orderNumber} ${state.customerName != null ? "• ${state.customerName}" : ""}',
                              style: AppTheme.bodyFont(
                                fontSize: 11,
                                color: Colors.white60,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ─── Main QR Code Container ──────────────────────
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(
                          qrUrl,
                          width: 220,
                          height: 220,
                          fit: BoxFit.contain,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return const SizedBox(
                              width: 220,
                              height: 220,
                              child: Center(
                                child: CircularProgressIndicator(strokeWidth: 3),
                              ),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) {
                            final payloadData = state.qrisPayload ?? state.qrisUrl ?? state.orderNumber;
                            final fallbackQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${Uri.encodeComponent(payloadData)}';
                            return Image.network(
                              fallbackQrUrl,
                              width: 220,
                              height: 220,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  width: 220,
                                  height: 220,
                                  color: Colors.grey[100],
                                  child: const Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.qr_code_2, size: 54, color: Colors.grey),
                                      SizedBox(height: 6),
                                      Text(
                                        'Gagal Memuat QR Code',
                                        style: TextStyle(fontSize: 11, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // ─── Status Text & Waiting Pulse ──────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.greenAccent,
                          ),
                        ).animate(onPlay: (ctrl) => ctrl.repeat(reverse: true)).scale(
                              begin: const Offset(0.8, 0.8),
                              end: const Offset(1.4, 1.4),
                              duration: 800.ms,
                            ),
                        const SizedBox(width: 8),
                        Text(
                          'Menunggu konfirmasi pembayaran...',
                          style: AppTheme.bodyFont(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // ─── Supported Merchants Badge ────────────────────
                    Text(
                      'Bisa di-scan oleh GoPay, OVO, ShopeePay, DANA, BCA, Mandiri, BRI, dll.',
                      style: AppTheme.bodyFont(
                        fontSize: 11,
                        color: Colors.white38,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 300.ms).scale(begin: const Offset(0.92, 0.92), end: const Offset(1.0, 1.0)),
      ),
    );
  }
}
