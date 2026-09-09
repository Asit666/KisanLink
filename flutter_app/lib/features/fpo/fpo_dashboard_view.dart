import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/providers.dart';
import '../../app/theme.dart';
import 'widgets/create_weigh_slip_dialog.dart';
import 'widgets/lot_passport_dialog.dart';

class FpoDashboardView extends ConsumerStatefulWidget {
  const FpoDashboardView({super.key});

  @override
  ConsumerState<FpoDashboardView> createState() => _FpoDashboardViewState();
}

class _FpoDashboardViewState extends ConsumerState<FpoDashboardView> {
  int _activeTab = 0; // 0: Intake Ledger, 1: Pooled Lots, 2: Member Directory
  String _filterStatus = 'ALL'; // 'ALL', 'UNPOOLED', 'POOLED'

  late List<WeighSlipEntry> _slips;

  @override
  void initState() {
    super.initState();
    _slips = [
      WeighSlipEntry(
        slipNo: 'WS-1049',
        farmerName: 'Ramesh Patel',
        phone: '9876543210',
        cropName: 'Soybean (JS-335)',
        grade: 'FAQ Grade A',
        grossWeight: 48.5,
        tareWeight: 3.5,
        netWeight: 45.0,
        moisturePercent: 10.4,
        foreignMatterPercent: 1.1,
        date: '10 Sep 2026, 09:30 AM',
        status: 'POOLED',
      ),
      WeighSlipEntry(
        slipNo: 'WS-1050',
        farmerName: 'Suresh Deshmukh',
        phone: '9823145678',
        cropName: 'Red Onion (Garwa)',
        grade: 'Export Grade 55mm',
        grossWeight: 63.8,
        tareWeight: 3.8,
        netWeight: 60.0,
        moisturePercent: 11.2,
        foreignMatterPercent: 0.9,
        date: '10 Sep 2026, 10:15 AM',
        status: 'POOLED',
      ),
      WeighSlipEntry(
        slipNo: 'WS-1051',
        farmerName: 'Mukesh Yadav',
        phone: '9754123980',
        cropName: 'Soybean (JS-335)',
        grade: 'Commercial Grade B',
        grossWeight: 38.0,
        tareWeight: 3.0,
        netWeight: 35.0,
        moisturePercent: 12.8,
        foreignMatterPercent: 2.1,
        date: '10 Sep 2026, 11:00 AM',
        status: 'UNPOOLED',
      ),
      WeighSlipEntry(
        slipNo: 'WS-1052',
        farmerName: 'Anita Bai',
        phone: '9425098765',
        cropName: 'Wheat (Sharbati)',
        grade: 'FAQ Grade A',
        grossWeight: 52.0,
        tareWeight: 4.0,
        netWeight: 48.0,
        moisturePercent: 9.8,
        foreignMatterPercent: 0.8,
        date: '10 Sep 2026, 11:45 AM',
        status: 'UNPOOLED',
      ),
    ];
  }

  void _openCreateSlipDialog() {
    showDialog(
      context: context,
      builder: (_) => CreateWeighSlipDialog(
        onCreated: (newSlip) {
          setState(() {
            _slips.insert(0, newSlip);
          });
        },
      ),
    );
  }

  void _openLotPassport(String lotId, String crop, String grade, double qty, int farmers, double moisture) {
    showDialog(
      context: context,
      builder: (_) => LotPassportDialog(
        lotId: lotId,
        cropName: crop,
        grade: grade,
        totalQuintals: qty,
        farmerCount: farmers,
        avgMoisture: moisture,
        poolingDate: '10 Sep 2026',
      ),
    );
  }

  void _poolAllUnpooled() {
    int unpooledCount = _slips.where((s) => s.status == 'UNPOOLED').length;
    if (unpooledCount == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No unpooled entries to aggregate.')),
      );
      return;
    }

