import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/display_controller.dart';
import '../../theme/app_theme.dart';

class ReceiptModal extends StatefulWidget {
  const ReceiptModal({super.key});
  @override
  State<ReceiptModal> createState() => _ReceiptModalState();
}

class _ReceiptModalState extends State<ReceiptModal> {
  final TextEditingController _emailController = TextEditingController();
  bool _isSending = false;
  bool _isSent = false;
  String? _sentEmail;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _sendEmail(DisplayController controller) async {
    final email = _emailController.text.trim();
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$');
    if (email.isEmpty || !emailRegex.hasMatch(email)) {
      controller.showToast(Icons.warning_amber_rounded, 'Masukkan alamat email yang valid');
      return;
    }
    setState(() => _isSending = true);
    final success = await controller.sendReceiptEmail(email);
    if (!mounted) return;
    setState(() => _isSending = false);
    if (success) {
      setState(() { _isSent = true; _sentEmail = email; });
      controller.showToast(Icons.mark_email_read_rounded, 'Struk berhasil dikirim ke $email');
    } else {
      controller.showToast(Icons.error_outline_rounded, 'Gagal mengirim email struk. Cek koneksi / SMTP server.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DisplayController>();
    final state = controller.state;
    final nowStr = DateFormat('dd MMMM yyyy  HH:mm', 'id_ID').format(DateTime.now());
    if (!controller.isReceiptOpen) return const SizedBox.shrink();

    return Material(
      color: Colors.black.withValues(alpha: 0.55),
      child: Center(
        child: Container(
          width: 480,
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.92),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppTheme.border),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1B2B20).withValues(alpha: 0.18),
                blurRadius: 40,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // ─── Brand Header (dark strip) ───────────────────────────────
                Container(
                  padding: const EdgeInsets.fromLTRB(24, 22, 24, 20),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF2D4234), Color(0xFF1E2D23)],
                    ),
                  ),
                  child: Row(
                    children: [
                      // Logo
                      Container(
                        width: 52, height: 52,
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF3B5745),
                          border: Border.all(color: const Color(0xFFC7E0D0).withValues(alpha: 0.35), width: 1.5),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF4A6B56).withValues(alpha: 0.4),
                              blurRadius: 12,
                            )
                          ],
                        ),
                        child: Image.asset(
                          'assets/images/icon.png',
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => const Icon(Icons.coffee, color: Color(0xFFC7E0D0), size: 28),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'BARAJA COFFEE',
                              style: AppTheme.labelFont(fontSize: 11, color: const Color(0xFFC7E0D0), letterSpacing: 2.5),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Amphitheater',
                              style: AppTheme.headingFont(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Jl. Tuparev No. 60 · Cirebon',
                              style: AppTheme.bodyFont(fontSize: 11, color: const Color(0xFFC7E0D0).withValues(alpha: 0.65)),
                            ),
                          ],
                        ),
                      ),
                      // Close button
                      GestureDetector(
                        onTap: () => controller.closeReceipt(),
                        child: Container(
                          width: 34, height: 34,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.10),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
                          ),
                          child: const Icon(Icons.close_rounded, color: Colors.white70, size: 18),
                        ),
                      ),
                    ],
                  ),
                ),

                // ─── Scrollable Body ─────────────────────────────────────────
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ─── Order Meta Row ───────────────────────────────────
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Row(
                            children: [
                              _metaChip(Icons.tag_rounded, 'No. Antrean', state.orderNumber),
                              Container(width: 1, height: 32, color: AppTheme.border, margin: const EdgeInsets.symmetric(horizontal: 6)),
                              _metaChip(Icons.person_outline_rounded, 'Pelanggan', state.customerName ?? '—'),
                              if (state.tableName != null && state.tableName!.isNotEmpty) ...[
                                Container(width: 1, height: 32, color: AppTheme.border, margin: const EdgeInsets.symmetric(horizontal: 6)),
                                _metaChip(Icons.table_restaurant_outlined, 'Meja', state.tableName!),
                              ],
                              Container(width: 1, height: 32, color: AppTheme.border, margin: const EdgeInsets.symmetric(horizontal: 6)),
                              Flexible(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('TANGGAL', style: AppTheme.labelFont(fontSize: 8, color: AppTheme.textMuted, letterSpacing: 0.8)),
                                    const SizedBox(height: 3),
                                    Text(
                                      nowStr,
                                      style: AppTheme.monoFont(fontSize: 9, color: AppTheme.textSecondary),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(duration: 300.ms),
                        const SizedBox(height: 18),

                        // ─── Dashed Divider ───────────────────────────────────
                        _DashedDivider(),
                        const SizedBox(height: 14),

                        // ─── Section Label ────────────────────────────────────
                        Text('DETAIL PESANAN', style: AppTheme.labelFont(fontSize: 9, color: AppTheme.textMuted, letterSpacing: 1.8)),
                        const SizedBox(height: 10),

                        // ─── Items ────────────────────────────────────────────
                        ...state.items.asMap().entries.map((entry) {
                          final i = entry.key;
                          final item = entry.value;
                          final hasImg = item.image != null && item.image!.trim().isNotEmpty;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                            decoration: BoxDecoration(
                              color: AppTheme.bgCard,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Row(
                              children: [
                                if (hasImg)
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      item.image!.trim(),
                                      width: 36,
                                      height: 36,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, _, _) => Container(
                                        width: 32, height: 32,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(8),
                                          gradient: const LinearGradient(
                                            colors: [Color(0xFF3B5745), Color(0xFF2D4234)],
                                          ),
                                        ),
                                        child: Center(
                                          child: Text(
                                            '${item.qty}×',
                                            style: AppTheme.monoFont(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.headerGold),
                                          ),
                                        ),
                                      ),
                                    ),
                                  )
                                else
                                  Container(
                                    width: 32, height: 32,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
                                      gradient: const LinearGradient(
                                        colors: [Color(0xFF3B5745), Color(0xFF2D4234)],
                                      ),
                                    ),
                                    child: Center(
                                      child: Text(
                                        '${item.qty}×',
                                        style: AppTheme.monoFont(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.headerGold),
                                      ),
                                    ),
                                  ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item.name, style: AppTheme.bodyFont(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                                      if (item.note != null && item.note!.isNotEmpty)
                                        Text(item.note!, style: AppTheme.bodyFont(fontSize: 10, color: AppTheme.caramel)),
                                      Text('@ ${AppTheme.formatRupiah(item.price.toDouble())}', style: AppTheme.bodyFont(fontSize: 11, color: AppTheme.textMuted)),
                                    ],
                                  ),
                                ),
                                Text(
                                  AppTheme.formatRupiah((item.qty * item.price).toDouble()),
                                  style: AppTheme.monoFont(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                ),
                              ],
                            ),
                          ).animate().fadeIn(duration: 300.ms, delay: Duration(milliseconds: 50 * i)).slideX(begin: 0.05, end: 0);
                        }),

                        const SizedBox(height: 6),
                        _DashedDivider(),
                        const SizedBox(height: 12),

                        // ─── Totals ───────────────────────────────────────────
                        _receiptRow('Subtotal', AppTheme.formatRupiah(state.subtotal.toDouble())),
                        if (state.discountRate > 0)
                          _receiptRow(
                            'Diskon (${(state.discountRate * 100).round()}%)',
                            '− ${AppTheme.formatRupiah(state.discountAmount.toDouble())}',
                            valueColor: AppTheme.red,
                          ),
                        const SizedBox(height: 10),

                        // Grand Total
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFF2D4234), Color(0xFF1E2D23)],
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: AppTheme.cardShadow,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('TOTAL BAYAR', style: AppTheme.labelFont(fontSize: 10, color: const Color(0xFFC7E0D0).withValues(alpha: 0.75), letterSpacing: 1.5)),
                                  if (state.paymentMethod != null)
                                    Text(state.paymentMethod!, style: AppTheme.bodyFont(fontSize: 12, color: const Color(0xFFC7E0D0).withValues(alpha: 0.6))),
                                ],
                              ),
                              Text(
                                AppTheme.formatRupiah(state.grandTotal.toDouble()),
                                style: AppTheme.monoFont(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.headerGold),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),

                        if (state.paymentAmount != null && state.paymentAmount! > 0) ...[
                          const SizedBox(height: 8),
                          _receiptRow('Uang Diterima', AppTheme.formatRupiah(state.paymentAmount!.toDouble())),
                          if (state.changeAmount != null && state.changeAmount! >= 0 && state.paymentAmount! >= state.grandTotal) ...[
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppTheme.successBg,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTheme.successBdr),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('KEMBALIAN', style: AppTheme.labelFont(fontSize: 10, color: AppTheme.success, letterSpacing: 1.2, fontWeight: FontWeight.bold)),
                                  Text(
                                    AppTheme.formatRupiah(state.changeAmount!.toDouble()),
                                    style: AppTheme.monoFont(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.success),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],

                        const SizedBox(height: 20),
                        _DashedDivider(),
                        const SizedBox(height: 16),

                        // ─── Email Struk ──────────────────────────────────────
                        if (_isSent)
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppTheme.successBg,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.successBdr),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 36, height: 36,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppTheme.success.withValues(alpha: 0.12),
                                  ),
                                  child: const Icon(Icons.mark_email_read_rounded, size: 18, color: AppTheme.success),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('STRUK TERKIRIM', style: AppTheme.labelFont(fontSize: 9, color: AppTheme.success, letterSpacing: 1.5)),
                                      const SizedBox(height: 2),
                                      Text(_sentEmail ?? '', style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.success, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ).animate().fadeIn(duration: 350.ms).scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1))
                        else
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('KIRIM STRUK DIGITAL', style: AppTheme.labelFont(fontSize: 9, color: AppTheme.textMuted, letterSpacing: 1.5)),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _emailController,
                                      keyboardType: TextInputType.emailAddress,
                                      style: AppTheme.bodyFont(fontSize: 13, color: AppTheme.textPrimary),
                                      decoration: InputDecoration(
                                        hintText: 'nama@email.com',
                                        prefixIcon: const Icon(Icons.mail_outline_rounded, size: 18, color: AppTheme.textMuted),
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  SizedBox(
                                    height: 48,
                                    child: ElevatedButton(
                                      onPressed: _isSending ? null : () => _sendEmail(controller),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.caramel,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 18),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      child: _isSending
                                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                          : const Icon(Icons.send_rounded, size: 18),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),

                        const SizedBox(height: 18),

                        // ─── Action Buttons ───────────────────────────────────
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => controller.closeReceipt(),
                                icon: const Icon(Icons.close_rounded, size: 16),
                                label: const Text('Tutup'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 2,
                              child: ElevatedButton.icon(
                                onPressed: () => controller.openRating(),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.espresso,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                icon: const Icon(Icons.star_outline_rounded, size: 16),
                                label: const Text('Beri Rating'),
                              ),
                            ),
                          ],
                        ),

                        // ─── Spin Wheel CTA (if eligible) ─────────────────────
                        if (state.grandTotal >= 500000) ...[
                          const SizedBox(height: 10),
                          GestureDetector(
                            onTap: () => controller.openSpin(),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF6B21A8), Color(0xFF4C1D95), Color(0xFF7C3AED)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF6B21A8).withValues(alpha: 0.35),
                                    blurRadius: 14,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text('🎉', style: TextStyle(fontSize: 18)),
                                  const SizedBox(width: 10),
                                  Text(
                                    'Putar Spin Wheel Berhadiah!',
                                    style: AppTheme.bodyFont(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.20),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      'GRATIS',
                                      style: AppTheme.labelFont(fontSize: 8, color: Colors.white, letterSpacing: 1.2),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ).animate(onPlay: (c) => c.repeat(reverse: true))
                              .shimmer(duration: 2200.ms, color: Colors.white.withValues(alpha: 0.15)),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _metaChip(IconData icon, String label, String value) {
    return Flexible(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 10, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  style: AppTheme.labelFont(fontSize: 8, color: AppTheme.textMuted, letterSpacing: 0.8),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: AppTheme.monoFont(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _receiptRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.textMuted)),
          Text(value, style: AppTheme.monoFont(fontSize: 12, fontWeight: FontWeight.w600, color: valueColor ?? AppTheme.textSecondary)),
        ],
      ),
    );
  }
}

class _DashedDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(48, (i) => Expanded(
        child: Container(
          height: 1.5,
          margin: const EdgeInsets.symmetric(horizontal: 2),
          decoration: BoxDecoration(
            color: i.isEven ? AppTheme.border : Colors.transparent,
            borderRadius: BorderRadius.circular(1),
          ),
        ),
      )),
    );
  }
}
