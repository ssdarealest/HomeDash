import 'package:flutter/material.dart';

class MedicationQuickLogSheet extends StatelessWidget {
  final List<Map<String, dynamic>> scheduledMeds;
  final Function(String medId, String status) onLog;

  const MedicationQuickLogSheet({
    super.key,
    required this.scheduledMeds,
    required this.onLog,
  });

  static Future<void> show(
    BuildContext context, {
    required List<Map<String, dynamic>> scheduledMeds,
    required Function(String medId, String status) onLog,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => MedicationQuickLogSheet(
        scheduledMeds: scheduledMeds,
        onLog: onLog,
      ),
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
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade400,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '1-Tap Medication Check-Off',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (scheduledMeds.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: Text('All scheduled doses completed!')),
              )
            else
              ...scheduledMeds.map((med) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(med['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('${med['dosage'] ?? ''} - ${med['time'] ?? 'Now'}'),
                      trailing: ElevatedButton(
                        style: ElevatedButton.styleFrom(minimumSize: const Size(48, 48)),
                        onPressed: () {
                          onLog(med['id'] ?? '', 'taken');
                          Navigator.pop(context);
                        },
                        child: const Text('Taken'),
                      ),
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}
