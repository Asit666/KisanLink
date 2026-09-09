import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../app/theme.dart';

class NegotiateOfferDialog extends StatefulWidget {
  final String lotId;
  final String cropName;
  final double availableQuantity;
  final double askingPrice;
  final double? mspBenchmark;
  final ValueChanged<Map<String, dynamic>> onSubmitOffer;

  const NegotiateOfferDialog({
    super.key,
    required this.lotId,
    required this.cropName,
    required this.availableQuantity,
    required this.askingPrice,
    this.mspBenchmark,
    required this.onSubmitOffer,
  });

  @override
  State<NegotiateOfferDialog> createState() => _NegotiateOfferDialogState();
}

class _NegotiateOfferDialogState extends State<NegotiateOfferDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _qtyController;
  late final TextEditingController _priceController;
  String _deliveryTerm = 'EX_FARM_GATE'; // 'EX_FARM_GATE', 'APMC_YARD'

  @override
  void initState() {
    super.initState();
    _qtyController = TextEditingController(text: widget.availableQuantity.toStringAsFixed(0));
    _priceController = TextEditingController(text: widget.askingPrice.toStringAsFixed(0));
  }

  @override
  void dispose() {
    _qtyController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  double get _qty => double.tryParse(_qtyController.text) ?? 0.0;
  double get _price => double.tryParse(_priceController.text) ?? 0.0;

  double get _commoditySubtotal => _qty * _price;
  double get _platformFee => _commoditySubtotal * 0.015; // 1.5% platform fee
  double get _estimatedTotalOutlay => _commoditySubtotal + _platformFee;

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final offerData = {
      'lotId': widget.lotId,
      'cropName': widget.cropName,
      'bidQuantity': _qty,
      'bidPricePerQuintal': _price,
      'deliveryTerm': _deliveryTerm,
      'subtotal': _commoditySubtotal,
      'totalOutlay': _estimatedTotalOutlay,
    };

    widget.onSubmitOffer(offerData);
    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Offer submitted for ${widget.cropName} at ₹${_price.toStringAsFixed(0)}/qtl'),
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
        constraints: const BoxConstraints(maxWidth: 520),
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
                        Text('COMMODITY TRADE DESK', style: AppTypography.labelSmall),
                        Text('Submit Procurement Bid', style: AppTypography.titleMedium),
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

                // Lot Summary
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(widget.cropName, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                          Text('Lot: ${widget.lotId} • Max: ${widget.availableQuantity} qtl', style: AppTypography.monoCode.copyWith(fontSize: 11)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('ASKING RATE', style: AppTypography.labelSmall.copyWith(fontSize: 9)),
                          Text('${currencyFormat.format(widget.askingPrice)}/qtl', style: AppTypography.monoPrice.copyWith(fontSize: 15)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Quantity & Bid Price
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _qtyController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Order Qty (qtl)'),
                        onChanged: (_) => setState(() {}),
                        validator: (v) {
                          final val = double.tryParse(v ?? '') ?? 0;
                          if (val <= 0) return 'Invalid';
                          if (val > widget.availableQuantity) return 'Exceeds lot';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _priceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Bid Rate (₹/qtl)', prefixText: '₹ '),
                        onChanged: (_) => setState(() {}),
                        validator: (v) => (double.tryParse(v ?? '') ?? 0) <= 0 ? 'Invalid' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Delivery Term Selector
                DropdownButtonFormField<String>(
                  value: _deliveryTerm,
                  decoration: const InputDecoration(labelText: 'Fulfillment Handshake'),
                  items: const [
                    DropdownMenuItem(value: 'EX_FARM_GATE', child: Text('Ex-Farm Gate / FPO Hub (Buyer Arranges Transit)')),
                    DropdownMenuItem(value: 'APMC_YARD', child: Text('Delivered at Buyer Processing Mill')),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _deliveryTerm = val);
                  },
                ),
                const SizedBox(height: 16),

                // Realized Financial Breakdown
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.borderSubtle),
                  ),
                  child: Column(
                    children: [
                      _buildCostLine('Commodity Cost (${_qty.toStringAsFixed(0)} qtl × ₹${_price.toStringAsFixed(0)})', currencyFormat.format(_commoditySubtotal)),
                      const SizedBox(height: 6),
                      _buildCostLine('Platform Clearing & Assaying Fee (1.5%)', currencyFormat.format(_platformFee)),
                      const Divider(color: AppColors.borderSubtle, height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Estimated Escrow Outlay:', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                          Text(
                            currencyFormat.format(_estimatedTotalOutlay),
                            style: AppTypography.monoPriceLarge.copyWith(fontSize: 18, color: AppColors.accentTerra),
                          ),
                        ],
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
                    ElevatedButton.icon(
                      onPressed: _submit,
                      icon: const Icon(Icons.gavel_rounded, size: 16),
                      label: const Text('Submit Counter-Offer'),
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

  Widget _buildCostLine(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.bodyMedium.copyWith(fontSize: 12, color: AppColors.textSecondary)),
        Text(value, style: AppTypography.monoCode.copyWith(fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
