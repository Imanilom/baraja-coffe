import 'dart:async';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/display_controller.dart';
import '../../theme/app_theme.dart';

/// Mapping key icon (disimpan di database, dipilih dari dropdown admin) ke
/// FontAwesomeIcons. Key ini HARUS SAMA PERSIS dengan array $iconMap di admin.php.
/// Icon yang tidak dikenali (misal data lama berupa emoji yang belum ter-migrasi)
/// akan fallback ke ikon lingkaran info, bukan crash.
FaIconData tickerIconFor(String key) {
  switch (key) {
    case 'coffee':
      return FontAwesomeIcons.mugSaucer;
    case 'wifi':
      return FontAwesomeIcons.wifi;
    case 'music':
      return FontAwesomeIcons.music;
    case 'clock':
      return FontAwesomeIcons.clock;
    case 'gift':
      return FontAwesomeIcons.gift;
    case 'camera':
      return FontAwesomeIcons.camera;
    case 'star':
      return FontAwesomeIcons.star;
    case 'bell':
      return FontAwesomeIcons.bell;
    case 'heart':
      return FontAwesomeIcons.heart;
    case 'fire':
      return FontAwesomeIcons.fire;
    case 'tag':
      return FontAwesomeIcons.tag;
    case 'percent':
      return FontAwesomeIcons.percent;
    case 'calendar':
      return FontAwesomeIcons.calendarDays;
    case 'location':
      return FontAwesomeIcons.locationDot;
    case 'phone':
      return FontAwesomeIcons.phone;
    case 'email':
      return FontAwesomeIcons.envelope;
    case 'thumbsup':
      return FontAwesomeIcons.thumbsUp;
    case 'crown':
      return FontAwesomeIcons.crown;
    case 'leaf':
      return FontAwesomeIcons.leaf;
    case 'bolt':
      return FontAwesomeIcons.bolt;
    case 'cake':
      return FontAwesomeIcons.cakeCandles;
    case 'utensils':
      return FontAwesomeIcons.utensils;
    case 'wineglass':
      return FontAwesomeIcons.wineGlass;
    case 'trophy':
      return FontAwesomeIcons.trophy;
    case 'instagram':
      return FontAwesomeIcons.instagram;
    default:
      return FontAwesomeIcons.circleQuestion;
  }
}

class HeaderBar extends StatefulWidget {
  const HeaderBar({super.key});
  @override
  State<HeaderBar> createState() => _HeaderBarState();
}

class _HeaderBarState extends State<HeaderBar> {
  late Timer _clockTimer;
  DateTime _now = DateTime.now();

  final List<Map<String, String>> _defaultTickerItems = [
    {'icon': 'coffee', 'text': 'Selamat Datang di Baraja Coffee Amphitheater'},
    {'icon': 'wifi', 'text': 'WiFi: acaradibaraja — Gratis untuk pelanggan'},
    {'icon': 'music', 'text': 'Live Event setiap malam — Gratis!'},
    {'icon': 'clock', 'text': 'Jam Operasional: 06:00 — 03:00 WIB'},
    {'icon': 'gift', 'text': 'Spin Berhadiah min. transaksi Rp 500.000'},
    {'icon': 'camera', 'text': 'Follow @barajacoffee untuk promo eksklusif'},
  ];

  int _tickerIdx = 0;
  Timer? _tickerTimer;

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _now = DateTime.now());
    });
    _tickerTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted) return;
      final tickers = _getActiveTickers();
      if (tickers.isNotEmpty) {
        setState(() => _tickerIdx = (_tickerIdx + 1) % tickers.length);
      }
    });
  }

  List<Map<String, String>> _getActiveTickers() {
    final c = context.read<DisplayController>();
    final dynamicTickers = c.dynamicTickers;
    if (dynamicTickers.isEmpty) return _defaultTickerItems;

    return dynamicTickers.map((t) {
      return {
        'icon': t['icon']?.toString() ?? 'coffee',
        'text': t['text']?.toString() ?? '',
      };
    }).toList();
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _tickerTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<DisplayController>();
    final timeStr = DateFormat('HH:mm:ss').format(_now);
    final dateStr = DateFormat('EEE, d MMM', 'id_ID').format(_now);

    final tickerItems = _getActiveTickers();
    if (_tickerIdx >= tickerItems.length) _tickerIdx = 0;
    final item = tickerItems.isNotEmpty ? tickerItems[_tickerIdx] : _defaultTickerItems[0];

    return Container(
      height: 84,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2D4234), Color(0xFF1B2920), Color(0xFF1E2D23)],
          stops: [0.0, 0.5, 1.0],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E2D23).withValues(alpha: 0.40),
            blurRadius: 24,
            offset: const Offset(0, 6),
          ),
          BoxShadow(
            color: AppTheme.caramel.withValues(alpha: 0.06),
            blurRadius: 8,
          ),
        ],
        border: Border.all(
          color: const Color(0xFF4A6B56).withValues(alpha: 0.25),
          width: 1.0,
        ),
      ),
      child: Row(
        children: [
          // ── Logo & Brand ──────────────────────────────────────────────
          GestureDetector(
            onTap: () => c.openSettings(),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFF5A7865), Color(0xFF3B5745)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    border: Border.all(
                      color: AppTheme.headerGold.withValues(alpha: 0.30),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.headerGold.withValues(alpha: 0.25),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: Image.asset(
                    'assets/images/icon.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.coffee,
                      color: Color(0xFFC7E0D0),
                      size: 22,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'BARAJA COFFEE',
                      style: AppTheme.bodyFont(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'AMPHITHEATER  •  CIREBON',
                      style: AppTheme.labelFont(
                        fontSize: 9.5,
                        color: AppTheme.headerGold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),
          Container(
            width: 1, height: 38,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.white.withValues(alpha: 0.25),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),

          // ── Animated Ticker ───────────────────────────────────────────
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 600),
              transitionBuilder: (child, anim) => FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween<Offset>(begin: const Offset(0, 0.4), end: Offset.zero).animate(anim),
                  child: child,
                ),
              ),
              child: Row(
                key: ValueKey(_tickerIdx),
                children: [
                  FaIcon(
                    tickerIconFor(item['icon']!),
                    size: 16,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item['text']!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.bodyFont(
                        fontSize: 14,
                        color: Colors.white.withValues(alpha: 0.85),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(width: 14),

          // ── Clock ─────────────────────────────────────────────────────────
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                timeStr,
                style: AppTheme.monoFont(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                dateStr,
                style: AppTheme.labelFont(
                  fontSize: 10,
                  color: Colors.white.withValues(alpha: 0.55),
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}