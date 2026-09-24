import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/kisanlink_tokens.dart';

/// KisanLink Agronomic Design System & Theme Tokens
/// Maps directly to C:\dev_tool\GitHub\doc\designfrontend\tokens.json
class AppColors {
  // Canvas & Surfaces (Earth & Soil Neutrals)
  static const Color bgCanvas       = KLColors.surfaceBaseLight;    // #FAF9F6
  static const Color bgSurface      = KLColors.surfaceRaisedLight;  // #FFFFFF
  static const Color bgSurfaceHover = KLColors.surfaceSunkenLight;  // #F2F0EA
  static const Color borderSubtle   = KLColors.borderDefaultLight;  // #E5E1D6
  static const Color borderStrong   = KLColors.borderStrongLight;   // #A9A190

  // Typography (Neutral scale)
  static const Color textPrimary   = KLColors.textPrimaryLight;    // #1A1714
  static const Color textSecondary = KLColors.textSecondaryLight;  // #635A4E
  static const Color textMuted     = KLColors.textDisabledLight;   // #A9A190
  static const Color textOnAccent  = KLColors.textOnAccentLight;   // #FFFFFF

  // Primary Brand Accents (Natural Green & Soil)
  static const Color accentForest      = KLColors.brandPrimaryLight;       // #3A7028
  static const Color accentForestHover = KLColors.brandPrimaryHoverLight;  // #2C5620
  static const Color accentSage        = KLColors.green100;                // #DCEBD6

  static const Color accentTerra       = KLColors.brandSecondaryLight;     // #94754F
  static const Color accentTerraHover  = KLColors.soil600;                 // #795D3C
  static const Color accentTerraSubtle = KLColors.soil50;                  // #FAF6F0

  // Status & Financial Colors (Tokens: Amber for Money, Clay for Danger, Sky for Escrow)
  static const Color warningAmber   = KLColors.accentMoneyLight;           // #D98C0A
  static const Color warningAmberBg = KLColors.amber50;                    // #FFF8E8
  static const Color errorRed       = KLColors.statusDangerLight;          // #C24C30
  static const Color errorRedBg     = KLColors.statusDangerBgLight;        // #FDF2EE
  static const Color infoBlue       = KLColors.actionBuyLight;             // #347284
  static const Color infoBlueBg     = KLColors.sky50;                      // #EEF5F7
}

class AppTypography {
  static const List<String> devanagariFallback = ['Noto Sans Devanagari', 'sans-serif'];

  static TextStyle get displayLarge => GoogleFonts.inter(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: AppColors.textPrimary,
      );

  static TextStyle get titleLarge => GoogleFonts.inter(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
        color: AppColors.textPrimary,
      );

  static TextStyle get titleMedium => GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      );

  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontSize: 17,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: AppColors.textPrimary,
      );

  static TextStyle get bodyMedium => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: AppColors.textSecondary,
        height: 1.5,
      );

  static TextStyle get bodySmall => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: AppColors.textSecondary,
        height: 1.5,
      );

  static TextStyle get labelSmall => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
        color: AppColors.textMuted,
      );

  // Monospace Prices (IBM Plex Mono per design system)
  static TextStyle get monoPrice => GoogleFonts.ibmPlexMono(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.warningAmber,
      );

  static TextStyle get monoPriceLarge => GoogleFonts.ibmPlexMono(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
        color: AppColors.warningAmber,
      );

  static TextStyle get monoCode => GoogleFonts.ibmPlexMono(
        fontSize: 13,
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
      fontFamily: 'Inter',
      colorScheme: const ColorScheme.light(
        primary: AppColors.accentForest,
        secondary: AppColors.accentTerra,
        surface: AppColors.bgSurface,
        background: AppColors.bgCanvas,
        error: AppColors.errorRed,
        onPrimary: AppColors.textOnAccent,
        onSecondary: AppColors.textOnAccent,
        onSurface: AppColors.textPrimary,
        onBackground: AppColors.textPrimary,
      ),
      cardTheme: CardThemeData(
        color: AppColors.bgSurface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(KLRadius.md),
          side: const BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.bgSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(KLRadius.md),
          borderSide: const BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(KLRadius.md),
          borderSide: const BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(KLRadius.md),
          borderSide: const BorderSide(color: AppColors.accentForest, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(KLRadius.md),
          borderSide: const BorderSide(color: AppColors.errorRed, width: 1),
        ),
        labelStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w400,
          color: AppColors.textSecondary,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accentForest,
          foregroundColor: AppColors.textOnAccent,
          elevation: 0,
          minimumSize: const Size(0, KLTouchTarget.minimum),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(KLRadius.md),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          minimumSize: const Size(0, KLTouchTarget.minimum),
          side: const BorderSide(color: AppColors.borderStrong, width: 1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(KLRadius.md),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.bgSurface,
        indicatorColor: AppColors.accentSage,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        labelTextStyle: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.accentForest,
            );
          }
          return const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary,
          );
        }),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: KLColors.surfaceBaseDark,
      fontFamily: 'Inter',
      colorScheme: const ColorScheme.dark(
        primary: KLColors.brandPrimaryDark,
        secondary: KLColors.brandSecondaryDark,
        surface: KLColors.surfaceRaisedDark,
        background: KLColors.surfaceBaseDark,
        error: KLColors.statusDangerDark,
        onPrimary: KLColors.textOnAccentDark,
        onSecondary: KLColors.textOnAccentDark,
        onSurface: KLColors.textPrimaryDark,
        onBackground: KLColors.textPrimaryDark,
      ),
      cardTheme: CardThemeData(
        color: KLColors.surfaceRaisedDark,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(KLRadius.md),
          side: const BorderSide(color: KLColors.borderDefaultDark, width: 1),
        ),
      ),
    );
  }
}
