import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/providers.dart';
import '../../app/theme.dart';
import 'widgets/dispatch_tracking_sheet.dart';
import 'widgets/proof_of_delivery_dialog.dart';

class TransitManifest {
  final String orderId;
  final String origin;
  final String destination;
  final String cargo;
  final double loadedQuintals;
  final double freightPayout;
  final String vehicleNo;
  final String driverName;
  final String ewayBill;
  String status; // 'IN_TRANSIT', 'SCHEDULED', 'DELIVERED'

  TransitManifest({
    required this.orderId,
    required this.origin,
    required this.destination,
    required this.cargo,
    required this.loadedQuintals,
    required this.freightPayout,
    required this.vehicleNo,
    required this.driverName,
    required this.ewayBill,
    required this.status,
  });
}

class TransporterDashboardView extends ConsumerStatefulWidget {
  const TransporterDashboardView({super.key});

  @override
  ConsumerState<TransporterDashboardView> createState() => _TransporterDashboardViewState();
}

class _TransporterDashboardViewState extends ConsumerState<TransporterDashboardView> {
  final List<TransitManifest> _manifests = [
    TransitManifest(
      orderId: 'WB-7809',
      origin: 'Nashik FPO Hub, Maharashtra',
      destination: 'Azadpur APMC Yard, Delhi',
      cargo: 'Red Onion (Garwa Grade A)',
      loadedQuintals: 400.0,
      freightPayout: 88000.0,
      vehicleNo: 'MH-15-EG-4910',
      driverName: 'Balwant Singh',
      ewayBill: '8901234710',
      status: 'IN_TRANSIT',
    ),
    TransitManifest(
      orderId: 'WB-7812',
      origin: 'Khargone Gate, Madhya Pradesh',
      destination: 'Indore Processing Mill, MP',
      cargo: 'Soybean (JS-335 Grade A)',
      loadedQuintals: 250.0,
      freightPayout: 32500.0,
      vehicleNo: 'MP-09-KA-8812',
      driverName: 'Vikram Yadav',
      ewayBill: '8901234988',
      status: 'SCHEDULED',
    ),
    TransitManifest(
      orderId: 'WB-7805',
      origin: 'Sehore Mandi Hub, MP',
      destination: 'Bhopal Agro Terminal, MP',
      cargo: 'Wheat (Sharbati)',
      loadedQuintals: 180.0,
      freightPayout: 19800.0,
      vehicleNo: 'MP-04-HE-2144',
      driverName: 'Gopal Meena',
      ewayBill: '8901234612',
      status: 'DELIVERED',
    ),
  ];

  void _openTracking(TransitManifest manifest) {
    showDialog(
      context: context,
      builder: (_) => DispatchTrackingSheet(
        orderId: manifest.orderId,
        origin: manifest.origin,
        destination: manifest.destination,
        cargo: manifest.cargo,
        vehicleNo: manifest.vehicleNo,
        driverName: manifest.driverName,
        ewayBill: manifest.ewayBill,
        status: manifest.status,
      ),
    );
  }

  void _openProofOfDelivery(TransitManifest manifest) {
    showDialog(
      context: context,
      builder: (_) => ProofOfDeliveryDialog(
        orderId: manifest.orderId,
        cargo: manifest.cargo,
        loadedQuintals: manifest.loadedQuintals,
        freightPayout: manifest.freightPayout,
        onCompleted: () {
          setState(() {
            manifest.status = 'DELIVERED';
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;

    final inTransitCount = _manifests.where((m) => m.status == 'IN_TRANSIT').length;
    final totalEscrowEarnings = _manifests
        .where((m) => m.status == 'DELIVERED')
        .fold<double>(0, (sum, m) => sum + m.freightPayout);

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
                      color: AppColors.infoBlue.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.local_shipping_rounded, color: AppColors.infoBlue, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'Kisan Express Logistics', style: AppTypography.titleLarge),
                      const SizedBox(height: 4),
                      Text(
                        'Agri Fleet Operations • GST E-Way Bills • Escrow-Secured Freight Settlement',
                        style: AppTypography.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Fleet Metrics
            Row(
              children: [
                _buildStatCard('ACTIVE SHIPMENTS', '$inTransitCount In Transit', Icons.navigation_rounded),
                const SizedBox(width: 16),
                _buildStatCard('SETTLED ESCROW EARNINGS', '₹ ${totalEscrowEarnings.toStringAsFixed(0)}', Icons.currency_rupee_rounded),
                const SizedBox(width: 16),
                _buildStatCard('FLEET VEHICLES', '8 Trucks Registered', Icons.fire_truck_outlined),
              ],
            ),
            const SizedBox(height: 24),

            // Active Manifests Table
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('FLEET TRANSIT MANIFESTS', style: AppTypography.labelSmall),
                    Text('Consignment Dispatch Orders & Waybills', style: AppTypography.titleMedium),
                    const SizedBox(height: 16),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _manifests.length,
                      separatorBuilder: (_, __) => const Divider(color: AppColors.borderSubtle, height: 16),
                      itemBuilder: (context, index) {
                        final manifest = _manifests[index];
                        final isInTransit = manifest.status == 'IN_TRANSIT';
                        final isDelivered = manifest.status == 'DELIVERED';

                        return Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.bgCanvas,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: AppColors.borderSubtle),
                              ),
                              child: Text(manifest.orderId, style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              flex: 4,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${manifest.origin} ➔ ${manifest.destination}',
                                    style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                  ),
                                  Text(
                                    '${manifest.cargo} • ${manifest.vehicleNo} (${manifest.driverName})',
                                    style: AppTypography.monoCode.copyWith(fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Text(
                                '₹ ${manifest.freightPayout.toStringAsFixed(0)}',
                                style: AppTypography.monoPrice.copyWith(fontSize: 14, color: AppColors.accentForest),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              margin: const EdgeInsets.only(right: 12),
                              decoration: BoxDecoration(
                                color: isInTransit
                                    ? AppColors.infoBlueBg
                                    : (isDelivered ? AppColors.accentSage : AppColors.warningAmberBg),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                manifest.status,
                                style: AppTypography.monoCode.copyWith(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: isInTransit
                                      ? AppColors.infoBlue
                                      : (isDelivered ? AppColors.accentForest : AppColors.warningAmber),
                                ),
                              ),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => _openTracking(manifest),
                              icon: const Icon(Icons.gps_fixed_rounded, size: 14),
                              label: const Text('Track', style: TextStyle(fontSize: 12)),
                            ),
                            const SizedBox(width: 8),
                            if (!isDelivered)
                              ElevatedButton.icon(
                                onPressed: () => _openProofOfDelivery(manifest),
                                icon: const Icon(Icons.check_circle_outline_rounded, size: 14),
                                label: const Text('PoD Handshake', style: TextStyle(fontSize: 12)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.accentForest,
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
