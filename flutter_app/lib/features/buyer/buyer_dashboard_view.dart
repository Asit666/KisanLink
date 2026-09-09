import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/providers.dart';
import '../../app/theme.dart';
import 'widgets/fund_escrow_dialog.dart';
import 'widgets/negotiate_offer_dialog.dart';

class BuyerLot {
  final String lotId;
  final String cropName;
  final String hub;
  final double quantityQuintals;
  final double askingPrice;
  final String grade;

  BuyerLot({
    required this.lotId,
    required this.cropName,
    required this.hub,
    required this.quantityQuintals,
    required this.askingPrice,
    required this.grade,
  });
}

class BuyerDeal {
  final String dealId;
  final String beneficiary;
  final String commodity;
  final double amount;
  String status; // 'AWAITING_ESCROW', 'ESCROW_LOCKED', 'DELIVERED'

  BuyerDeal({
    required this.dealId,
    required this.beneficiary,
    required this.commodity,
    required this.amount,
    required this.status,
  });
}

class BuyerDashboardView extends ConsumerStatefulWidget {
  const BuyerDashboardView({super.key});

  @override
  ConsumerState<BuyerDashboardView> createState() => _BuyerDashboardViewState();
}

class _BuyerDashboardViewState extends ConsumerState<BuyerDashboardView> {
  int _activeTab = 0; // 0: Verified Lots, 1: Deals & Escrow

  final List<BuyerLot> _lots = [
    BuyerLot(
      lotId: 'LP-SOY-2026-01',
      cropName: 'Soybean (JS-335)',
      hub: 'Khargone FPO Hub',
      quantityQuintals: 250.0,
      askingPrice: 4750.0,
      grade: 'FAQ Grade A',
    ),
    BuyerLot(
      lotId: 'LP-ONI-2026-02',
      cropName: 'Red Onion (Garwa)',
      hub: 'Nashik Lasalgaon Yard',
      quantityQuintals: 400.0,
      askingPrice: 2180.0,
      grade: 'Export Grade 55mm',
    ),
    BuyerLot(
      lotId: 'LP-WHT-2026-03',
      cropName: 'Sharbati Wheat',
      hub: 'Sehore Mandi Hub',
      quantityQuintals: 180.0,
      askingPrice: 3450.0,
      grade: 'FAQ Premium',
    ),
    BuyerLot(
      lotId: 'LP-COT-2026-04',
      cropName: 'Cotton (Medium Staple)',
      hub: 'Rajkot Cotton Yard',
      quantityQuintals: 300.0,
      askingPrice: 7150.0,
      grade: 'CCI Certified',
    ),
  ];

  final List<BuyerDeal> _deals = [
    BuyerDeal(
      dealId: 'DL-9081',
      beneficiary: 'Nashik Krishi Vikas FPO',
      commodity: 'Red Onion (400 qtl)',
      amount: 872000.0,
      status: 'AWAITING_ESCROW',
    ),
    BuyerDeal(
      dealId: 'DL-9082',
      beneficiary: 'Khargone Kisan Samiti',
      commodity: 'Soybean JS-335 (250 qtl)',
      amount: 1187500.0,
      status: 'ESCROW_LOCKED',
    ),
  ];

  void _openBidDialog(BuyerLot lot) {
    showDialog(
      context: context,
      builder: (_) => NegotiateOfferDialog(
        lotId: lot.lotId,
        cropName: lot.cropName,
        availableQuantity: lot.quantityQuintals,
        askingPrice: lot.askingPrice,
        onSubmitOffer: (data) {
          setState(() {
            _deals.insert(
              0,
              BuyerDeal(
                dealId: 'DL-${9080 + _deals.length + 1}',
                beneficiary: lot.hub,
                commodity: '${lot.cropName} (${data["bidQuantity"]} qtl)',
                amount: data['totalOutlay'] as double,
                status: 'AWAITING_ESCROW',
              ),
            );
          });
        },
      ),
    );
  }

