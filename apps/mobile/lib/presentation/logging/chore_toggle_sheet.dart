import 'package:flutter/material.dart';

class ChoreToggleSheet extends StatelessWidget {
  final List<Map<String, dynamic>> activeChores;
  final Function(String choreId, bool isDone) onToggle;

  const ChoreToggleSheet({
    super.key,
    required this.activeChores,
    required this.onToggle,
  });

  static Future<void> show(
    BuildContext context, {
    required List<Map<String, dynamic>> activeChores,
    required Function(String choreId, bool isDone) onToggle,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => ChoreToggleSheet(activeChores: activeChores, onToggle: onToggle),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Household Chores', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (activeChores.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: Text('No active chores! Great job.')),
              )
            else
              ...activeChores.map((chore) {
                final isDone = chore['status'] == 'completed';
                return CheckboxListTile(
                  title: Text(
                    chore['title'] ?? '',
                    style: TextStyle(
                      decoration: isDone ? TextDecoration.lineThrough : null,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text('Reward: ${chore['tokenReward'] ?? 0} tokens'),
                  value: isDone,
                  onChanged: (val) {
                    onToggle(chore['id'] ?? '', val ?? false);
                  },
                );
              }),
          ],
        ),
      ),
    );
  }
}
