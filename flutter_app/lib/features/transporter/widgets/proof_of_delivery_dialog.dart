import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class ProofOfDeliveryDialog extends StatefulWidget {
  final String orderId;
  final String cargo;
  final double loadedQuintals;
  final double freightPayout;
  final VoidCallback onCompleted;

  const ProofOfDeliveryDialog({
    super.key,
    required this.orderId,
    required this.cargo,
    required this.loadedQuintals,
    required this.freightPayout,
    required this.onCompleted,
  });

  @override
  State<ProofOfDeliveryDialog> createState() => _ProofOfDeliveryDialogState();
}

class _ProofOfDeliveryDialogState extends State<ProofOfDeliveryDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _receivedWeightController;
  final _otpController = TextEditingController(text: '8492');
  final _receiverNameController = TextEditingController(text: 'Kailash Mandi Weighmaster');

  @override
  void initState() {
    super.initState();
    _receivedWeightController = TextEditingController(text: widget.loadedQuintals.toStringAsFixed(1));
  }

  @override
  void dispose() {
    _receivedWeightController.dispose();
    _otpController.dispose();
    _receiverNameController.dispose();
    super.dispose();
  }

  double get _receivedWeight => double.tryParse(_receivedWeightController.text) ?? 0.0;
  double get _shrinkage => widget.loadedQuintals - _receivedWeight;

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    widget.onCompleted();
    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Delivery confirmed for ${widget.orderId}. Freight escrow payout released!'),
        backgroundColor: AppColors.accentForest,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final shrinkagePercent = widget.loadedQuintals > 0 ? (_shrinkage / widget.loadedQuintals) * 100 : 0.0;
    final isShrinkageHigh = shrinkagePercent > 1.5;

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
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.accentForest,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.handshake_rounded, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('PROOF OF DELIVERY (PoD)', style: AppTypography.labelSmall),
                            Text('Handshake: ${widget.orderId}', style: AppTypography.titleMedium),
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

                // Cargo & Weight Audit
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.bgCanvas,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.borderSubtle),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Cargo Consignment:', style: AppTypography.bodyMedium),
                          Text(widget.cargo, style: AppTypography.monoCode.copyWith(fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Origin Loaded Weight:', style: AppTypography.bodyMedium),
                          Text('${widget.loadedQuintals} qtl', style: AppTypography.monoPrice.copyWith(fontSize: 14)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Freight Escrow Payout:', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                          Text('₹ ${widget.freightPayout.toStringAsFixed(0)}', style: AppTypography.monoPrice.copyWith(fontSize: 16, color: AppColors.accentForest)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Destination Weighbridge Weight
                TextFormField(
                  controller: _receivedWeightController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Terminal Unloaded Weight (qtl)',
                    suffixText: 'qtl',
                    helperText: 'Transit delta: ${_shrinkage.toStringAsFixed(2)} qtl (${shrinkagePercent.toStringAsFixed(2)}%)',
                  ),
                  onChanged: (_) => setState(() {}),
                  validator: (v) => (double.tryParse(v ?? '') ?? 0) <= 0 ? 'Enter valid weight' : null,
                ),
                if (isShrinkageHigh) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Transit shrinkage exceeds 1.5% moisture buffer. Quality inspector memo required.',
                    style: AppTypography.monoCode.copyWith(color: AppColors.warningAmber, fontSize: 11),
                  ),
                ],
                const SizedBox(height: 12),

                // Receiver Name & Handshake OTP
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextFormField(
                        controller: _receiverNameController,
                        decoration: const InputDecoration(labelText: 'Receiving Yard Officer'),
                        validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        controller: _otpController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Receiver OTP'),
                        validator: (v) => (v?.length ?? 0) < 4 ? '4 digits' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

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
                      icon: const Icon(Icons.check_circle_outline_rounded, size: 16),
                      label: const Text('Confirm Handshake & Release Payout'),
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
