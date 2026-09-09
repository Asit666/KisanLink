import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';
import '../../../models/prediction.dart';

class AiForecastCard extends StatelessWidget {
  final PricePrediction prediction;

  const AiForecastCard({
    super.key,
    required this.prediction,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Card(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.borderSubtle),
          gradient: const LinearGradient(
            colors: [Color(0xFFFFFFFF), Color(0xFFFAF7F0)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.accentForest.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(
                        Icons.auto_graph_rounded,
                        color: AppColors.accentForest,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('AI MANDI FORECAST', style: AppTypography.labelSmall),
                        Text(prediction.cropName, style: AppTypography.titleMedium),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: prediction.isBullish ? AppColors.accentSage : AppColors.errorRedBg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        prediction.isBullish ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                        size: 14,
                        color: prediction.isBullish ? AppColors.accentForest : AppColors.errorRed,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${prediction.trend} (${prediction.confidencePercent}%)',
                        style: AppTypography.monoCode.copyWith(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: prediction.isBullish ? AppColors.accentForest : AppColors.errorRed,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Forecast Milestone Horizon Grid
            Row(
              children: [
                _ForecastTile(
                  label: 'CURRENT MODAL',
                  price: currencyFormat.format(prediction.currentPrice),
                  isCurrent: true,
                ),
                const SizedBox(width: 8),
                _ForecastTile(
                  label: '+7 DAYS',
                  price: currencyFormat.format(prediction.forecastPrice7d),
                ),
                const SizedBox(width: 8),
                _ForecastTile(
                  label: '+15 DAYS',
                  price: currencyFormat.format(prediction.forecastPrice15d),
                ),
                const SizedBox(width: 8),
                _ForecastTile(
                  label: '+30 DAYS',
                  price: currencyFormat.format(prediction.forecastPrice30d),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Strategic Agro Recommendation
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.accentTerraSubtle,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.accentTerra.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lightbulb_outline_rounded, color: AppColors.accentTerra, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      prediction.recommendation,
                      style: AppTypography.bodyMedium.copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.accentTerraHover,
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

class _ForecastTile extends StatelessWidget {
  final String label;
  final String price;
  final bool isCurrent;

  const _ForecastTile({
    required this.label,
    required this.price,
    this.isCurrent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isCurrent ? AppColors.bgCanvas : Colors.white,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isCurrent ? AppColors.borderStrong : AppColors.borderSubtle,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelSmall.copyWith(fontSize: 9)),
            const SizedBox(height: 4),
            Text(
              price,
              style: AppTypography.monoPrice.copyWith(
                fontSize: 14,
                color: isCurrent ? AppColors.textSecondary : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
