import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/providers.dart';
import '../../app/theme.dart';

class AdminDashboardView extends ConsumerWidget {
  const AdminDashboardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.textPrimary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.admin_panel_settings_rounded, color: AppColors.textPrimary, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'KisanLink Platform Administration', style: AppTypography.titleLarge),
                      const SizedBox(height: 4),
                      Text(
                        'Governance & Compliance • User Verification • Escrow Dispute Arbitration',
                        style: AppTypography.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // System Metrics
            Row(
              children: [
                _buildMetricCard('REGISTERED STAKEHOLDERS', '14,280', Icons.people_outline_rounded),
                const SizedBox(width: 16),
                _buildMetricCard('GROSS MERCHANDISE VALUE', '₹ 2.84 Cr', Icons.currency_rupee_rounded),
                const SizedBox(width: 16),
                _buildMetricCard('PENDING KYC VERIFICATIONS', '12 Audits', Icons.verified_user_outlined),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.bgSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: AppTypography.labelSmall),
                Icon(icon, size: 18, color: AppColors.textMuted),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, style: AppTypography.monoPriceLarge.copyWith(fontSize: 18)),
          ],
        ),
      ),
    );
  }
}
