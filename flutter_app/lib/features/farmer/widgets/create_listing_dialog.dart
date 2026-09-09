import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../app/providers.dart';
import '../../../app/theme.dart';
import '../../../models/listing.dart';

class CreateListingDialog extends ConsumerStatefulWidget {
  const CreateListingDialog({super.key});

  @override
  ConsumerState<CreateListingDialog> createState() => _CreateListingDialogState();
}

class _CreateListingDialogState extends ConsumerState<CreateListingDialog> {
  final _formKey = GlobalKey<FormState>();
  final _cropController = TextEditingController(text: 'Soybean (JS-335)');
  final _varietyController = TextEditingController(text: 'Oilseed Grade 1');
  final _quantityController = TextEditingController(text: '50');
  final _priceController = TextEditingController(text: '4800');
  final _locationController = TextEditingController(text: 'Khargone Farm Gate');
  String _selectedGrade = 'FAQ Grade A';

  @override
  void dispose() {
    _cropController.dispose();
    _varietyController.dispose();
    _quantityController.dispose();
    _priceController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  double get _estimatedTotalValuation {
    final qty = double.tryParse(_quantityController.text) ?? 0.0;
    final price = double.tryParse(_priceController.text) ?? 0.0;
    return qty * price;
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final newListing = ProduceListing(
      id: 'lst_${DateTime.now().millisecondsSinceEpoch}',
      cropName: _cropController.text.trim(),
      variety: _varietyController.text.trim(),
      quantityQuintals: double.parse(_quantityController.text),
      expectedPricePerQuintal: double.parse(_priceController.text),
      qualityGrade: _selectedGrade,
      harvestDate: DateFormat('dd MMM yyyy').format(DateTime.now()),
      status: 'ACTIVE',
      location: _locationController.text.trim(),
    );

    ref.read(farmerListingsProvider.notifier).addListing(newListing);
    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Listing published: ${newListing.cropName} (${newListing.quantityQuintals} qtl)'),
        backgroundColor: AppColors.accentForest,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
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
                        Text('PRODUCE REGISTRY', style: AppTypography.labelSmall),
                        Text('List Produce for Direct Sale', style: AppTypography.titleMedium),
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

                // Crop & Variety
                TextFormField(
                  controller: _cropController,
                  decoration: const InputDecoration(labelText: 'Crop Commodity'),
                  validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _varietyController,
                  decoration: const InputDecoration(labelText: 'Variety / Seed Type'),
                ),
                const SizedBox(height: 12),

                // Quantity & Price
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _quantityController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Quantity (Quintals)',
                          suffixText: 'qtl',
                        ),
                        onChanged: (_) => setState(() {}),
                        validator: (v) => (double.tryParse(v ?? '') ?? 0) <= 0 ? 'Enter quantity' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _priceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Target Price (₹/qtl)',
                          prefixText: '₹ ',
                        ),
                        onChanged: (_) => setState(() {}),
                        validator: (v) => (double.tryParse(v ?? '') ?? 0) <= 0 ? 'Enter price' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Quality Grade Dropdown
                DropdownButtonFormField<String>(
                  value: _selectedGrade,
                  decoration: const InputDecoration(labelText: 'Quality Grade'),
                  items: const [
                    DropdownMenuItem(value: 'FAQ Grade A', child: Text('FAQ Grade A (Clean & Graded)')),
                    DropdownMenuItem(value: 'Commercial Grade B', child: Text('Commercial Grade B')),
                    DropdownMenuItem(value: 'Export Grade (Premium)', child: Text('Export Grade (Premium)')),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedGrade = val);
                  },
                ),
                const SizedBox(height: 12),

                // Location / Mandi Gate
                TextFormField(
                  controller: _locationController,
                  decoration: const InputDecoration(
                    labelText: 'Pickup Location / Village',
                    prefixIcon: Icon(Icons.location_on_outlined, size: 20),
                  ),
                ),
                const SizedBox(height: 16),

                // Valuation Summary Card
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.bgCanvas,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.borderSubtle),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total Lot Valuation:',
                        style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        currencyFormat.format(_estimatedTotalValuation),
                        style: AppTypography.monoPriceLarge.copyWith(
                          fontSize: 20,
                          color: AppColors.accentForest,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Action Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: _submit,
                      child: const Text('Publish Listing'),
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
