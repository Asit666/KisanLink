import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';
import '../../../models/price.dart';

class MarketPricesCard extends StatelessWidget {
  final List<MandiPrice> prices;
  final VoidCallback? onRefresh;

  const MarketPricesCard({
    super.key,
    required this.prices,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('LIVE MANDI QUOTES', style: AppTypography.labelSmall),
                    const SizedBox(height: 2),
                    Text('Benchmark APMC Rates', style: AppTypography.titleMedium),
                  ],
                ),
                if (onRefresh != null)
                  IconButton(
                    icon: const Icon(Icons.refresh_rounded, size: 20, color: AppColors.textSecondary),
                    onPressed: onRefresh,
                    tooltip: 'Refresh prices',
                  ),
              ],
            ),
            const SizedBox(height: 16),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: prices.length,
              separatorBuilder: (_, __) => const Divider(color: AppColors.borderSubtle, height: 16),
              itemBuilder: (context, index) {
                final price = prices[index];
                final isAbove = price.isAboveMsp;

                return Row(
                  children: [
                    Expanded(
                      flex: 4,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            price.cropName,
                            style: AppTypography.bodyMedium.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            '${price.marketName}, ${price.state}',
                            style: AppTypography.monoCode.copyWith(fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    if (isAbove != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          color: isAbove ? AppColors.accentSage : AppColors.warningAmberBg,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isAbove ? 'ABOVE MSP' : 'BELOW MSP',
                          style: AppTypography.monoCode.copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: isAbove ? AppColors.accentForest : AppColors.warningAmber,
                          ),
                        ),
                      ),
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${currencyFormat.format(price.modalPrice)}/qtl',
                            style: AppTypography.monoPrice,
                          ),
                          Text(
                            'Range: ${currencyFormat.format(price.minPrice)} - ${currencyFormat.format(price.maxPrice)}',
                            style: AppTypography.monoCode.copyWith(fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
