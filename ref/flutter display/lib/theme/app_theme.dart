import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ═══ SAGE GREEN LIGHT PALETTE ═══
  static const Color bg         = Color(0xFFF2F6F3);   // Fresh light sage background
  static const Color bgCard     = Color(0xFFFFFFFF);   // Pure white card
  static const Color bgPanel    = Color(0xFFFAFCFA);   // Soft white-sage panel
  static const Color surface    = Color(0xFFE6EFE8);   // Light sage surface
  static const Color surface2   = Color(0xFFD8E5DC);   // Deeper soft sage surface
  static const Color border     = Color(0xFFC7D7CC);   // Light sage border
  static const Color borderHi   = Color(0xFF4A6B56);   // Active sage green border

  // ═══ SAGE GREEN PRIMARY PALETTE ═══
  static const Color espresso   = Color(0xFF1B2B20);   // Deepest sage forest
  static const Color darkRoast  = Color(0xFF2D4234);   // Dark sage green
  static const Color roast      = Color(0xFF3B5745);   // Medium sage forest
  static const Color caramel    = Color(0xFF4A6B56);   // Primary Sage Green
  static const Color latte      = Color(0xFF7A9E87);   // Sage green light accent
  
  // ═══ ACCENT PALETTE (Gold / Warm Sage Accent) ═══
  static const Color gold       = Color(0xFF4A6B56);   // Primary Sage
  static const Color goldLight  = Color(0xFF7A9E87);   // Soft Light Sage
  static const Color goldDeep   = Color(0xFF2D4234);   // Deep Sage
  
  // ═══ TEXT PALETTE ═══
  static const Color textPrimary   = Color(0xFF1B2B20); // Deep sage forest text
  static const Color textSecondary = Color(0xFF425648); // Medium sage text
  static const Color textMuted     = Color(0xFF758D7D); // Muted sage grey text
  static const Color textAccent    = Color(0xFF4A6B56); // Primary Sage text
  
  // ═══ STATE COLORS ═══
  static const Color success    = Color(0xFF2E7D52);   // Forest green
  static const Color successBg  = Color(0xFFE8F5ED);   // Success light bg
  static const Color successBdr = Color(0xFF9ECEA8);   // Success border
  static const Color warn       = Color(0xFFB45309);   // Amber warn
  static const Color warnBg     = Color(0xFFFEF3C7);   // Warn light bg
  static const Color red        = Color(0xFFB91C1C);   // Error red
  static const Color redBg      = Color(0xFFFEE2E2);   // Error light bg

  // ═══ HEADER (Sage Forest Gradient for contrast) ═══
  static const Color headerBg1  = Color(0xFF2D4234);   // Header Sage Dark start
  static const Color headerBg2  = Color(0xFF1E2D23);   // Header Sage Dark end
  static const Color headerGold = Color(0xFFC7E0D0);   // Light Sage text on header

  // ═══ GRADIENT HELPERS ═══
  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFF4A6B56), Color(0xFF7A9E87), Color(0xFF4A6B56)],
    stops: [0.0, 0.5, 1.0],
  );

  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2D4234), Color(0xFF1E2D23)],
  );

  static const LinearGradient warmGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF2F6F3), Color(0xFFE6EFE8)],
  );

  // ═══ SHADOWS ═══
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: const Color(0xFF3B5745).withValues(alpha: 0.08),
      blurRadius: 20,
      offset: const Offset(0, 6),
    ),
    BoxShadow(
      color: const Color(0xFF000000).withValues(alpha: 0.03),
      blurRadius: 6,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> get goldGlow => [
    BoxShadow(
      color: caramel.withValues(alpha: 0.20),
      blurRadius: 16,
      spreadRadius: -2,
    ),
  ];

  static List<BoxShadow> get headerShadow => [
    BoxShadow(
      color: const Color(0xFF1E2D23).withValues(alpha: 0.25),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  // ═══ LIGHT THEME ═══
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: bg,
      colorScheme: const ColorScheme.light(
        primary: gold,
        secondary: caramel,
        surface: bgCard,
        onSurface: textPrimary,
      ),
      textTheme: GoogleFonts.manropeTextTheme(ThemeData.light().textTheme),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: espresso,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 13),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: espresso,
          side: const BorderSide(color: border, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w600, fontSize: 13),
        ),
      ),
      dividerColor: border,
      sliderTheme: SliderThemeData(
        activeTrackColor: gold,
        thumbColor: gold,
        inactiveTrackColor: border,
        overlayColor: gold.withValues(alpha: 0.12),
        trackHeight: 4,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgCard,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: caramel, width: 1.5),
        ),
        hintStyle: bodyFont(color: textMuted, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }

  // ═══ TYPOGRAPHY ═══
  static TextStyle displayFont({
    double fontSize = 36,
    FontWeight fontWeight = FontWeight.w700,
    Color color = textPrimary,
    double? letterSpacing,
    double? height,
  }) =>
      GoogleFonts.cormorantGaramond(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        height: height,
      );

  static TextStyle headingFont({
    double fontSize = 20,
    FontWeight fontWeight = FontWeight.w600,
    Color color = textPrimary,
    double? letterSpacing,
    double? height,
  }) =>
      GoogleFonts.playfairDisplay(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        height: height,
      );

  static TextStyle bodyFont({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.w400,
    Color color = textPrimary,
    double? height,
  }) =>
      GoogleFonts.manrope(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        height: height,
      );

  static TextStyle monoFont({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.w500,
    Color color = textPrimary,
    double? height,
  }) =>
      GoogleFonts.spaceMono(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        height: height,
      );

  static TextStyle labelFont({
    double fontSize = 10,
    FontWeight fontWeight = FontWeight.w700,
    Color color = caramel,
    double letterSpacing = 1.5,
    double? height,
  }) =>
      GoogleFonts.manrope(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        height: height,
      );

  // ═══ UTILITIES ═══
  static String formatRupiah(double value) {
    int val = value.round();
    String result = val.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.');
    return 'Rp $result';
  }

  // ═══ CARD DECORATION ═══
  static BoxDecoration cardLight({
    Color? color,
    double radius = 20,
    bool hasBorder = true,
    bool hasGoldBorder = false,
  }) =>
      BoxDecoration(
        color: color ?? bgCard,
        borderRadius: BorderRadius.circular(radius),
        border: hasBorder
            ? Border.all(
                color: hasGoldBorder ? gold.withValues(alpha: 0.35) : border,
                width: hasGoldBorder ? 1.5 : 1.0,
              )
            : null,
        boxShadow: cardShadow,
      );
}
