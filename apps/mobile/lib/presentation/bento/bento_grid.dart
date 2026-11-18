import 'package:flutter/material.dart';

class BentoGrid extends StatelessWidget {
  final List<Widget> children;

  const BentoGrid({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
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
            itemCount: children.length,
            itemBuilder: (context, index) => children[index],
          );
        }

        // Single-column vertical scroll on mobile
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: children.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) => children[index],
        );
      },
    );
  }
}
