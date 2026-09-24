import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/kisanlink_tokens.dart';

enum KLStatusType {
  success,
  warning,
  danger,
  escrowLocked,
}

/// Pill-shaped Semantic Status Badge Widget
/// Enforces KisanLink Design System rules:
/// - Distinct background and foreground token colors.
/// - Rounded pill shape (radius 999).
/// - Always accompanied by a text label (never icon-only).
class KLStatusChip extends StatelessWidget {
  final String label;
  final KLStatusType type;
  final IconData? leadingIcon;

  const KLStatusChip({
    super.key,
    required this.label,
    this.type = KLStatusType.success,
    this.leadingIcon,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;

    switch (type) {
      case KLStatusType.success:
        bg = KLColors.statusSuccessBgLight;
        fg = KLColors.statusSuccessLight;
        break;
      case KLStatusType.warning:
        bg = KLColors.statusWarningBgLight;
        fg = KLColors.statusWarningLight;
        break;
      case KLStatusType.danger:
        bg = KLColors.statusDangerBgLight;
        fg = KLColors.statusDangerLight;
        break;
      case KLStatusType.escrowLocked:
        bg = KLColors.statusEscrowLockedBgLight;
        fg = KLColors.statusEscrowLockedLight;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(KLRadius.pill),
        border: Border.all(color: fg.withOpacity(0.25), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leadingIcon != null) ...[
            Icon(leadingIcon, size: 12, color: fg),
            const SizedBox(width: 4),
          ],
          Text(
            label.toUpperCase(),
            style: GoogleFonts.ibmPlexMono(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}
