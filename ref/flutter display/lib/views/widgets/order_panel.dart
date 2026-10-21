import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../controllers/display_controller.dart';
import '../../models/cart_item.dart';
import '../../models/display_state.dart';
import '../../theme/app_theme.dart';

class OrderPanel extends StatelessWidget {
  const OrderPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.watch<DisplayController>();
    final state = c.state;

    return Container(
      decoration: AppTheme.cardLight(radius: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Header(state: state, idleSec: c.secondsRemainingToSleep),
          _ProgressTracker(status: state.status),
          Container(margin: const EdgeInsets.symmetric(horizontal: 20), height: 1, color: AppTheme.border),
          Expanded(
            child: state.items.isEmpty ? _EmptyState() : _ItemsList(state: state),
          ),
          if (state.items.isNotEmpty) ...[
            Container(margin: const EdgeInsets.symmetric(horizontal: 20), height: 1, color: AppTheme.border),
            _Summary(state: state),
          ],
          _StatusBanner(controller: c, state: state),
        ],
      ),
    );
  }
}

// ─── Header ─────────────────────────────────────────────────────────────────
class _Header extends StatelessWidget {
  final DisplayState state;
  final int idleSec;
  const _Header({required this.state, required this.idleSec});

  @override
  Widget build(BuildContext context) {
    final totalItemCount = state.items.fold(0, (sum, i) => sum + i.qty);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      'RINCIAN PESANAN',
                      style: AppTheme.labelFont(color: AppTheme.caramel, fontSize: 11, letterSpacing: 1.5),
                    ),
                    if (totalItemCount > 0) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2D4234).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFF4A6B56).withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          '$totalItemCount Item',
                          style: AppTheme.bodyFont(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF2D4234)),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        state.customerName ?? 'Pelanggan',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTheme.headingFont(fontSize: 18, color: AppTheme.textPrimary, fontWeight: FontWeight.bold),
                      ),
                    ),
                    if (state.tableName != null) ...[
                      const SizedBox(width: 8),
                      Icon(Icons.table_restaurant_outlined, size: 14, color: AppTheme.textMuted),
                      const SizedBox(width: 3),
                      Text(
                        state.tableName!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTheme.bodyFont(fontSize: 13, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // Queue number badge (Compact)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF2C1810), Color(0xFF1A0C05)],
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.headerGold.withValues(alpha: 0.3), width: 1),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.headerGold.withValues(alpha: 0.15),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'No. Antrean',
                      style: AppTheme.labelFont(fontSize: 9, color: Colors.white54, letterSpacing: 1.0),
                    ),
                    if (idleSec > 0)
                      Text(
                        'sleep ${idleSec >= 60 ? "${idleSec ~/ 60}m" : "${idleSec}s"}',
                        style: AppTheme.labelFont(fontSize: 8, color: Colors.white38),
                      ),
                  ],
                ),
                const SizedBox(width: 8),
                Text(
                  state.orderNumber,
                  style: AppTheme.monoFont(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.headerGold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Progress Tracker ─────────────────────────────────────────────────────
class _ProgressTracker extends StatelessWidget {
  final int status;
  const _ProgressTracker({required this.status});

  @override
  Widget build(BuildContext context) {
    final steps = ['Pemesanan', 'Pembayaran', 'Lunas'];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 2, 20, 10),
      child: Row(
        children: List.generate(steps.length, (i) {
          final isDone = i < status;
          final isActive = i == status;
          final color = isDone ? AppTheme.success
              : isActive ? AppTheme.caramel
              : AppTheme.border;

          return Expanded(
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 350),
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDone ? AppTheme.successBg
                        : isActive ? const Color(0xFFF5E8D8)
                        : AppTheme.surface,
                    border: Border.all(color: color, width: isActive ? 1.8 : 1.2),
                    boxShadow: isActive
                        ? [BoxShadow(color: AppTheme.caramel.withValues(alpha: 0.35), blurRadius: 6, spreadRadius: 1)]
                        : isDone
                            ? [BoxShadow(color: AppTheme.success.withValues(alpha: 0.20), blurRadius: 6)]
                            : null,
                  ),
                  child: Center(
                    child: isDone
                        ? const Icon(Icons.check_rounded, color: AppTheme.success, size: 14)
                        : Text(
                            '${i + 1}',
                            style: AppTheme.bodyFont(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: color,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        steps[i],
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTheme.bodyFont(
                          fontSize: 11.5,
                          fontWeight: isActive || isDone ? FontWeight.w800 : FontWeight.w500,
                          color: isDone ? AppTheme.success : isActive ? AppTheme.caramel : AppTheme.textMuted,
                        ),
                      ),
                      if (i < steps.length - 1)
                        Container(
                          margin: const EdgeInsets.only(top: 2, right: 6),
                          height: 2,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(1),
                            gradient: LinearGradient(
                              colors: [isDone ? AppTheme.success : AppTheme.border, AppTheme.border],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF2D4234).withValues(alpha: 0.08),
                    const Color(0xFF1E2D23).withValues(alpha: 0.03),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(color: const Color(0xFF7A9E87).withValues(alpha: 0.25), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2D4234).withValues(alpha: 0.05),
                    blurRadius: 20,
                  ),
                ],
              ),
              child: const Icon(Icons.local_cafe_rounded, size: 40, color: Color(0xFF4A6B56)),
            ),
            const SizedBox(height: 20),
            Text(
              'Keranjang Kosong',
              style: AppTheme.headingFont(fontSize: 20, color: AppTheme.textPrimary, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Silakan pilih menu favorit Anda di kasir.\nItem pesanan akan langsung muncul di sini.',
              textAlign: TextAlign.center,
              style: AppTheme.bodyFont(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Items List ─────────────────────────────────────────────────────────
class _ItemsList extends StatelessWidget {
  final DisplayState state;
  const _ItemsList({required this.state});

  Widget _buildItemThumbnail(CartItem item) {
    if (item.image != null && item.image!.trim().isNotEmpty) {
      return SizedBox(
        width: 44,
        height: 44,
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                item.image!.trim(),
                width: 44,
                height: 44,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => _buildQtyBadge(item.qty),
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.border,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Center(
                      child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                    ),
                  );
                },
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: const BoxDecoration(
                  color: Color(0xFF2C1810),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(5),
                    bottomRight: Radius.circular(10),
                  ),
                ),
                child: Text(
                  '${item.qty}×',
                  style: AppTheme.monoFont(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.headerGold),
                ),
              ),
            ),
          ],
        ),
      );
    }
    return _buildQtyBadge(item.qty);
  }

  Widget _buildQtyBadge(int qty) {
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3D1F0E), Color(0xFF2C1810)],
        ),
      ),
      child: Center(
        child: Text(
          '$qty×',
          style: AppTheme.monoFont(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.headerGold),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      itemCount: state.items.length,
      separatorBuilder: (_, _) => const SizedBox(height: 6),
      itemBuilder: (_, i) {
        final item = state.items[i];
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              _buildItemThumbnail(item),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      item.name,
                      style: AppTheme.bodyFont(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    ),
                    if (item.note != null && item.note!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(item.note!, style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.caramel, fontWeight: FontWeight.w500)),
                      ),
                    const SizedBox(height: 1),
                    Text(
                      '@ ${AppTheme.formatRupiah(item.price.toDouble())}',
                      style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                AppTheme.formatRupiah((item.qty * item.price).toDouble()),
                style: AppTheme.monoFont(fontSize: 14.5, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 300.ms, delay: Duration(milliseconds: 50 * i)).slideX(begin: 0.06, end: 0);
      },
    );
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────
class _Summary extends StatelessWidget {
  final DisplayState state;
  const _Summary({required this.state});

  Widget _row(String label, String value, {bool isBold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTheme.bodyFont(fontSize: 14, color: AppTheme.textMuted, fontWeight: FontWeight.w500)),
          Text(
            value,
            style: isBold
                ? AppTheme.monoFont(fontSize: 14, fontWeight: FontWeight.bold, color: valueColor ?? AppTheme.textPrimary)
                : AppTheme.monoFont(fontSize: 14, color: valueColor ?? AppTheme.textSecondary, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasPayment = state.paymentAmount != null && state.paymentAmount! > 0;
    final hasChange = state.changeAmount != null && state.changeAmount! >= 0 && (state.paymentAmount ?? 0) >= state.grandTotal;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      child: Column(
        children: [
          if (state.discountRate > 0) ...[
            _row('Subtotal', AppTheme.formatRupiah(state.subtotal.toDouble())),
            _row(
              'Diskon (${(state.discountRate * 100).round()}%)',
              '− ${AppTheme.formatRupiah(state.discountAmount.toDouble())}',
              valueColor: AppTheme.red,
            ),
            const SizedBox(height: 6),
          ],
          // Clean Total Bayar Row
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'TOTAL BAYAR',
                      style: AppTheme.labelFont(
                        color: AppTheme.caramel,
                        fontSize: 12,
                        letterSpacing: 1.8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Sudah Termasuk Pajak & Service',
                      style: AppTheme.bodyFont(
                        color: AppTheme.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                Text(
                  AppTheme.formatRupiah(state.grandTotal.toDouble()),
                  style: AppTheme.monoFont(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          if (hasPayment || hasChange) ...[
            const SizedBox(height: 6),
            Container(height: 1, color: AppTheme.border),
            const SizedBox(height: 6),
          ],
          if (hasPayment) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.payments_outlined, size: 16, color: AppTheme.textMuted),
                      const SizedBox(width: 6),
                      Text('Uang Diterima', style: AppTheme.bodyFont(fontSize: 13, color: AppTheme.textMuted, fontWeight: FontWeight.w500)),
                    ],
                  ),
                  Text(
                    AppTheme.formatRupiah(state.paymentAmount!.toDouble()),
                    style: AppTheme.monoFont(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                ],
              ),
            ),
          ],
          if (hasChange) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.price_check_rounded, size: 18, color: AppTheme.success),
                      const SizedBox(width: 6),
                      Text('KEMBALIAN', style: AppTheme.labelFont(fontSize: 12, color: AppTheme.success, letterSpacing: 1.2, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Text(
                    AppTheme.formatRupiah(state.changeAmount!.toDouble()),
                    style: AppTheme.monoFont(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.success),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 250.ms).slideY(begin: 0.1, end: 0),
          ],
        ],
      ),
    );
  }
}

// ─── Status Banner ────────────────────────────────────────────────────────
class _StatusBanner extends StatelessWidget {
  final DisplayController controller;
  final DisplayState state;
  const _StatusBanner({required this.controller, required this.state});

  @override
  Widget build(BuildContext context) {
    if (state.items.isEmpty) return const SizedBox(height: 16);

    if (state.status == 2) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 22),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
            color: AppTheme.successBg,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppTheme.successBdr, width: 1.2),
          ),
          child: Row(
            children: [
              Container(
                width: 42, height: 42,
                decoration: BoxDecoration(shape: BoxShape.circle, color: AppTheme.success.withValues(alpha: 0.12)),
                child: const Icon(Icons.check_rounded, color: AppTheme.success, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('PEMBAYARAN BERHASIL', style: AppTheme.labelFont(color: AppTheme.success, fontSize: 12, letterSpacing: 1.5)),
                    const SizedBox(height: 3),
                    Text('Pesanan sedang disiapkan oleh barista', style: AppTheme.bodyFont(fontSize: 14, color: AppTheme.success, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => controller.openReceipt(),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.success,
                  backgroundColor: AppTheme.success.withValues(alpha: 0.12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.receipt_long_outlined, size: 18),
                    const SizedBox(width: 6),
                    Text('Struk', style: AppTheme.bodyFont(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.success)),
                  ],
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
      );
    }

    if (state.qrisImageUrl != null) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 22),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF2C1810), Color(0xFF1E0E08)],
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFD32F2F).withValues(alpha: 0.5), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.red.withValues(alpha: 0.15),
                blurRadius: 14,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.red.withValues(alpha: 0.20),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.4)),
                ),
                child: const Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PEMBAYARAN QRIS',
                      style: AppTheme.labelFont(color: AppTheme.headerGold, fontSize: 12, letterSpacing: 1.8),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'QR Code tampil di popup layar',
                      style: AppTheme.headingFont(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.1, end: 0),
      );
    }

    if (state.paymentMethod != null && state.paymentMethod.toString().trim().isNotEmpty) {
      final methodStr = state.paymentMethod.toString().trim();
      return Padding(
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 22),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF2D4234), Color(0xFF1E2D23)],
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFF7A9E87).withValues(alpha: 0.5), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4A6B56).withValues(alpha: 0.18),
                blurRadius: 14,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF7A9E87).withValues(alpha: 0.20),
                  border: Border.all(color: const Color(0xFF7A9E87).withValues(alpha: 0.4)),
                ),
                child: Icon(_getPaymentIcon(methodStr), color: const Color(0xFFC7E0D0), size: 26),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'METODE PEMBAYARAN',
                      style: AppTheme.labelFont(color: const Color(0xFFC7E0D0), fontSize: 12, letterSpacing: 1.8),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      methodStr,
                      style: AppTheme.headingFont(fontSize: 19, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF5A7865), Color(0xFF3B5745)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF4A6B56).withValues(alpha: 0.3),
                      blurRadius: 8,
                    )
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'DIPILIH',
                      style: AppTheme.labelFont(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.1, end: 0),
      );
    }

    if (state.status == 1) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF2D4234), Color(0xFF1E2D23)],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF7A9E87).withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF7A9E87).withValues(alpha: 0.18),
                ),
                child: const Icon(Icons.payment_outlined, color: Color(0xFFC7E0D0), size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('TAHAP PEMBAYARAN', style: AppTheme.labelFont(color: const Color(0xFFC7E0D0), fontSize: 10, letterSpacing: 1.8)),
                    const SizedBox(height: 3),
                    Text('Kasir sedang memilih metode pembayaran...', style: AppTheme.bodyFont(fontSize: 13, color: Colors.white70)),
                  ],
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.1, end: 0),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: AppTheme.textMuted, size: 18),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Silakan periksa pesanan Anda bersama kasir',
                style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.textMuted),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getPaymentIcon(String method) {
    final m = method.toLowerCase();
    if (m.contains('qris') || m.contains('qr')) return Icons.qr_code_2_rounded;
    if (m.contains('cash') || m.contains('tunai')) return Icons.payments_rounded;
    if (m.contains('debit') || m.contains('credit') || m.contains('card')) return Icons.credit_card_rounded;
    if (m.contains('transfer') || m.contains('bank') || m.contains('bca') || m.contains('bri') || m.contains('mandiri') || m.contains('bni')) return Icons.account_balance_rounded;
    if (m.contains('ewallet') || m.contains('gopay') || m.contains('ovo') || m.contains('dana') || m.contains('shopee')) return Icons.account_balance_wallet_rounded;
    return Icons.payment_rounded;
  }
}
