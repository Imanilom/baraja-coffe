import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../controllers/display_controller.dart';
import '../theme/app_theme.dart';

class SettingsDialog extends StatefulWidget {
  const SettingsDialog({super.key});
  @override
  State<SettingsDialog> createState() => _SettingsDialogState();
}

class _SettingsDialogState extends State<SettingsDialog> {
  late TextEditingController _deviceIdController;
  late TextEditingController _apiUrlController;
  late double _idleSleepSeconds;
  late int _openHour;
  late int _closeHour;

  @override
  void initState() {
    super.initState();
    final c = context.read<DisplayController>();
    _deviceIdController = TextEditingController(text: c.deviceId);
    _apiUrlController = TextEditingController(text: c.apiUrl);
    _idleSleepSeconds = c.idleSleepSeconds.toDouble();
    _openHour = c.storeOpenHour;
    _closeHour = c.storeCloseHour;
  }

  @override
  void dispose() {
    _deviceIdController.dispose();
    _apiUrlController.dispose();
    super.dispose();
  }

  void _save(DisplayController c) {
    c.saveSettings(
      newDeviceId: _deviceIdController.text.trim(),
      newApiUrl: _apiUrlController.text.trim(),
      newIdleSleepSeconds: _idleSleepSeconds.round(),
      newStoreOpenHour: _openHour,
      newStoreCloseHour: _closeHour,
    );
    c.closeSettings();
    c.showToast(Icons.check_circle_rounded, 'Pengaturan berhasil disimpan');
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<DisplayController>();
    if (!c.isSettingsOpen) return const SizedBox.shrink();

    return Material(
      color: Colors.black.withValues(alpha: 0.45),
      child: Center(
        child: Container(
          width: 540,
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
          decoration: AppTheme.cardLight(radius: 28),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ─── Header ───────────────────────────────────────────
                Row(
                  children: [
                    Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFF5E8D8),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: const Icon(Icons.settings_outlined, color: AppTheme.caramel, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('KONFIGURASI SISTEM', style: AppTheme.labelFont(fontSize: 9, color: AppTheme.caramel, letterSpacing: 2.0)),
                          Text('Pengaturan Display Tablet', style: AppTheme.headingFont(fontSize: 18, color: AppTheme.textPrimary)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close, color: AppTheme.textMuted),
                      onPressed: () => c.closeSettings(),
                    ),
                  ],
                ),
                Text('Konfigurasi jadwal sleep/wake & koneksi kasir', style: AppTheme.bodyFont(fontSize: 12, color: AppTheme.textMuted)),
                const SizedBox(height: 24),
                Container(height: 1, color: AppTheme.border),
                const SizedBox(height: 20),

                // ─── Device ID ─────────────────────────────────────────
                _sectionLabel('Device ID', 'Tablet kasir yang dipantau'),
                TextField(
                  controller: _deviceIdController,
                  style: AppTheme.monoFont(fontSize: 13, color: AppTheme.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Contoh: BAR BELAKANG, KASIR 1',
                    suffixIcon: IconButton(
                      icon: Icon(Icons.refresh, size: 18, color: AppTheme.textMuted),
                      onPressed: () => c.fetchAvailableDevices(),
                    ),
                  ),
                ),

                if (c.isFetchingDevices)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: LinearProgressIndicator(minHeight: 2, color: AppTheme.caramel, backgroundColor: AppTheme.border),
                  )
                else if (c.availableDevices.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: c.availableDevices.map((dev) {
                      final selected = dev == _deviceIdController.text;
                      return GestureDetector(
                        onTap: () => setState(() => _deviceIdController.text = dev),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: selected ? const Color(0xFFF5E8D8) : AppTheme.surface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: selected ? AppTheme.caramel : AppTheme.border),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.tablet_android, size: 14, color: selected ? AppTheme.caramel : AppTheme.textMuted),
                              const SizedBox(width: 6),
                              Text(dev, style: AppTheme.bodyFont(fontSize: 13, fontWeight: FontWeight.w600, color: selected ? AppTheme.caramel : AppTheme.textSecondary)),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],

                const SizedBox(height: 20),

                // ─── API URL ───────────────────────────────────────────
                _sectionLabel('Backend API', 'Endpoint server kasir'),
                TextField(
                  controller: _apiUrlController,
                  style: AppTheme.monoFont(fontSize: 12, color: AppTheme.textPrimary),
                  decoration: const InputDecoration(hintText: AppConfig.defaultApiUrl),
                ),

                const SizedBox(height: 24),

                // ─── Sleep Timeout ─────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _sectionLabel('Sleep Timeout', 'Waktu tanpa transaksi'),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5E8D8),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Text(
                        _idleSleepSeconds.round() >= 60
                            ? '${_idleSleepSeconds.round() ~/ 60}m ${_idleSleepSeconds.round() % 60 > 0 ? "${_idleSleepSeconds.round() % 60}s" : ""}'
                            : '${_idleSleepSeconds.round()}s',
                        style: AppTheme.monoFont(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.caramel),
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _idleSleepSeconds,
                  min: 30, max: 300, divisions: 18,
                  label: _idleSleepSeconds.round() >= 60
                      ? '${_idleSleepSeconds.round() ~/ 60}m ${_idleSleepSeconds.round() % 60 > 0 ? "${_idleSleepSeconds.round() % 60}s" : ""}'
                      : '${_idleSleepSeconds.round()}s',
                  onChanged: (v) => setState(() => _idleSleepSeconds = v),
                ),

                const SizedBox(height: 20),

                // ─── Schedule ──────────────────────────────────────────
                _sectionLabel('Jadwal Toko', 'Jam operasional harian'),
                Row(
                  children: [
                    Expanded(child: _hourDropdown('Buka', _openHour, (v) => setState(() => _openHour = v!))),
                    const SizedBox(width: 12),
                    Expanded(child: _hourDropdown('Tutup', _closeHour, (v) => setState(() => _closeHour = v!))),
                  ],
                ),

                const SizedBox(height: 24),
                Container(height: 1, color: AppTheme.border),
                const SizedBox(height: 16),

                // ─── Simulation ────────────────────────────────────────
                Text('ALAT SIMULASI', style: AppTheme.labelFont(fontSize: 9, color: AppTheme.textMuted, letterSpacing: 2.0)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: [
                    _simBtn(icon: Icons.play_arrow, label: 'Simulasi Transaksi', color: const Color(0xFF1D6FB5), bgColor: const Color(0xFFE8F0FE), onTap: () => c.simulateSampleTransaction()),
                    _simBtn(icon: Icons.check_circle_outline, label: 'Pembayaran Lunas', color: AppTheme.success, bgColor: AppTheme.successBg, onTap: () => c.simulatePaymentComplete()),
                    _simBtn(icon: Icons.clear_all, label: 'Kosongkan', color: AppTheme.textMuted, bgColor: AppTheme.surface, onTap: () => c.simulateClearTransaction()),
                  ],
                ),

                const SizedBox(height: 24),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => c.closeSettings(),
                        child: const Text('Batal'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        onPressed: () => _save(c),
                        icon: const Icon(Icons.save_outlined, size: 16),
                        label: const Text('Simpan Pengaturan'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionLabel(String label, String sublabel) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTheme.bodyFont(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
          Text(sublabel, style: AppTheme.bodyFont(fontSize: 11, color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  Widget _hourDropdown(String label, int value, void Function(int?) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTheme.labelFont(fontSize: 10, color: AppTheme.textMuted, letterSpacing: 1.0)),
        const SizedBox(height: 4),
        DropdownButtonFormField<int>(
          initialValue: value,
          dropdownColor: AppTheme.bgCard,
          style: AppTheme.monoFont(fontSize: 13, color: AppTheme.textPrimary),
          decoration: const InputDecoration(),
          items: List.generate(24, (i) => DropdownMenuItem(
            value: i,
            child: Text('${i.toString().padLeft(2, '0')}:00 WIB'),
          )),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _simBtn({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: color),
            const SizedBox(width: 6),
            Text(label, style: AppTheme.bodyFont(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }
}
