import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class BreakGlassStatusCard extends StatelessWidget {
  final String requestId;
  final String status; // pending_cooldown, approved, vetoed, expired
  final DateTime cooldownExpiresAt;
  final bool isAdmin;
  final VoidCallback? onVetoPressed;
  final VoidCallback? onEmergencyAccessPressed;

  const BreakGlassStatusCard({
    Key? key,
    required this.requestId,
    required this.status,
    required this.cooldownExpiresAt,
    required this.isAdmin,
    this.onVetoPressed,
    this.onEmergencyAccessPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPending = status == 'pending_cooldown';
    final isApproved = status == 'approved';
    final isVetoed = status == 'vetoed';

    final remainingDuration = cooldownExpiresAt.difference(DateTime.now());
    final hours = remainingDuration.isNegative ? 0 : remainingDuration.inHours;
    final minutes = remainingDuration.isNegative ? 0 : remainingDuration.inMinutes % 60;

    return Card(
      elevation: 2.0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.0),
        side: BorderSide(
          color: isPending
              ? AppColors.accentTangerine
              : isApproved
                  ? AppColors.primaryEmerald
                  : AppColors.neutralDark.withOpacity(0.2),
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isPending
                      ? Icons.timer_outlined
                      : isApproved
                          ? Icons.lock_open_rounded
                          : Icons.block_rounded,
                  color: isPending
                      ? AppColors.accentTangerine
                      : isApproved
                          ? AppColors.primaryEmerald
                          : AppColors.neutralDark,
                  size: 28.0,
                ),
                const SizedBox(width: 12.0),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'EMERGENCY BREAK-GLASS',
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: isPending
                              ? AppColors.accentTangerine
                              : AppColors.primaryEmerald,
                        ),
                      ),
                      Text(
                        isPending
                            ? 'Cooldown active: ${hours}h ${minutes}m remaining'
                            : isApproved
                                ? 'Cooldown expired: Access approved'
                                : 'Emergency unlock cancelled ($status)',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12.0),
            Text(
              isPending
                  ? 'An emergency vault unlock was requested. If this is an unauthorized request, household admins can veto and cancel it before the countdown elapses.'
                  : isApproved
                      ? 'Emergency access has been granted to the verified trusted family member.'
                      : 'This break-glass attempt was stopped by an administrator.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.neutralDark.withOpacity(0.7),
              ),
            ),
            if (isPending && isAdmin) ...[
              const SizedBox(height: 16.0),
              SizedBox(
                width: double.infinity,
                height: AppTheme.minTouchTarget,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.shield_outlined),
                  label: const Text('VETO REQUEST'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFBA1A1A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                  ),
                  onPressed: onVetoPressed,
                ),
              ),
            ],
            if (isApproved) ...[
              const SizedBox(height: 16.0),
              SizedBox(
                width: double.infinity,
                height: AppTheme.minTouchTarget,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.vpn_key_rounded),
                  label: const Text('Access Emergency Vault Documents'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryEmerald,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                  ),
                  onPressed: onEmergencyAccessPressed,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
