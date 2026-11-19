import 'package:flutter/material.dart';
import 'quarantined_card.dart';
import 'glassmorphic_card.dart';
import 'bento_widgets.dart';

class BentoGridView extends StatelessWidget {
  final List<Widget> children;
  final bool isCaregiver;
  final bool isGlassmorphic;

  const BentoGridView({
    super.key,
    required this.children,
    this.isCaregiver = false,
    this.isGlassmorphic = true,
  });

  Widget _applyCardStyle(Widget child) {
    if (child is SystemSyncTelemetryCard) {
      return SystemSyncTelemetryCard(
        discoveredPeers: child.discoveredPeers,
        hlcTimestamp: child.hlcTimestamp,
        isOnline: child.isOnline,
        isGlassmorphic: isGlassmorphic,
      );
    }
    if (child is HouseholdOpsSummaryCard) {
      return HouseholdOpsSummaryCard(
        pendingGroceryCount: child.pendingGroceryCount,
        pendingChoresCount: child.pendingChoresCount,
        nextMealTitle: child.nextMealTitle,
        isGlassmorphic: isGlassmorphic,
      );
    }
    if (child is GlassmorphicCard) {
      return GlassmorphicCard(
        isGlassmorphic: isGlassmorphic,
        padding: child.padding,
        onTap: child.onTap,
        child: child.child,
      );
    }
    return GlassmorphicCard(
      isGlassmorphic: isGlassmorphic,
      padding: EdgeInsets.zero,
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Caregiver guest quarantine: filter out sensitive financial and vault cards
    final activeChildren = children
        .where((child) => !isCaregiver || !isQuarantinedCard(child))
        .map(_applyCardStyle)
        .toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;

        int crossAxisCount;
        double childAspectRatio;

        if (width > 1440) {
          crossAxisCount = 4;
          childAspectRatio = 1.35;
        } else if (width > 1024) {
          crossAxisCount = 3;
          childAspectRatio = 1.4;
        } else if (width > 600) {
          crossAxisCount = 2;
          childAspectRatio = 1.45;
        } else {
          // Mobile single column
          return ListView.separated(
            padding: const EdgeInsets.all(16.0),
            itemCount: activeChildren.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12.0),
            itemBuilder: (context, index) => activeChildren[index],
          );
        }

        return GridView.builder(
          padding: const EdgeInsets.all(20.0),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 16.0,
            mainAxisSpacing: 16.0,
            childAspectRatio: childAspectRatio,
          ),
          itemCount: activeChildren.length,
          itemBuilder: (context, index) => activeChildren[index],
        );
      },
    );
  }
}
