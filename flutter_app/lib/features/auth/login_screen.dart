import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../models/user.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'farmer@kisanlink.in');
  final _passwordController = TextEditingController(text: 'password123');
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _applyQuickRole(UserRole role) {
    switch (role) {
      case UserRole.farmer:
        _emailController.text = 'farmer@kisanlink.in';
        _passwordController.text = 'password123';
        break;
      case UserRole.buyer:
        _emailController.text = 'buyer@itc-agro.com';
        _passwordController.text = 'password123';
        break;
      case UserRole.transporter:
        _emailController.text = 'transporter@logistics.in';
        _passwordController.text = 'password123';
        break;
      case UserRole.fpo:
        _emailController.text = 'fpo.desk@nashik-agro.org';
        _passwordController.text = 'password123';
        break;
      case UserRole.admin:
        _emailController.text = 'admin@kisanlink.in';
        _passwordController.text = 'password123';
        break;
    }
    setState(() {});
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter both email and password')),
      );
      return;
    }

    await ref.read(authNotifierProvider.notifier).login(email, password);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 700;

    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: isWide ? 460 : double.infinity),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.pad(const BorderSide(color: AppColors.borderSubtle, width: 1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Brand Header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.accentForest,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.agriculture_rounded,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'KISANLINK',
                            style: AppTypography.displayLarge.copyWith(
                              fontSize: 22,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            'National Agronomic Trade & Logistics',
                            style: AppTypography.labelSmall,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  Text(
                    'Sign In to Market Desk',
                    style: AppTypography.titleLarge,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Select your operating profile or enter authorized credentials.',
                    style: AppTypography.bodyMedium,
                  ),
                  const SizedBox(height: 20),

                  // Quick Role Demo Pills
                  Text(
                    'QUICK DEMO PROFILES',
                    style: AppTypography.labelSmall,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _RolePill(
                        label: 'Farmer',
                        isSelected: _emailController.text.contains('farmer'),
                        onTap: () => _applyQuickRole(UserRole.farmer),
                      ),
                      _RolePill(
                        label: 'Buyer',
                        isSelected: _emailController.text.contains('buyer'),
                        onTap: () => _applyQuickRole(UserRole.buyer),
                      ),
                      _RolePill(
                        label: 'Transporter',
                        isSelected: _emailController.text.contains('transporter'),
                        onTap: () => _applyQuickRole(UserRole.transporter),
                      ),
                      _RolePill(
                        label: 'FPO Desk',
                        isSelected: _emailController.text.contains('fpo'),
                        onTap: () => _applyQuickRole(UserRole.fpo),
                      ),
                      _RolePill(
                        label: 'Admin',
                        isSelected: _emailController.text.contains('admin'),
                        onTap: () => _applyQuickRole(UserRole.admin),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Error Banner if present
                  if (authState.errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.errorRedBg,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.errorRed.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline_rounded, color: AppColors.errorRed, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              authState.errorMessage!,
                              style: AppTypography.bodyMedium.copyWith(color: AppColors.errorRed),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Email Input
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Work Email or Mobile Identifier',
                      prefixIcon: Icon(Icons.alternate_email_rounded, size: 20),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Password Input
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                          size: 20,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    onFieldSubmitted: (_) => _handleLogin(),
                  ),
                  const SizedBox(height: 24),

                  // Submit Button
                  ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: authState.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Access Platform'),
                  ),
                  const SizedBox(height: 16),

                  Center(
                    child: Text(
                      'Zero-arbitrage direct connection to AGMARKNET Mandis',
                      style: AppTypography.monoCode.copyWith(fontSize: 11),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RolePill extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _RolePill({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accentTerra : AppColors.bgCanvas,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.accentTerra : AppColors.borderSubtle,
          ),
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
}
