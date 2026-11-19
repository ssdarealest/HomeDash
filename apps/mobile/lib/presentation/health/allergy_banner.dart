import 'package:flutter/material.dart';

class AllergyBanner extends StatelessWidget {
  final List<Map<String, dynamic>> allergies;

  const AllergyBanner({
    Key? key,
    required this.allergies,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (allergies.isEmpty) return const SizedBox.shrink();

    final criticalAllergies = allergies.where((a) => a['severity'] == 'critical').toList();
    final itemsToDisplay = criticalAllergies.isNotEmpty ? criticalAllergies : allergies;

    final allergenListText = itemsToDisplay.map((a) => a['allergen'] ?? '').join(', ');

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      padding: const EdgeInsets.all(12.0),
      decoration: BoxDecoration(
        color: const Color(0xFFBA1A1A), // High-contrast emergency red
        borderRadius: BorderRadius.circular(12.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 6.0,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            color: Colors.white,
            size: 28.0,
          ),
          const SizedBox(width: 12.0),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'ALLERGY ALERT',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                    fontSize: 12.0,
                  ),
                ),
                const SizedBox(height: 2.0),
                Text(
                  'Critical household allergens: $allergenListText',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14.0,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
