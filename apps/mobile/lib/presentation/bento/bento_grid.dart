import 'package:flutter/material.dart';
import 'quarantined_card.dart';
import 'widgets/cash_flow_card.dart';

class BentoGrid extends StatelessWidget {
  final List<Widget> children;
  final bool isCaregiver;

  const BentoGrid({
    super.key,
    required this.children,
    this.isCaregiver = false,
  });

  @override
  Widget build(BuildContext context) {
    // Caregiver guest quarantine: filter out sensitive financial cards like CashFlowCard
    final activeChildren = children.where((child) {
      if (isCaregiver && (child is CashFlowCard || isQuarantinedCard(child))) {
        return false;
      }
      return true;
    }).toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        // Multi-column grid on tablet / desktop viewports (> 600dp)
        if (constraints.maxWidth > 600) {
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.5,
            ),
            itemCount: activeChildren.length,
            itemBuilder: (context, index) => activeChildren[index],
          );
        }

        // Single-column vertical scroll on mobile
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: activeChildren.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) => activeChildren[index],
        );
      },
    );
  }
}
