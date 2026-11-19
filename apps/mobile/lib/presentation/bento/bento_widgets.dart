import 'package:flutter/material.dart';
import 'glassmorphic_card.dart';

class SystemSyncTelemetryCard extends StatelessWidget {
  final int discoveredPeers;
  final String hlcTimestamp;
  final bool isOnline;
  final bool isGlassmorphic;

  const SystemSyncTelemetryCard({
    super.key,
    required this.discoveredPeers,
    required this.hlcTimestamp,
    this.isOnline = true,
    this.isGlassmorphic = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GlassmorphicCard(
      isGlassmorphic: isGlassmorphic,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'System & P2P Sync',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isOnline ? Colors.green : Colors.amber,
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$discoveredPeers LAN Peers Discovered',
                style: theme.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'HLC: ${hlcTimestamp.split('_').first}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
          Text(
            isOnline ? 'Direct P2P & Cloud Active' : 'Offline: Local P2P Sync Only',
            style: theme.textTheme.labelSmall?.copyWith(
              color: isOnline
                  ? theme.colorScheme.primary
                  : theme.colorScheme.tertiary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class HouseholdOpsSummaryCard extends StatelessWidget {
  final int pendingGroceryCount;
  final int pendingChoresCount;
  final String? nextMealTitle;
  final bool isGlassmorphic;

  const HouseholdOpsSummaryCard({
    super.key,
    required this.pendingGroceryCount,
    required this.pendingChoresCount,
    this.nextMealTitle,
    this.isGlassmorphic = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GlassmorphicCard(
      isGlassmorphic: isGlassmorphic,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Daily Household Ops',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$pendingGroceryCount',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    Text('Groceries', style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$pendingChoresCount',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.secondary,
                      ),
                    ),
                    Text('Chores', style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
            ],
          ),
          Text(
            nextMealTitle != null
                ? 'Tonight: $nextMealTitle'
                : 'No meal planned for tonight',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
