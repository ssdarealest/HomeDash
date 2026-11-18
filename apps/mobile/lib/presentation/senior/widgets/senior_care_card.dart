import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

class SeniorCareCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;
  final bool isCompleted;

  const SeniorCareCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
    this.isCompleted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.seniorCardBorder, width: 2.5),
      ),
      color: isCompleted ? const Color(0xFFE8F5E9) : AppColors.seniorSurface,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: AppTypography.seniorTextTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.seniorText,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: AppTypography.seniorTextTheme.bodyLarge?.copyWith(
                color: AppColors.seniorSecondaryText,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 56, // Extra large touch target for senior ergonomics (>= 48dp)
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: isCompleted ? const Color(0xFF2E7D32) : AppColors.seniorPrimaryAction,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: onAction,
                child: Text(
                  actionLabel,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
