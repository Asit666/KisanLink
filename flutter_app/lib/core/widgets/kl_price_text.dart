import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/kisanlink_tokens.dart';

/// Monospace Price & Financial Metric Display Widget
/// Per KisanLink Design Principles:
/// 1. Uses IBM Plex Mono for clean tabular alignment.
/// 2. Dedicated amber accenting for financial figures.
/// 3. Always rendered with an explicit unit (e.g. ₹/kg, ₹/quintal).
class KLPriceText extends StatelessWidget {
  final num amount;
  final String unit;
  final String currency;
  final bool isLarge;
  final Color? color;
  final int decimalDigits;

  const KLPriceText({
    super.key,
    required this.amount,
    required this.unit,
    this.currency = '₹',
    this.isLarge = false,
    this.color,
    this.decimalDigits = 2,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? KLColors.accentMoneyLight;
    final formattedAmount = amount.toStringAsFixed(decimalDigits);

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(
          currency,
          style: GoogleFonts.ibmPlexMono(
            fontSize: isLarge ? 20 : 13,
            fontWeight: FontWeight.w600,
            color: effectiveColor,
          ),
        ),
        const SizedBox(width: 2),
        Text(
          formattedAmount,
          style: GoogleFonts.ibmPlexMono(
            fontSize: isLarge ? 28 : 16,
            fontWeight: FontWeight.w700,
            color: effectiveColor,
          ),
        ),
        if (unit.isNotEmpty) ...[
          const SizedBox(width: 3),
          Text(
            unit.startsWith('/') ? unit : '/$unit',
            style: GoogleFonts.inter(
              fontSize: isLarge ? 14 : 12,
              fontWeight: FontWeight.w500,
              color: KLColors.textSecondaryLight,
            ),
          ),
        ],
      ],
    );
  }
}
