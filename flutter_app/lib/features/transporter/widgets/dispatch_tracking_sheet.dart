import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class DispatchTrackingSheet extends StatelessWidget {
  final String orderId;
  final String origin;
  final String destination;
  final String cargo;
  final String vehicleNo;
  final String driverName;
  final String ewayBill;
  final String status;

  const DispatchTrackingSheet({
    super.key,
    required this.orderId,
    required this.origin,
    required this.destination,
    required this.cargo,
    required this.vehicleNo,
    required this.driverName,
    required this.ewayBill,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 540),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.infoBlue,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.navigation_rounded, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('LIVE FLEET TELEMETRY', style: AppTypography.labelSmall),
                          Text('Manifest: $orderId', style: AppTypography.monoPriceLarge.copyWith(fontSize: 18)),
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

              // Route & Cargo Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.bgCanvas,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.borderSubtle),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.radio_button_checked_rounded, color: AppColors.accentForest, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(origin, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    Container(
                      margin: const EdgeInsets.only(left: 8),
                      height: 24,
                      width: 2,
                      color: AppColors.borderStrong,
                    ),
                    Row(
                      children: [
                        const Icon(Icons.location_on_rounded, color: AppColors.accentTerra, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(destination, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    const Divider(color: AppColors.borderSubtle, height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Cargo:', style: AppTypography.monoCode),
                        Text(cargo, style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Truck & Driver:', style: AppTypography.monoCode),
                        Text('$vehicleNo ($driverName)', style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('GST E-Way Bill:', style: AppTypography.monoCode),
                        Text(ewayBill, style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700, color: AppColors.infoBlue)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Transit Milestone Timeline
              Text('GPS CORRIDOR TIMELINE', style: AppTypography.labelSmall),
              const SizedBox(height: 12),
              _buildTimelineStep('1. Loading & Weigh-In Completed', 'Khargone FPO Yard • 07:30 AM', true),
              _buildTimelineStep('2. Toll Plaza Telepass (Fastag)', 'Indore Bypass Kiosk 4 • 10:15 AM', true),
              _buildTimelineStep('3. En Route to Destination Hub', 'NH-52 • Current Speed: 48 km/h • ETA: 4.5 hrs', true, isCurrent: true),
              _buildTimelineStep('4. Terminal Mandi Delivery & Inspection', 'Azadpur Yard, Gate 2 • Scheduled 06:00 PM', false),
              const SizedBox(height: 20),

              // Close
              Align(
                alignment: Alignment.centerRight,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Close Tracking'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimelineStep(String title, String subtitle, bool isDone, {bool isCurrent = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isDone ? (isCurrent ? Icons.gps_fixed_rounded : Icons.check_circle_rounded) : Icons.radio_button_unchecked_rounded,
            size: 18,
            color: isCurrent ? AppColors.infoBlue : (isDone ? AppColors.accentForest : AppColors.textMuted),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600,
                    color: isCurrent ? AppColors.infoBlue : AppColors.textPrimary,
                  ),
                ),
                Text(subtitle, style: AppTypography.monoCode.copyWith(fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
