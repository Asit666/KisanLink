import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kisanlink_app/app/theme.dart';
import 'package:kisanlink_app/core/widgets/kl_price_text.dart';
import 'package:kisanlink_app/core/widgets/kl_status_chip.dart';
import 'package:kisanlink_app/theme/kisanlink_tokens.dart';

void main() {
  setUpAll(() {
    // Disable HTTP runtime font fetching in offline/headless tests
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  group('KisanLink Design System Tokens & Widgets Tests', () {
    test('KLColors maps accurately to tokens.json primitives and semantic aliases', () {
      // Primary brand green
      expect(KLColors.green600, const Color(0xFF3A7028));
      expect(KLColors.brandPrimaryLight, const Color(0xFF3A7028));

      // Amber money/price token
      expect(KLColors.amber500, const Color(0xFFD98C0A));
      expect(KLColors.accentMoneyLight, const Color(0xFFD98C0A));

      // Clay danger token
      expect(KLColors.clay500, const Color(0xFFC24C30));
      expect(KLColors.statusDangerLight, const Color(0xFFC24C30));

      // Sky escrow/buyer token
      expect(KLColors.sky600, const Color(0xFF285A68));
      expect(KLColors.statusEscrowLockedLight, const Color(0xFF285A68));
    });

    test('AppTheme lightTheme adheres to borders-over-shadows and tokens', () {
      final theme = AppTheme.lightTheme;
      expect(theme.useMaterial3, isTrue);
      expect(theme.colorScheme.primary, KLColors.brandPrimaryLight);
      expect(theme.colorScheme.surface, KLColors.surfaceRaisedLight);
      expect(theme.cardTheme.elevation, 0);
      expect(theme.scaffoldBackgroundColor, KLColors.surfaceBaseLight);
    });

    testWidgets('KLPriceText renders formatted monetary value and explicit unit', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: KLPriceText(
              amount: 2450.50,
              unit: 'quintal',
              isLarge: true,
            ),
          ),
        ),
      );

      expect(find.text('₹'), findsOneWidget);
      expect(find.text('2450.50'), findsOneWidget);
      expect(find.text('/quintal'), findsOneWidget);
    });

    testWidgets('KLStatusChip renders uppercase label with semantic token pairing', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: KLStatusChip(
              label: 'Escrow Locked',
              type: KLStatusType.escrowLocked,
            ),
          ),
        ),
      );

      expect(find.text('ESCROW LOCKED'), findsOneWidget);
    });
  });
}
