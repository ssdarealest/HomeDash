import 'package:flutter/material.dart';

class CaregiverShiftCard extends StatelessWidget {
  final String activeCaregiver;
  final String shiftWindow;
  final VoidCallback onHandOffNotes;

  const CaregiverShiftCard({
    super.key,
    required this.activeCaregiver,
    required this.shiftWindow,
    required this.onHandOffNotes,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.badge_outlined, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Active Caregiver Shift',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              activeCaregiver,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            Text(shiftWindow, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: onHandOffNotes,
              icon: const Icon(Icons.notes_rounded),
              label: const Text('View Handoff Notes'),
            ),
          ],
        ),
      ),
    );
  }
}
