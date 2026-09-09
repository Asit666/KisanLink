import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../models/prediction.dart';
import 'widgets/ai_forecast_card.dart';
import 'widgets/create_listing_dialog.dart';
import 'widgets/market_prices_card.dart';

class FarmerDashboardView extends ConsumerWidget {
  const FarmerDashboardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;
    final livePricesAsync = ref.watch(livePricesFutureProvider);
    final listingsAsync = ref.watch(farmerListingsProvider);

    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= 950;

    final defaultPrediction = PricePrediction(
      cropName: 'Soybean (Yellow)',
      currentPrice: 4720.0,
      forecastPrice7d: 4850.0,
      forecastPrice15d: 4980.0,
      forecastPrice30d: 5120.0,
      trend: 'BULLISH',
      confidencePercent: 84,
      recommendation: 'STRONG AGMARKNET DEMAND. FAVORABLE TO HOLD 10-14 DAYS OR POOL WITH FPO.',
    );

    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Welcome & Quick Metric Banner
            _buildFarmerHeader(context, user?.name ?? 'Ramesh Patel'),
            const SizedBox(height: 24),

            // Responsive Layout Grid
            if (isDesktop)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left Column: AI Forecast & Produce Listings
                  Expanded(
                    flex: 6,
                    child: Column(
                      children: [
                        AiForecastCard(prediction: defaultPrediction),
                        const SizedBox(height: 20),
                        _buildListingsSection(context, listingsAsync),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),
                  // Right Column: Live Mandi Rates
                  Expanded(
                    flex: 5,
                    child: livePricesAsync.when(
                      data: (prices) => MarketPricesCard(
                        prices: prices,
                        onRefresh: () => ref.refresh(livePricesFutureProvider),
                      ),
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (err, _) => Center(child: Text('Error loading prices: $err')),
                    ),
                  ),
                ],
              )
            else
              Column(
                children: [
                  AiForecastCard(prediction: defaultPrediction),
                  const SizedBox(height: 20),
                  livePricesAsync.when(
                    data: (prices) => MarketPricesCard(
                      prices: prices,
                      onRefresh: () => ref.refresh(livePricesFutureProvider),
                    ),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Center(child: Text('Error: $err')),
                  ),
                  const SizedBox(height: 20),
                  _buildListingsSection(context, listingsAsync),
                ],
              ),
          ],
        ),
      ),
      floatingActionButton: !isDesktop
          ? FloatingActionButton.extended(
              onPressed: () => _openCreateListingDialog(context),
              backgroundColor: AppColors.accentTerra,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_rounded),
              label: const Text('List Harvest'),
            )
          : null,
    );
  }

  void _openCreateListingDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => const CreateListingDialog(),
    );
  }

  Widget _buildFarmerHeader(BuildContext context, String farmerName) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= 950;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.accentForest.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.agriculture_rounded, color: AppColors.accentForest, size: 28),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(farmerName, style: AppTypography.titleLarge),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.accentSage,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'KYC VERIFIED',
                          style: AppTypography.monoCode.copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.accentForest,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Village Khargone • Nimar Agromarket Region • 18.5 Acres Holding',
                    style: AppTypography.bodyMedium,
                  ),
                ],
              ),
            ],
          ),
          if (isDesktop)
            ElevatedButton.icon(
              onPressed: () => _openCreateListingDialog(context),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('List New Harvest Lot'),
            ),
        ],
      ),
    );
  }

  Widget _buildListingsSection(
    BuildContext context,
    AsyncValue<List<dynamic>> listingsAsync,
  ) {
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
                    Text('MY PRODUCE INVENTORY', style: AppTypography.labelSmall),
                    Text('Active Farm Gate Lots', style: AppTypography.titleMedium),
                  ],
                ),
                TextButton.icon(
                  onPressed: () => _openCreateListingDialog(context),
                  icon: const Icon(Icons.add_circle_outline_rounded, size: 18),
                  label: const Text('New Lot'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            listingsAsync.when(
              data: (listings) {
                if (listings.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: Text('No active lots registered. Click "New Lot" to create one.')),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: listings.length,
                  separatorBuilder: (_, __) => const Divider(color: AppColors.borderSubtle, height: 16),
                  itemBuilder: (context, index) {
                    final item = listings[index];
                    final isPooled = item.status == 'POOLED';

                    return Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.bgCanvas,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.borderSubtle),
                          ),
                          child: const Icon(Icons.inventory_2_outlined, color: AppColors.accentTerra, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 4,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.cropName,
                                style: AppTypography.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                '${item.variety} • ${item.qualityGrade}',
                                style: AppTypography.monoCode.copyWith(fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          margin: const EdgeInsets.only(right: 12),
                          decoration: BoxDecoration(
                            color: isPooled ? AppColors.infoBlueBg : AppColors.accentSage,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            item.status,
                            style: AppTypography.monoCode.copyWith(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: isPooled ? AppColors.infoBlue : AppColors.accentForest,
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${item.quantityQuintals} qtl @ ${currencyFormat.format(item.expectedPricePerQuintal)}',
                                style: AppTypography.monoPrice.copyWith(fontSize: 14),
                              ),
                              Text(
                                'Est: ${currencyFormat.format(item.totalValuation)}',
                                style: AppTypography.monoCode.copyWith(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.accentForest,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(child: Text('Error loading inventory: $err')),
            ),
          ],
        ),
      ),
    );
  }
}
