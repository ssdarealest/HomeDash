import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import 'widgets/senior_emergency_banner.dart';

class SeniorEmergencySheet extends StatelessWidget {
  final List<String> allergies;
  final String homeAddress;
  final VoidCallback onEmergencyCall;

  const SeniorEmergencySheet({
    super.key,
    required this.allergies,
    required this.homeAddress,
    required this.onEmergencyCall,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dedicated 1-tap CALL EMERGENCY CONTACT banner
          SeniorEmergencyBanner(
            primaryContactName: 'Dr. Emily (Family Admin)',
            phoneNumber: '555-0199',
            onCall: onEmergencyCall,
          ),
          const SizedBox(height: 24),
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.seniorCardBorder, width: 2),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'CRITICAL MEDICAL ALLERGIES',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.seniorEmergencyAction),
                  ),
                  const SizedBox(height: 12),
                  if (allergies.isEmpty)
                    const Text('No known allergies recorded', style: TextStyle(fontSize: 18))
                  else
                    ...allergies.map(
                      (a) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.circle, size: 12, color: Colors.black),
                            const SizedBox(width: 8),
                            Text(a, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  const Divider(height: 32, thickness: 2),
                  const Text('HOME ADDRESS FOR PARAMEDICS', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text(homeAddress, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
