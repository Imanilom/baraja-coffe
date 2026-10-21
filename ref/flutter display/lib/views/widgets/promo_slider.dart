import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';
import '../../controllers/display_controller.dart';
import '../../theme/app_theme.dart';
import '../../utils/web_helper.dart';

// ─── Web Video Widget (Web-only HtmlElementView) ──────────────────────────────
class _WebVideoWidget extends StatefulWidget {
  final String videoUrl;
  const _WebVideoWidget({required this.videoUrl});

  @override
  State<_WebVideoWidget> createState() => _WebVideoWidgetState();
}

class _WebVideoWidgetState extends State<_WebVideoWidget> {
  late String _viewId;

  @override
  void initState() {
    super.initState();
    _viewId = 'video-player-${widget.videoUrl.hashCode}';
    registerWebVideoViewFactory(_viewId, widget.videoUrl);
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewId);
  }
}

// ─── Android Native Video Widget ─────────────────────────────────────────────
class _AndroidVideoWidget extends StatefulWidget {
  final String videoUrl;
  const _AndroidVideoWidget({required this.videoUrl});

  @override
  State<_AndroidVideoWidget> createState() => _AndroidVideoWidgetState();
}

class _AndroidVideoWidgetState extends State<_AndroidVideoWidget> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _initController();
  }

  Future<void> _initController() async {
    try {
      final controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
      _controller = controller;
      await controller.initialize();
      if (mounted) {
        await controller.setLooping(true);
        await controller.setVolume(0); // muted untuk autoplay
        await controller.play();
        setState(() => _isInitialized = true);
      }
    } catch (e) {
      if (mounted) setState(() => _hasError = true);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError || _controller == null) {
      return Container(color: Colors.black);
    }
    if (!_isInitialized) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: SizedBox(
            width: 32,
            height: 32,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white38,
            ),
          ),
        ),
      );
    }
    return FittedBox(
      fit: BoxFit.cover,
      child: SizedBox(
        width: _controller!.value.size.width,
        height: _controller!.value.size.height,
        child: VideoPlayer(_controller!),
      ),
    );
  }
}

// ─── Smart Video Widget (Web/Android) ────────────────────────────────────────
class _SmartVideoWidget extends StatelessWidget {
  final String videoUrl;
  const _SmartVideoWidget({required this.videoUrl});

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) return _WebVideoWidget(videoUrl: videoUrl);
    return _AndroidVideoWidget(videoUrl: videoUrl);
  }
}

// ─── Promo Slider ─────────────────────────────────────────────────────────────
class PromoSlider extends StatefulWidget {
  const PromoSlider({super.key});

  @override
  State<PromoSlider> createState() => _PromoSliderState();
}

class _PromoSliderState extends State<PromoSlider> with TickerProviderStateMixin {
  late AnimationController _progressCtrl;
  late AnimationController _pulseCtrl;
  Timer? _timer;
  int _current = 0;
  bool _isPlayingVideo = true;

