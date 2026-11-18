import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

class SeniorEmergencyBanner extends StatelessWidget {
  final String primaryContactName;
  final String phoneNumber;
  final VoidCallback onCall;

  const SeniorEmergencyBanner({
    super.key,
    required this.primaryContactName,
    required this.phoneNumber,
    required this.onCall,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.seniorEmergencyAction,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black, width: 3),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Text(
            'EMERGENCY HELP',
            style: AppTypography.seniorTextTheme.headlineMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Primary Contact: $primaryContactName ($phoneNumber)',
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.seniorEmergencyAction,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: onCall,
              icon: const Icon(Icons.phone_in_talk, size: 28),
              label: const Text(
                'CALL EMERGENCY CONTACT',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
