import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';

class WeighSlipEntry {
  final String slipNo;
  final String farmerName;
  final String phone;
  final String cropName;
  final String grade;
  final double grossWeight;
  final double tareWeight;
  final double netWeight;
  final double moisturePercent;
  final double foreignMatterPercent;
  final String date;
  final String status;

  WeighSlipEntry({
    required this.slipNo,
    required this.farmerName,
    required this.phone,
    required this.cropName,
    required this.grade,
    required this.grossWeight,
    required this.tareWeight,
    required this.netWeight,
    required this.moisturePercent,
    required this.foreignMatterPercent,
    required this.date,
    required this.status,
  });
}

class CreateWeighSlipDialog extends StatefulWidget {
  final ValueChanged<WeighSlipEntry> onCreated;

  const CreateWeighSlipDialog({super.key, required this.onCreated});

  @override
  State<CreateWeighSlipDialog> createState() => _CreateWeighSlipDialogState();
}

class _CreateWeighSlipDialogState extends State<CreateWeighSlipDialog> {
  final _formKey = GlobalKey<FormState>();
  final _farmerNameController = TextEditingController(text: 'Ramesh Patel');
  final _phoneController = TextEditingController(text: '9876543210');
  final _grossWeightController = TextEditingController(text: '48.5');
  final _tareWeightController = TextEditingController(text: '3.5');
  final _moistureController = TextEditingController(text: '10.5');
  final _foreignMatterController = TextEditingController(text: '1.2');

  String _selectedCrop = 'Soybean (JS-335)';
  String _selectedGrade = 'FAQ Grade A';

  @override
  void dispose() {
    _farmerNameController.dispose();
    _phoneController.dispose();
    _grossWeightController.dispose();
    _tareWeightController.dispose();
    _moistureController.dispose();
    _foreignMatterController.dispose();
    super.dispose();
  }

  double get _netWeight {
    final gross = double.tryParse(_grossWeightController.text) ?? 0.0;
    final tare = double.tryParse(_tareWeightController.text) ?? 0.0;
    final net = gross - tare;
    return net > 0 ? net : 0.0;
  }

  double get _moistureVal => double.tryParse(_moistureController.text) ?? 0.0;

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final slip = WeighSlipEntry(
      slipNo: 'WS-${1050 + DateTime.now().millisecond % 500}',
      farmerName: _farmerNameController.text.trim(),
      phone: _phoneController.text.trim(),
      cropName: _selectedCrop,
      grade: _selectedGrade,
      grossWeight: double.parse(_grossWeightController.text),
      tareWeight: double.parse(_tareWeightController.text),
      netWeight: _netWeight,
      moisturePercent: _moistureVal,
      foreignMatterPercent: double.tryParse(_foreignMatterController.text) ?? 0.0,
      date: DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now()),
      status: 'UNPOOLED',
    );

    widget.onCreated(slip);
    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Weigh-slip created: ${slip.slipNo} for ${slip.farmerName} (${slip.netWeight} qtl)'),
        backgroundColor: AppColors.accentForest,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMoistureHigh = _moistureVal > 12.0;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 540),
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('FPO VILLAGE INTAKE DESK', style: AppTypography.labelSmall),
                        Text('Log Direct Farmer Weigh-Slip', style: AppTypography.titleMedium),
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

                // Farmer Member Details
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextFormField(
                        controller: _farmerNameController,
                        decoration: const InputDecoration(labelText: 'Member Farmer Name'),
                        validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(labelText: 'Mobile No.'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Crop & Grade Dropdowns
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedCrop,
                        decoration: const InputDecoration(labelText: 'Commodity'),
                        items: const [
                          DropdownMenuItem(value: 'Soybean (JS-335)', child: Text('Soybean (JS-335)')),
                          DropdownMenuItem(value: 'Red Onion (Garwa)', child: Text('Red Onion (Garwa)')),
                          DropdownMenuItem(value: 'Wheat (Sharbati)', child: Text('Wheat (Sharbati)')),
                          DropdownMenuItem(value: 'Cotton (Medium Staple)', child: Text('Cotton (Medium)')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedCrop = val);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedGrade,
                        decoration: const InputDecoration(labelText: 'Assayed Grade'),
                        items: const [
                          DropdownMenuItem(value: 'FAQ Grade A', child: Text('FAQ Grade A')),
                          DropdownMenuItem(value: 'Commercial Grade B', child: Text('Commercial Grade B')),
                          DropdownMenuItem(value: 'Export Premium', child: Text('Export Premium')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedGrade = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Weights (Gross, Tare -> Auto Net)
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _grossWeightController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Gross (qtl)'),
                        onChanged: (_) => setState(() {}),
                        validator: (v) => (double.tryParse(v ?? '') ?? 0) <= 0 ? 'Invalid' : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _tareWeightController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Tare (qtl)'),
                        onChanged: (_) => setState(() {}),
                        validator: (v) => (double.tryParse(v ?? '') ?? -1) < 0 ? 'Invalid' : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.accentSage,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.accentForest.withOpacity(0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('NET WEIGHT', style: AppTypography.monoCode.copyWith(fontSize: 10, fontWeight: FontWeight.w700)),
                            Text('${_netWeight.toStringAsFixed(2)} qtl', style: AppTypography.monoPrice.copyWith(fontSize: 15, color: AppColors.accentForest)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // QA Parameters: Moisture & Foreign Matter
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _moistureController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Moisture (%)',
                          suffixIcon: isMoistureHigh
                              ? const Tooltip(
                                  message: 'Moisture exceeds 12% standard threshold',
                                  child: Icon(Icons.warning_amber_rounded, color: AppColors.warningAmber, size: 20),
                                )
                              : null,
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _foreignMatterController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Foreign Matter (%)'),
                      ),
                    ),
                  ],
                ),
                if (isMoistureHigh) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Moisture exceeds 12.0% standard APMC guideline. May require aeration before pooling.',
                    style: AppTypography.monoCode.copyWith(color: AppColors.warningAmber, fontSize: 11),
                  ),
                ],
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
                      onPressed: _submit,
                      icon: const Icon(Icons.print_rounded, size: 16),
                      label: const Text('Issue Weigh-Slip'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
