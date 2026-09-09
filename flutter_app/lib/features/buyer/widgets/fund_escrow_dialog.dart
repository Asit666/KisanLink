import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';

class FundEscrowDialog extends StatelessWidget {
  final String dealId;
  final String beneficiary;
  final String commodity;
  final double amount;
  final VoidCallback onFunded;

  const FundEscrowDialog({
    super.key,
    required this.dealId,
    required this.beneficiary,
    required this.commodity,
    required this.amount,
    required this.onFunded,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 480),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.accentForest,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.shield_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ESCROW PROTECTION VAULT', style: AppTypography.labelSmall),
                        Text('Lock Sourcing Funds', style: AppTypography.titleMedium),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: AppColors.borderSubtle),
            const SizedBox(height: 16),

            // Deal Summary Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.bgCanvas,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                children: [
                  _buildSummaryRow('Deal Reference:', dealId),
                  const SizedBox(height: 8),
                  _buildSummaryRow('Beneficiary:', beneficiary),
                  const SizedBox(height: 8),
                  _buildSummaryRow('Commodity Lot:', commodity),
                  const Divider(color: AppColors.borderSubtle, height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Required Escrow Hold:', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                      Text(
                        currencyFormat.format(amount),
                        style: AppTypography.monoPriceLarge.copyWith(fontSize: 20, color: AppColors.accentForest),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Escrow Guarantee Terms
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.accentSage.withOpacity(0.5),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.accentForest.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.verified_user_rounded, color: AppColors.accentForest, size: 16),
                      const SizedBox(width: 6),
                      Text('TRI-PARTY ESCROW GUARANTEE', style: AppTypography.labelSmall.copyWith(color: AppColors.accentForest)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '1. Funds are locked securely under RBI-regulated partner nodal account.\n'
                    '2. Farmer/FPO cannot withdraw until you verify Proof of Delivery.\n'
                    '3. Quality discrepancies entitle buyer to mediated partial/full refund.',
                    style: AppTypography.monoCode.copyWith(fontSize: 10, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () {
                    onFunded();
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Escrow locked: ${currencyFormat.format(amount)} for Deal $dealId'),
                        backgroundColor: AppColors.accentForest,
                      ),
                    );
                  },
                  icon: const Icon(Icons.lock_outline_rounded, size: 16),
                  label: const Text('Authorize & Lock Escrow'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.bodyMedium.copyWith(fontSize: 12)),
        Text(value, style: AppTypography.monoCode.copyWith(fontSize: 12, fontWeight: FontWeight.w700)),
      ],
    );
  }
}