  final List<_SlideData> _defaultSlides = [
    _SlideData(
      tag: '🎥 CINEMATIC VIDEO',
      title: 'Atmosphere &\nBrewing Baraja',
      subtitle: 'Saksikan keahlian barista Baraja menyeduh kopi pilihan dalam atmosfer Amphitheater yang hangat.',
      icon: Icons.play_circle_fill_outlined,
      bg1: const Color(0xFF1E1408),
      bg2: const Color(0xFF100A04),
      accentColor: const Color(0xFFE8C27A),
      tagBg: const Color(0xFFE8C27A),
      tagText: const Color(0xFF1E1408),
      isVideo: true,
      videoDuration: '0:30',
      // Gunakan banner.mp4 dari server sebagai default
      mediaUrl: 'https://barajacoffee.com/display2/banner.mp4',
    ),
    const _SlideData(
      tag: '☕ SIGNATURE MENU',
      title: 'Manual Brew\nArabica Gayo',
      subtitle: 'Single origin dengan cita rasa floral, fruity, dan aftertaste manis khas dataran tinggi Gayo.',
      icon: Icons.coffee_maker_outlined,
      bg1: Color(0xFF2C1810),
      bg2: Color(0xFF1A0C05),
      accentColor: Color(0xFFD4A853),
      tagBg: Color(0xFFD4A853),
      tagText: Color(0xFF2C1810),
      isVideo: false,
      mediaUrl: 'https://barajacoffee.com/display2/uploads/promo_1785389771_239.jpeg',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _progressCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 6));
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _scheduleNextSlide();
    });
  }

  int _getSlideDurationInSeconds(_SlideData slide) {
    if (slide.isVideo && slide.videoDuration != null && slide.videoDuration!.isNotEmpty) {
      try {
        final parts = slide.videoDuration!.split(':');
        if (parts.length == 2) {
          final total = (int.parse(parts[0]) * 60) + int.parse(parts[1]);
          if (total > 0) return total;
        } else if (parts.length == 1) {
          final secs = int.parse(parts[0]);
          if (secs > 0) return secs;
        }
      } catch (_) {}
    }
    return 6;
  }

  void _scheduleNextSlide() {
    _timer?.cancel();
    final slides = _getActiveSlides(listen: false);
    if (slides.isEmpty) return;

    final activeIndex = _current % slides.length;
    final currentSlide = slides[activeIndex];
    final durationSecs = _getSlideDurationInSeconds(currentSlide);

    _progressCtrl.duration = Duration(seconds: durationSecs);
    _progressCtrl.reset();
    _progressCtrl.forward();

    _timer = Timer(Duration(seconds: durationSecs), () {
      if (!mounted) return;
      final nextSlides = _getActiveSlides(listen: false);
      if (nextSlides.isNotEmpty) {
        setState(() => _current = (_current + 1) % nextSlides.length);
      }
      _scheduleNextSlide();
    });
  }

  List<_SlideData> _getActiveSlides({bool listen = false}) {
    final controller = listen
        ? context.watch<DisplayController>()
        : context.read<DisplayController>();
    final dynamicPromos = controller.dynamicPromos;
    if (dynamicPromos.isEmpty) return _defaultSlides;

    return dynamicPromos.map((p) {
      final tag = p['tag']?.toString() ?? 'PROMO';
      final title = p['title']?.toString() ?? '';
      final subtitle = p['subtitle']?.toString() ?? p['desc']?.toString() ?? '';
      final isVideo = (p['is_video']?.toString() == '1') || (p['media_type']?.toString() == 'video');
      final videoDuration = p['video_duration']?.toString() ?? '0:30';
      final accentHex = p['accent_color']?.toString() ?? '#D4A853';
      final bg1Hex = p['bg_color1']?.toString() ?? '#2C1810';
      final bg2Hex = p['bg_color2']?.toString() ?? '#1A0C05';
      final mediaUrl = p['media_url']?.toString();

      Color accentColor = _parseColor(accentHex, const Color(0xFFD4A853));
      Color bg1 = _parseColor(bg1Hex, const Color(0xFF2C1810));
      Color bg2 = _parseColor(bg2Hex, const Color(0xFF1A0C05));

      return _SlideData(
        tag: tag,
        title: title,
        subtitle: subtitle,
        icon: isVideo ? Icons.play_circle_fill_outlined : Icons.coffee_maker_outlined,
        bg1: bg1,
        bg2: bg2,
        accentColor: accentColor,
        tagBg: accentColor,
        tagText: Colors.black,
        isVideo: isVideo,
        videoDuration: videoDuration,
        mediaUrl: mediaUrl,
      );
    }).toList();
  }

  Color _parseColor(String hex, Color fallback) {
    try {
      String cleanHex = hex.replaceAll('#', '');
      if (cleanHex.length == 6) cleanHex = 'FF$cleanHex';
      return Color(int.parse(cleanHex, radix: 16));
    } catch (_) {
      return fallback;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _progressCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slides = _getActiveSlides(listen: true);
    if (slides.isEmpty) return const SizedBox.shrink();

    final activeIndex = _current % slides.length;
    final activeSlide = slides[activeIndex];

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E2D23).withValues(alpha: 0.20),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            // ── Slide Content ────────────────────────────────────────────────
            Positioned.fill(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 800),
                switchInCurve: Curves.easeOut,
                switchOutCurve: Curves.easeIn,
                layoutBuilder: (currentChild, previousChildren) => Stack(
                  fit: StackFit.expand,
                  alignment: Alignment.center,
                  children: [
                    ...previousChildren,
                    ?currentChild,
                  ],
                ),
                transitionBuilder: (child, animation) =>
                    FadeTransition(opacity: animation, child: child),
                child: SizedBox.expand(
                  key: ValueKey(activeIndex),
                  child: _buildSlide(activeSlide),
                ),
              ),
            ),

            // ── Top Progress Bar ─────────────────────────────────────────────
            Positioned(
              top: 0, left: 0, right: 0,
              child: AnimatedBuilder(
                animation: _progressCtrl,
                builder: (_, _) => LinearProgressIndicator(
                  value: _progressCtrl.value,
                  backgroundColor: Colors.white.withValues(alpha: 0.15),
                  valueColor: AlwaysStoppedAnimation<Color>(activeSlide.accentColor),
                  minHeight: 3,
                ),
              ),
            ),

            // ── Bottom Controls ──────────────────────────────────────────────
            Positioned(
              bottom: 24, left: 28, right: 28,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Slide dot indicators
                  Row(
                    children: List.generate(slides.length, (i) {
                      final active = i == activeIndex;
                      return GestureDetector(
                        onTap: () {
                          setState(() => _current = i);
                          _scheduleNextSlide();
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: active ? 32 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: active
                                ? activeSlide.accentColor
                                : Colors.white.withValues(alpha: 0.30),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      );
                    }),
                  ),
                  // Video play/pause indicator
                  if (activeSlide.isVideo && activeSlide.mediaUrl != null)
                    GestureDetector(
                      onTap: () => setState(() => _isPlayingVideo = !_isPlayingVideo),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.50),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _isPlayingVideo ? Icons.pause_rounded : Icons.play_arrow_rounded,
                              size: 16,
                              color: activeSlide.accentColor,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              _isPlayingVideo
                                  ? 'MEMUTAR (${activeSlide.videoDuration})'
                                  : 'DIPAUSE',
                              style: AppTheme.labelFont(
                                fontSize: 10,
                                color: Colors.white,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSlide(_SlideData slide) {
    return SizedBox.expand(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [slide.bg1, slide.bg2],
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // ── Background: Video or Image ─────────────────────────────────
            if (slide.isVideo && slide.mediaUrl != null && slide.mediaUrl!.isNotEmpty)
              Positioned.fill(
                child: Opacity(
                  opacity: 0.72,
                  child: _SmartVideoWidget(videoUrl: slide.mediaUrl!),
                ),
              )
            else if (!slide.isVideo && slide.mediaUrl != null && slide.mediaUrl!.isNotEmpty)
              Positioned.fill(
                child: Opacity(
                  opacity: 0.65,
                  child: Image.network(
                    slide.mediaUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const SizedBox.shrink(),
                    loadingBuilder: (_, child, progress) {
                      if (progress == null) return child;
                      return Container(color: Colors.black26);
                    },
                  ),
                ),
              )
            else if (slide.isVideo)
              // Fallback gradient pulse jika tidak ada URL video
              Positioned.fill(
                child: AnimatedBuilder(
                  animation: _pulseCtrl,
                  builder: (_, _) => Container(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        center: const Alignment(0.3, -0.3),
                        radius: 1.4,
                        colors: [
                          slide.accentColor.withValues(alpha: 0.10 + 0.06 * _pulseCtrl.value),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
              ),

            // ── Background Gradient Overlay ────────────────────────────────
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      slide.bg2.withValues(alpha: 0.85),
                    ],
                    stops: const [0.4, 1.0],
                  ),
                ),
              ),
            ),

            // ── Ghost Icon (decorative) ─────────────────────────────────────
            Positioned(
              right: -20, top: -10,
              child: Icon(
                slide.icon,
                size: 300,
                color: slide.accentColor.withValues(alpha: 0.06),
              ),
            ),

            // ── Dot Pattern Overlay ────────────────────────────────────────
            Positioned.fill(
              child: IgnorePointer(
                child: CustomPaint(
                  painter: _DotPatternPainter(
                    color: slide.accentColor.withValues(alpha: 0.04),
                  ),
                ),
              ),
            ),

            // ── Content ────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(44, 44, 44, 80),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  // Tag badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
                    decoration: BoxDecoration(
                      color: slide.tagBg,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: slide.tagBg.withValues(alpha: 0.45),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Text(
                      slide.tag,
                      style: AppTheme.labelFont(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: slide.tagText,
                        letterSpacing: 2.0,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    slide.title,
                    style: AppTheme.headingFont(
                      fontSize: 44,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Subtitle
                  SizedBox(
                    width: 540,
                    child: Text(
                      slide.subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.bodyFont(
                        fontSize: 16,
                        color: Colors.white.withValues(alpha: 0.85),
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Dot Pattern Painter ──────────────────────────────────────────────────────
class _DotPatternPainter extends CustomPainter {
  final Color color;
  _DotPatternPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color..style = PaintingStyle.fill;
    const spacing = 28.0;
    const radius = 1.5;
    for (double x = spacing / 2; x < size.width; x += spacing) {
      for (double y = spacing / 2; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DotPatternPainter old) => old.color != color;
}

// ─── Slide Data Model ─────────────────────────────────────────────────────────
class _SlideData {
  final String tag;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color bg1;
  final Color bg2;
  final Color accentColor;
  final Color tagBg;
  final Color tagText;
  final bool isVideo;
  final String? videoDuration;
  final String? mediaUrl;

  const _SlideData({
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.bg1,
    required this.bg2,
    required this.accentColor,
    required this.tagBg,
    required this.tagText,
    required this.isVideo,
    this.videoDuration,
    this.mediaUrl,
  });
}