  void _openFundEscrowDialog(BuyerDeal deal) {
    showDialog(
      context: context,
      builder: (_) => FundEscrowDialog(
        dealId: deal.dealId,
        beneficiary: deal.beneficiary,
        commodity: deal.commodity,
        amount: deal.amount,
        onFunded: () {
          setState(() {
            deal.status = 'ESCROW_LOCKED';
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;

    final lockedBalance = _deals
        .where((d) => d.status == 'ESCROW_LOCKED')
        .fold<double>(0, (sum, d) => sum + d.amount);

    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Banner
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
                      color: AppColors.accentTerra.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.storefront_rounded, color: AppColors.accentTerra, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'ITC Agro Foods (Procurement)', style: AppTypography.titleLarge),
                      const SizedBox(height: 4),
                      Text(
                        'Direct Wholesale Sourcing • Escrow-Guaranteed Settlement • Verified FPO Lots',
                        style: AppTypography.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Sourcing Metrics
            Row(
              children: [
                _buildStatCard('VERIFIED LOTS AVAILABLE', '${_lots.length} Lots Ready', Icons.inventory_2_outlined),
                const SizedBox(width: 16),
                _buildStatCard('ESCROW LOCKED BALANCE', '₹ ${lockedBalance.toStringAsFixed(0)}', Icons.lock_outline_rounded),
                const SizedBox(width: 16),
                _buildStatCard('ACTIVE CONTRACTS', '${_deals.length} Sourcing Deals', Icons.assignment_outlined),
              ],
            ),
            const SizedBox(height: 24),

            // Navigation Tabs
            Row(
              children: [
                _buildTabButton(0, 'Available Verified Lots (${_lots.length})'),
                const SizedBox(width: 8),
                _buildTabButton(1, 'Procurement Deals & Escrow (${_deals.length})'),
              ],
            ),
            const SizedBox(height: 16),

            // Content Body
            if (_activeTab == 0) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('MARKET AGGREGATION DESK', style: AppTypography.labelSmall),
                      Text('Available Verified Farm Lots for Procurement', style: AppTypography.titleMedium),
                      const SizedBox(height: 16),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _lots.length,
                        separatorBuilder: (_, __) => const Divider(color: AppColors.borderSubtle, height: 16),
                        itemBuilder: (context, index) {
                          final lot = _lots[index];
                          return Row(
                            children: [
                              Expanded(
                                flex: 4,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(lot.cropName, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                                    Text('${lot.hub} • ${lot.grade} • ID: ${lot.lotId}', style: AppTypography.monoCode.copyWith(fontSize: 11)),
                                  ],
                                ),
                              ),
                              Expanded(
                                flex: 2,
                                child: Text('${lot.quantityQuintals} qtl', style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700)),
                              ),
                              Expanded(
                                flex: 2,
                                child: Text('₹ ${lot.askingPrice.toStringAsFixed(0)}/qtl', style: AppTypography.monoPrice.copyWith(fontSize: 14)),
                              ),
                              ElevatedButton(
                                onPressed: () => _openBidDialog(lot),
                                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)),
                                child: const Text('Bid / Negotiate', style: TextStyle(fontSize: 12)),
                              ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('CONTRACT SETTLEMENTS', style: AppTypography.labelSmall),
                      Text('Escrow-Backed Procurement Deals', style: AppTypography.titleMedium),
                      const SizedBox(height: 16),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _deals.length,
                        separatorBuilder: (_, __) => const Divider(color: AppColors.borderSubtle, height: 16),
                        itemBuilder: (context, index) {
                          final deal = _deals[index];
                          final isLocked = deal.status == 'ESCROW_LOCKED';

                          return Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.bgCanvas,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: AppColors.borderSubtle),
                                ),
                                child: Text(deal.dealId, style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                flex: 4,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(deal.commodity, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                                    Text(deal.beneficiary, style: AppTypography.monoCode.copyWith(fontSize: 11)),
                                  ],
                                ),
                              ),
                              Expanded(
                                flex: 2,
                                child: Text('₹ ${deal.amount.toStringAsFixed(0)}', style: AppTypography.monoPrice.copyWith(fontSize: 14)),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                margin: const EdgeInsets.only(right: 12),
                                decoration: BoxDecoration(
                                  color: isLocked ? AppColors.accentSage : AppColors.warningAmberBg,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  deal.status,
                                  style: AppTypography.monoCode.copyWith(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isLocked ? AppColors.accentForest : AppColors.warningAmber,
                                  ),
                                ),
                              ),
                              if (!isLocked)
                                ElevatedButton.icon(
                                  onPressed: () => _openFundEscrowDialog(deal),
                                  icon: const Icon(Icons.lock_rounded, size: 14),
                                  label: const Text('Fund Escrow', style: TextStyle(fontSize: 11)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.accentForest,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  ),
                                ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String label) {
    final isActive = _activeTab == index;
    return InkWell(
      onTap: () => setState(() => _activeTab = index),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.accentTerra : AppColors.bgSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isActive ? AppColors.accentTerra : AppColors.borderSubtle),
        ),
        child: Text(
          label,
          style: AppTypography.bodyMedium.copyWith(
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
            color: isActive ? Colors.white : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
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
