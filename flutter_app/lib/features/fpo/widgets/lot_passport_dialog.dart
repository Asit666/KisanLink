import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class LotPassportDialog extends StatelessWidget {
  final String lotId;
  final String cropName;
  final String grade;
  final double totalQuintals;
  final int farmerCount;
  final double avgMoisture;
  final String poolingDate;

  const LotPassportDialog({
    super.key,
    required this.lotId,
    required this.cropName,
    required this.grade,
    required this.totalQuintals,
    required this.farmerCount,
    required this.avgMoisture,
    required this.poolingDate,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 520),
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
                          color: AppColors.accentForest,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.qr_code_2_rounded, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('DIGITAL LOT PASSPORT', style: AppTypography.labelSmall),
                          Text(lotId, style: AppTypography.monoPriceLarge.copyWith(fontSize: 18)),
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

              // QR Code Graphic Block
              Center(
                child: Container(
                  width: 160,
                  height: 160,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.borderStrong, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.qr_code_scanner_rounded, size: 90, color: AppColors.textPrimary),
                      const SizedBox(height: 6),
                      Text(
                        'SCAN FOR PROVENANCE',
                        style: AppTypography.monoCode.copyWith(fontSize: 8, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Aggregated Specifications Table
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.bgCanvas,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.borderSubtle),
                ),
                child: Column(
                  children: [
                    _buildSpecRow('Commodity:', cropName),
                    const Divider(color: AppColors.borderSubtle, height: 16),
                    _buildSpecRow('Quality Grade:', grade),
                    const Divider(color: AppColors.borderSubtle, height: 16),
                    _buildSpecRow('Pooled Weight:', '$totalQuintals Quintals'),
                    const Divider(color: AppColors.borderSubtle, height: 16),
                    _buildSpecRow('Contributing Farmers:', '$farmerCount Smallholders'),
                    const Divider(color: AppColors.borderSubtle, height: 16),
                    _buildSpecRow('Assayed Moisture:', '$avgMoisture % (Standard)'),
                    const Divider(color: AppColors.borderSubtle, height: 16),
                    _buildSpecRow('Aggregation Date:', poolingDate),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Verified Provenance Badge
              Row(
                children: [
                  const Icon(Icons.verified_rounded, color: AppColors.accentForest, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Cryptographically signed by FPO Quality Inspector • AGMARKNET Compliant',
                      style: AppTypography.monoCode.copyWith(fontSize: 10, color: AppColors.accentForest),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Close'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Lot passport $lotId generated for printer/export.'),
                          backgroundColor: AppColors.accentForest,
                        ),
                      );
                      Navigator.of(context).pop();
                    },
                    icon: const Icon(Icons.download_rounded, size: 16),
                    label: const Text('Print Passport'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSpecRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
        Text(value, style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      ],
    );
  }
}
