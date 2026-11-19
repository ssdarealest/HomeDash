import 'package:flutter/material.dart';
import 'widgets/cash_flow_card.dart';
import '../vault/break_glass_status_card.dart';

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

  @override
  Widget build(BuildContext context) {
    // Caregiver guest quarantine: filter out sensitive financial and vault cards
    final activeChildren = children.where((child) {
      if (isCaregiver) {
        if (child is CashFlowCard || child is BreakGlassStatusCard) {
          return false;
        }
      }
      return true;
    }).toList();

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
