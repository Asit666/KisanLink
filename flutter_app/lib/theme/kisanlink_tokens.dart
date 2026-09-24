import 'package:flutter/material.dart';

/// KisanLink Design Tokens v1.0
/// Generated from C:\dev_tool\GitHub\doc\designfrontend\tokens.json
/// Single source of truth for color, typography, spacing, radius, elevation, and motion.
class KLColors {
  // Primitives - Green
  static const Color green50  = Color(0xFFF0F7EE);
  static const Color green100 = Color(0xFFDCEBD6);
  static const Color green200 = Color(0xFFB8D7AE);
  static const Color green300 = Color(0xFF8FBE80);
  static const Color green400 = Color(0xFF6BA359);
  static const Color green500 = Color(0xFF4C8A3B);
  static const Color green600 = Color(0xFF3A7028);
  static const Color green700 = Color(0xFF2C5620);
  static const Color green800 = Color(0xFF1F3E17);
  static const Color green900 = Color(0xFF152A10);

  // Primitives - Soil
  static const Color soil50  = Color(0xFFFAF6F0);
  static const Color soil100 = Color(0xFFF2E9DC);
  static const Color soil200 = Color(0xFFE3D2B8);
  static const Color soil300 = Color(0xFFCDB48C);
  static const Color soil400 = Color(0xFFB3936A);
  static const Color soil500 = Color(0xFF94754F);
  static const Color soil600 = Color(0xFF795D3C);
  static const Color soil700 = Color(0xFF5E482F);
  static const Color soil800 = Color(0xFF453423);
  static const Color soil900 = Color(0xFF2E2217);

  // Primitives - Amber (Money / Price figures only)
  static const Color amber50  = Color(0xFFFFF8E8);
  static const Color amber100 = Color(0xFFFFEDC2);
  static const Color amber200 = Color(0xFFFFDC8A);
  static const Color amber300 = Color(0xFFFFC44D);
  static const Color amber400 = Color(0xFFF2A81E);
  static const Color amber500 = Color(0xFFD98C0A);
  static const Color amber600 = Color(0xFFB06F06);
  static const Color amber700 = Color(0xFF875408);
  static const Color amber800 = Color(0xFF5F3B08);
  static const Color amber900 = Color(0xFF3D2606);

  // Primitives - Clay (Warnings / Danger / Destructive)
  static const Color clay50  = Color(0xFFFDF2EE);
  static const Color clay100 = Color(0xFFFADDD2);
  static const Color clay200 = Color(0xFFF3B7A2);
  static const Color clay300 = Color(0xFFE88C6F);
  static const Color clay400 = Color(0xFFD8674A);
  static const Color clay500 = Color(0xFFC24C30);
  static const Color clay600 = Color(0xFF9E3A22);
  static const Color clay700 = Color(0xFF792C1A);
  static const Color clay800 = Color(0xFF552013);
  static const Color clay900 = Color(0xFF38150C);

  // Primitives - Sky (Escrow / Buyer-side actions)
  static const Color sky50  = Color(0xFFEEF5F7);
  static const Color sky100 = Color(0xFFD3E6EB);
  static const Color sky200 = Color(0xFFA8CDD7);
  static const Color sky300 = Color(0xFF77AFBE);
  static const Color sky400 = Color(0xFF4C8FA1);
  static const Color sky500 = Color(0xFF347284);
  static const Color sky600 = Color(0xFF285A68);
  static const Color sky700 = Color(0xFF1E4450);
  static const Color sky800 = Color(0xFF152F38);
  static const Color sky900 = Color(0xFF0D1E24);

  // Primitives - Neutral
  static const Color neutral0    = Color(0xFFFFFFFF);
  static const Color neutral50   = Color(0xFFFAF9F6);
  static const Color neutral100  = Color(0xFFF2F0EA);
  static const Color neutral200  = Color(0xFFE5E1D6);
  static const Color neutral300  = Color(0xFFD0CABA);
  static const Color neutral400  = Color(0xFFA9A190);
  static const Color neutral500  = Color(0xFF83786A);
  static const Color neutral600  = Color(0xFF635A4E);
  static const Color neutral700  = Color(0xFF463F37);
  static const Color neutral800  = Color(0xFF2C2723);
  static const Color neutral900  = Color(0xFF1A1714);
  static const Color neutral1000 = Color(0xFF0F0D0B);