    setState(() {
      _slips = _slips.map((s) {
        if (s.status == 'UNPOOLED') {
          return WeighSlipEntry(
            slipNo: s.slipNo,
            farmerName: s.farmerName,
            phone: s.phone,
            cropName: s.cropName,
            grade: s.grade,
            grossWeight: s.grossWeight,
            tareWeight: s.tareWeight,
            netWeight: s.netWeight,
            moisturePercent: s.moisturePercent,
            foreignMatterPercent: s.foreignMatterPercent,
            date: s.date,
            status: 'POOLED',
          );
        }
        return s;
      }).toList();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Successfully pooled $unpooledCount intake entries into a new Commercial Lot!'),
        backgroundColor: AppColors.accentForest,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= 900;

    final filteredSlips = _slips.where((s) {
      if (_filterStatus == 'ALL') return true;
      return s.status == _filterStatus;
    }).toList();

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
                        child: const Icon(Icons.corporate_fare_rounded, color: AppColors.accentForest, size: 28),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user?.name ?? 'Nashik Krishi Vikas FPO Desk', style: AppTypography.titleLarge),
                          const SizedBox(height: 4),
                          Text(
                            'Village Aggregation Hub • Digital Weigh-Slip Intake • Quality Batch Pooling',
                            style: AppTypography.bodyMedium,
                          ),
                        ],
                      ),
                    ],
                  ),
                  if (isDesktop)
                    ElevatedButton.icon(
                      onPressed: _openCreateSlipDialog,
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: const Text('Log New Weigh-Slip'),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Aggregation Metrics
            Row(
              children: [
                _buildStatCard('TOTAL INTAKE VOLUME', '${_slips.fold<double>(0, (sum, s) => sum + s.netWeight).toStringAsFixed(1)} qtl', Icons.scale_outlined),
                const SizedBox(width: 16),
                _buildStatCard('UNPOOLED INTAKES', '${_slips.where((s) => s.status == "UNPOOLED").length} Slips', Icons.pending_actions_rounded),
                const SizedBox(width: 16),
                _buildStatCard('COMMERCIAL LOTS', '3 Ready Lots', Icons.inventory_2_outlined),
              ],
            ),
            const SizedBox(height: 24),

            // Navigation Tabs
            Row(
              children: [
                _buildTabButton(0, 'Intake Ledger (${_slips.length})'),
                const SizedBox(width: 8),
                _buildTabButton(1, 'Pooled Lots & Passports (3)'),
                const SizedBox(width: 8),
                _buildTabButton(2, 'Member Directory (342)'),
              ],
            ),
            const SizedBox(height: 16),

            // Tab Content
            if (_activeTab == 0) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Sub-header with Filter Pills and Pool Action
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              _buildFilterPill('ALL (${_slips.length})', 'ALL'),
                              const SizedBox(width: 8),
                              _buildFilterPill('UNPOOLED (${_slips.where((s) => s.status == "UNPOOLED").length})', 'UNPOOLED'),
                              const SizedBox(width: 8),
                              _buildFilterPill('POOLED (${_slips.where((s) => s.status == "POOLED").length})', 'POOLED'),
                            ],
                          ),
                          Row(
                            children: [
                              OutlinedButton.icon(
                                onPressed: _poolAllUnpooled,
                                icon: const Icon(Icons.layers_rounded, size: 16),
                                label: const Text('Pool Unpooled'),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton.icon(
                                onPressed: _openCreateSlipDialog,
                                icon: const Icon(Icons.add_rounded, size: 16),
                                label: const Text('New Slip'),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(color: AppColors.borderSubtle),
                      const SizedBox(height: 8),

                      // Intake Ledger Table
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filteredSlips.length,
                        separatorBuilder: (_, __) => const Divider(color: AppColors.borderSubtle, height: 16),
                        itemBuilder: (context, index) {
                          final slip = filteredSlips[index];
                          final isPooled = slip.status == 'POOLED';

                          return Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.bgCanvas,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: AppColors.borderSubtle),
                                ),
                                child: Text(slip.slipNo, style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                flex: 4,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(slip.farmerName, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                                    Text('${slip.cropName} • ${slip.grade} • Mo: ${slip.moisturePercent}%', style: AppTypography.monoCode.copyWith(fontSize: 11)),
                                  ],
                                ),
                              ),
                              Expanded(
                                flex: 2,
                                child: Text('${slip.netWeight} qtl', style: AppTypography.monoPrice.copyWith(fontSize: 14)),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                margin: const EdgeInsets.only(right: 12),
                                decoration: BoxDecoration(
                                  color: isPooled ? AppColors.accentSage : AppColors.warningAmberBg,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  slip.status,
                                  style: AppTypography.monoCode.copyWith(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isPooled ? AppColors.accentForest : AppColors.warningAmber,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.qr_code_2_rounded, size: 20, color: AppColors.accentForest),
                                tooltip: 'View Lot Passport',
                                onPressed: () => _openLotPassport(
                                  'LP-${slip.slipNo}',
                                  slip.cropName,
                                  slip.grade,
                                  slip.netWeight,
                                  1,
                                  slip.moisturePercent,
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
            ] else if (_activeTab == 1) ...[
              // Pooled Lots Section
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('COMMERCIAL POOLED LOTS', style: AppTypography.labelSmall),
                      Text('Ready for Wholesale Auction & Institutional Bidding', style: AppTypography.titleMedium),
                      const SizedBox(height: 16),
                      _buildPooledLotItem('LP-SOY-2026-01', 'Soybean (JS-335)', 'FAQ Grade A', 250.0, 18, 10.2),
                      const Divider(color: AppColors.borderSubtle, height: 16),
                      _buildPooledLotItem('LP-ONI-2026-02', 'Red Onion (Garwa)', 'Export Grade 55mm', 400.0, 24, 11.0),
                      const Divider(color: AppColors.borderSubtle, height: 16),
                      _buildPooledLotItem('LP-WHT-2026-03', 'Wheat (Sharbati)', 'FAQ Grade A', 180.0, 12, 9.6),
                    ],
                  ),
                ),
              ),
            ] else ...[
              // Member Directory
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('REGISTERED PRODUCER MEMBERS', style: AppTypography.labelSmall),
                      Text('342 Enrolled Smallholder Farmers', style: AppTypography.titleMedium),
                      const SizedBox(height: 16),
                      _buildMemberRow('Ramesh Patel', 'Khargone', '18.5 Acres', 'Soybean, Wheat', 'KYC VERIFIED'),
                      const Divider(color: AppColors.borderSubtle, height: 16),
                      _buildMemberRow('Suresh Deshmukh', 'Dindori', '12.0 Acres', 'Onion, Grapes', 'KYC VERIFIED'),
                      const Divider(color: AppColors.borderSubtle, height: 16),
                      _buildMemberRow('Mukesh Yadav', 'Barwaha', '8.5 Acres', 'Soybean, Cotton', 'PENDING AADHAAR'),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
      floatingActionButton: !isDesktop
          ? FloatingActionButton.extended(
              onPressed: _openCreateSlipDialog,
              backgroundColor: AppColors.accentForest,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Log Weigh-Slip'),
            )
          : null,
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
          color: isActive ? AppColors.accentForest : AppColors.bgSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isActive ? AppColors.accentForest : AppColors.borderSubtle),
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

  Widget _buildFilterPill(String label, String status) {
    final isSelected = _filterStatus == status;
    return InkWell(
      onTap: () => setState(() => _filterStatus = status),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accentTerra : AppColors.bgCanvas,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? AppColors.accentTerra : AppColors.borderSubtle),
        ),
        child: Text(
          label,
          style: AppTypography.labelSmall.copyWith(
            color: isSelected ? Colors.white : AppColors.textPrimary,
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

  Widget _buildPooledLotItem(String lotId, String crop, String grade, double qty, int farmers, double moisture) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.accentSage,
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Icon(Icons.inventory_2_rounded, color: AppColors.accentForest, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 4,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(lotId, style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              Text('$crop • $grade • $farmers Farmers Aggregated', style: AppTypography.bodyMedium.copyWith(fontSize: 12)),
            ],
          ),
        ),
        Expanded(
          flex: 2,
          child: Text('$qty qtl', style: AppTypography.monoPrice.copyWith(fontSize: 14)),
        ),
        ElevatedButton.icon(
          onPressed: () => _openLotPassport(lotId, crop, grade, qty, farmers, moisture),
          icon: const Icon(Icons.qr_code_rounded, size: 16),
          label: const Text('Passport QR', style: TextStyle(fontSize: 12)),
        ),
      ],
    );
  }

  Widget _buildMemberRow(String name, String village, String acreage, String crops, String status) {
    final isKyc = status.contains('VERIFIED');
    return Row(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: AppColors.accentTerraSubtle,
          child: Text(name[0], style: AppTypography.titleMedium.copyWith(fontSize: 12, color: AppColors.accentTerra)),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 4,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
              Text('Village $village • $acreage • Crops: $crops', style: AppTypography.monoCode.copyWith(fontSize: 11)),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isKyc ? AppColors.accentSage : AppColors.warningAmberBg,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            status,
            style: AppTypography.monoCode.copyWith(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: isKyc ? AppColors.accentForest : AppColors.warningAmber,
            ),
          ),
        ),
      ],
    );
  }
}
