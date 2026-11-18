import 'package:flutter/material.dart';

class MedicationTimelineCard extends StatelessWidget {
  final int dueCount;
  final int completedCount;
  final VoidCallback onLogDose;

  const MedicationTimelineCard({
    super.key,
    required this.dueCount,
    required this.completedCount,
    required this.onLogDose,
  });

  @override
  Widget build(BuildContext context) {
    final total = dueCount + completedCount;
    final progress = total > 0 ? completedCount / total : 1.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Today's Medications",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text('$completedCount / $total Taken'),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(value: progress, minHeight: 8),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: onLogDose,
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Quick-Log Dose'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(48, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
