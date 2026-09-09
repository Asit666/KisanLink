import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/providers.dart';
import '../../app/theme.dart';
import '../../models/user.dart';
import '../admin/admin_dashboard_view.dart';
import '../buyer/buyer_dashboard_view.dart';
import '../farmer/farmer_dashboard_view.dart';
import '../fpo/fpo_dashboard_view.dart';
import '../transporter/transporter_dashboard_view.dart';

class AdaptiveShell extends ConsumerStatefulWidget {
  const AdaptiveShell({super.key});

  @override
  ConsumerState<AdaptiveShell> createState() => _AdaptiveShellState();
}

class _AdaptiveShellState extends ConsumerState<AdaptiveShell> {
  int _selectedIndex = 0;

  Widget _getRoleDashboard(UserRole role) {
    switch (role) {
      case UserRole.farmer:
        return const FarmerDashboardView();
      case UserRole.buyer:
        return const BuyerDashboardView();
      case UserRole.transporter:
        return const TransporterDashboardView();
      case UserRole.fpo:
        return const FpoDashboardView();
      case UserRole.admin:
        return const AdminDashboardView();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;
    final role = user?.role ?? UserRole.farmer;

    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= 850;

    return Scaffold(
      backgroundColor: AppColors.bgCanvas,
      appBar: !isDesktop
          ? AppBar(
              backgroundColor: AppColors.bgSurface,
              elevation: 0,
              titleSpacing: 16,
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.accentForest,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.agriculture_rounded, color: Colors.white, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Text('KISANLINK', style: AppTypography.titleMedium),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.accentSage,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      role.displayName.toUpperCase(),
                      style: AppTypography.monoCode.copyWith(fontSize: 10, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.logout_rounded, size: 20, color: AppColors.textSecondary),
                  tooltip: 'Sign Out',
                  onPressed: () => ref.read(authNotifierProvider.notifier).logout(),
                ),
              ],
            )
          : null,
      body: isDesktop
          ? Row(
              children: [
                // Desktop Permanent Navigation Sidebar
                _DesktopSidebar(
                  user: user,
                  selectedIndex: _selectedIndex,
                  onSelect: (idx) => setState(() => _selectedIndex = idx),
                  onLogout: () => ref.read(authNotifierProvider.notifier).logout(),
                ),
                // Main Content View Area
                Expanded(
                  child: _selectedIndex == 0
                      ? _getRoleDashboard(role)
                      : _PlaceholderView(title: _navTitles[_selectedIndex]),
                ),
              ],
            )
          : _selectedIndex == 0
              ? _getRoleDashboard(role)
              : _PlaceholderView(title: _navTitles[_selectedIndex]),
      bottomNavigationBar: !isDesktop
          ? NavigationBar(
              selectedIndex: _selectedIndex,
              onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
              backgroundColor: AppColors.bgSurface,
              indicatorColor: AppColors.accentSage,
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.space_dashboard_outlined),
                  selectedIcon: Icon(Icons.space_dashboard_rounded, color: AppColors.accentForest),
                  label: 'Desk',
                ),
                NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long_rounded, color: AppColors.accentForest),
                  label: 'Trades',
                ),
                NavigationDestination(
                  icon: Icon(Icons.analytics_outlined),
                  selectedIcon: Icon(Icons.analytics_rounded, color: AppColors.accentForest),
                  label: 'Analytics',
                ),
                NavigationDestination(
                  icon: Icon(Icons.support_agent_outlined),
                  selectedIcon: Icon(Icons.support_agent_rounded, color: AppColors.accentForest),
                  label: 'Support',
                ),
              ],
            )
          : null,
    );
  }

  static const List<String> _navTitles = [
    'Market Desk',
    'Trades & Contracts',
    'Analytics & Realization',
    'Kisan Support Desk',
  ];
}

class _DesktopSidebar extends StatelessWidget {
  final User? user;
  final int selectedIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onLogout;

  const _DesktopSidebar({
    required this.user,
    required this.selectedIndex,
    required this.onSelect,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    final role = user?.role ?? UserRole.farmer;

    return Container(
      width: 250,
      decoration: const BoxDecoration(
        color: AppColors.bgSurface,
        border: Border(right: BorderSide(color: AppColors.borderSubtle, width: 1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Brand Logo Header
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.accentForest,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.agriculture_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('KISANLINK', style: AppTypography.displayLarge.copyWith(fontSize: 18)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.accentSage,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        role.displayName.toUpperCase(),
                        style: AppTypography.monoCode.copyWith(fontSize: 9, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(color: AppColors.borderSubtle, height: 1),
          const SizedBox(height: 12),

          // Nav Items
          _SidebarNavItem(
            icon: Icons.space_dashboard_outlined,
            selectedIcon: Icons.space_dashboard_rounded,
            label: 'Market Desk',
            isSelected: selectedIndex == 0,
            onTap: () => onSelect(0),
          ),
          _SidebarNavItem(
            icon: Icons.receipt_long_outlined,
            selectedIcon: Icons.receipt_long_rounded,
            label: 'Trades & Escrow',
            isSelected: selectedIndex == 1,
            onTap: () => onSelect(1),
          ),
          _SidebarNavItem(
            icon: Icons.analytics_outlined,
            selectedIcon: Icons.analytics_rounded,
            label: 'Analytics & Realization',
            isSelected: selectedIndex == 2,
            onTap: () => onSelect(2),
          ),
          _SidebarNavItem(
            icon: Icons.support_agent_outlined,
            selectedIcon: Icons.support_agent_rounded,
            label: 'Support Center',
            isSelected: selectedIndex == 3,
            onTap: () => onSelect(3),
          ),

          const Spacer(),
          const Divider(color: AppColors.borderSubtle, height: 1),

          // User Footer Profile & Logout
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.accentTerraSubtle,
                  child: Text(
                    (user?.name.isNotEmpty == true ? user!.name[0] : 'K').toUpperCase(),
                    style: AppTypography.titleMedium.copyWith(color: AppColors.accentTerra),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? 'User',
                        style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        user?.email ?? '',
                        style: AppTypography.monoCode.copyWith(fontSize: 10),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.logout_rounded, size: 18, color: AppColors.textMuted),
                  tooltip: 'Sign Out',
                  onPressed: onLogout,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SidebarNavItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _SidebarNavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.accentSage : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(
                isSelected ? selectedIcon : icon,
                size: 20,
                color: isSelected ? AppColors.accentForest : AppColors.textSecondary,
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: AppTypography.bodyMedium.copyWith(
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? AppColors.accentForest : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlaceholderView extends StatelessWidget {
  final String title;

  const _PlaceholderView({required this.title});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.construction_rounded, size: 48, color: AppColors.textMuted),
          const SizedBox(height: 16),
          Text(title, style: AppTypography.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Connected to Spring Boot REST backend services.',
            style: AppTypography.bodyMedium,
          ),
        ],
      ),
    );
  }
}