  // Semantic - Light
  static const Color surfaceBaseLight         = neutral50;
  static const Color surfaceRaisedLight       = neutral0;
  static const Color surfaceSunkenLight       = neutral100;
  static const Color borderDefaultLight       = neutral200;
  static const Color borderStrongLight        = neutral400;
  static const Color textPrimaryLight         = neutral900;
  static const Color textSecondaryLight       = neutral600;
  static const Color textDisabledLight        = neutral400;
  static const Color textOnAccentLight        = neutral0;
  static const Color brandPrimaryLight        = green600;
  static const Color brandPrimaryHoverLight   = green700;
  static const Color brandPrimaryPressedLight = green800;
  static const Color brandSecondaryLight      = soil500;
  static const Color accentMoneyLight         = amber500;
  static const Color accentMoneyStrongLight   = amber700;
  static const Color actionBuyLight           = sky500;
  static const Color actionSellLight          = green600;
  static const Color statusSuccessLight       = green500;
  static const Color statusSuccessBgLight     = green50;
  static const Color statusWarningLight       = amber500;
  static const Color statusWarningBgLight     = amber50;
  static const Color statusDangerLight        = clay500;
  static const Color statusDangerBgLight      = clay50;
  static const Color statusEscrowLockedLight  = sky600;
  static const Color statusEscrowLockedBgLight= sky50;
  static const Color focusRingLight           = sky400;

  // Semantic - Dark
  static const Color surfaceBaseDark          = neutral900;
  static const Color surfaceRaisedDark        = neutral800;
  static const Color surfaceSunkenDark        = neutral1000;
  static const Color borderDefaultDark        = neutral700;
  static const Color borderStrongDark         = neutral500;
  static const Color textPrimaryDark          = neutral50;
  static const Color textSecondaryDark        = neutral300;
  static const Color textDisabledDark         = neutral600;
  static const Color textOnAccentDark         = neutral900;
  static const Color brandPrimaryDark         = green400;
  static const Color brandPrimaryHoverDark    = green300;
  static const Color brandPrimaryPressedDark  = green200;
  static const Color brandSecondaryDark       = soil300;
  static const Color accentMoneyDark          = amber300;
  static const Color accentMoneyStrongDark    = amber200;
  static const Color actionBuyDark            = sky300;
  static const Color actionSellDark           = green400;
  static const Color statusSuccessDark        = green300;
  static const Color statusSuccessBgDark      = green900;
  static const Color statusWarningDark        = amber300;
  static const Color statusWarningBgDark      = amber900;
  static const Color statusDangerDark         = clay300;
  static const Color statusDangerBgDark       = clay900;
  static const Color statusEscrowLockedDark   = sky300;
  static const Color statusEscrowLockedBgDark = sky900;
  static const Color focusRingDark            = sky300;
}

/// 4px Base Spacing Scale
class KLSpacing {
  static const double s0  = 0;
  static const double s1  = 4;
  static const double s2  = 8;
  static const double s3  = 12;
  static const double s4  = 16;
  static const double s5  = 20;
  static const double s6  = 24;
  static const double s8  = 32;
  static const double s10 = 40;
  static const double s12 = 48;
  static const double s16 = 64;
  static const double s20 = 80;
  static const double s24 = 96;
}

/// Border Radii
class KLRadius {
  static const double none = 0;
  static const double sm   = 4;
  static const double md   = 8;
  static const double lg   = 12;
  static const double pill = 999;
}

/// Touch Targets
class KLTouchTarget {
  static const double minimum = 44.0;
}

/// Motion Durations
class KLMotion {
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration base = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 320);
}
