import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// KisanLink Agronomic Design System & Theme Tokens
/// Clean editorial agricultural palette: Parchment, Deep Slate, Terracotta, Forest Green.
class AppColors {
  // Canvas & Surfaces
  static const Color bgCanvas = Color(0xFFF5F0E7);
  static const Color bgSurface = Color(0xFFFFFFFF);
  static const Color bgSurfaceHover = Color(0xFFFAF7F2);
  static const Color borderSubtle = Color(0xFFD9D6CC);
  static const Color borderStrong = Color(0xFFB8B4A8);

  // Typography
  static const Color textPrimary = Color(0xFF202A27);
  static const Color textSecondary = Color(0xFF4B5563);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color textOnAccent = Color(0xFFFFFFFF);

  // Primary Brand Accents
  static const Color accentTerra = Color(0xFFB45A42);
  static const Color accentTerraHover = Color(0xFF9E4B35);
  static const Color accentTerraSubtle = Color(0xFFFBECE8);

  // Agronomic Semantic Green
  static const Color accentForest = Color(0xFF2F6838);
  static const Color accentForestHover = Color(0xFF25522C);
  static const Color accentSage = Color(0xFFDCE7D3);

  // Status Colors
  static const Color warningAmber = Color(0xFFD97706);
  static const Color warningAmberBg = Color(0xFFFEF3C7);
  static const Color errorRed = Color(0xFFDC2626);
  static const Color errorRedBg = Color(0xFFFEE2E2);
  static const Color infoBlue = Color(0xFF2563EB);
  static const Color infoBlueBg = Color(0xFFDBEAFE);
}

class AppTypography {
  static TextStyle get displayLarge => GoogleFonts.manrope(
        fontSize: 28,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.8,
        color: AppColors.textPrimary,
      );

  static TextStyle get titleLarge => GoogleFonts.manrope(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        color: AppColors.textPrimary,
      );

  static TextStyle get titleMedium => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      );

  static TextStyle get bodyMedium => GoogleFonts.manrope(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textSecondary,
        height: 1.45,
      );

  static TextStyle get labelSmall => GoogleFonts.manrope(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.6,
        color: AppColors.textMuted,
      );

  static TextStyle get monoPrice => GoogleFonts.dmMono(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      );

  static TextStyle get monoPriceLarge => GoogleFonts.dmMono(
        fontSize: 26,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
        color: AppColors.textPrimary,
      );

  static TextStyle get monoCode => GoogleFonts.dmMono(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textSecondary,
      );
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.bgCanvas,
      colorScheme: const ColorScheme.light(
        primary: AppColors.accentTerra,
        secondary: AppColors.accentForest,
        surface: AppColors.bgSurface,
        background: AppColors.bgCanvas,
        error: AppColors.errorRed,
        onPrimary: AppColors.textOnAccent,
        onSecondary: AppColors.textOnAccent,
        onSurface: AppColors.textPrimary,
        onBackground: AppColors.textPrimary,
      ),
      cardTheme: CardTheme(
        color: AppColors.bgSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.bgSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.accentTerra, width: 1.5),
        ),
        labelStyle: AppTypography.bodyMedium,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accentTerra,
          foregroundColor: AppColors.textOnAccent,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.manrope(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          side: const BorderSide(color: AppColors.borderSubtle, width: 1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: GoogleFonts.manrope(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
