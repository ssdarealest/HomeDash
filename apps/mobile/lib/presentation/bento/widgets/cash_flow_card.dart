import 'package:flutter/material.dart';

class CashFlowCard extends StatelessWidget {
  final int totalBalanceCents;
  final int spentThisMonthCents;
  final VoidCallback onLogExpense;

  const CashFlowCard({
    super.key,
    required this.totalBalanceCents,
    required this.spentThisMonthCents,
    required this.onLogExpense,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Household Cash Flow',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '\$${(totalBalanceCents / 100).toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            Text(
              'Spent this month: \$${(spentThisMonthCents / 100).toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onLogExpense,
              icon: const Icon(Icons.add_card),
              label: const Text('Add Expense'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(48, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
