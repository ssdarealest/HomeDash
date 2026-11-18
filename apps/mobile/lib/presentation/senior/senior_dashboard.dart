import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import 'widgets/senior_care_card.dart';
import 'senior_emergency_sheet.dart';

class SeniorDashboard extends StatefulWidget {
  const SeniorDashboard({super.key});

  @override
  State<SeniorDashboard> createState() => _SeniorDashboardState();
}

class _SeniorDashboardState extends State<SeniorDashboard> {
  int _selectedTab = 0; // 0 = Today's Care, 1 = Emergency

  @override
  Widget build(BuildContext context) {
    // Explicit 1.4x scale factor applied for Senior Mode layout
    const scaleFactor = AppTypography.seniorScaleFactor;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Senior Mode — Today's Care", style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.seniorSurface,
        elevation: 2,
      ),
      body: _selectedTab == 0 ? _buildCareTab() : _buildEmergencyTab(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedTab,
        height: 80, // Large ergonomic bottom bar
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.favorite_rounded, size: 32),
            label: "Today's Care",
          ),
          NavigationDestination(
            icon: Icon(Icons.warning_rounded, size: 32, color: AppColors.seniorEmergencyAction),
            label: 'Emergency',
          ),
        ],
        onDestinationSelected: (idx) {
          setState(() => _selectedTab = idx);
        },
      ),
    );
  }

  Widget _buildCareTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        SeniorCareCard(
          title: 'Morning Blood Pressure',
          subtitle: 'Scheduled: 8:00 AM (Target: < 130/80)',
          actionLabel: 'LOG READING NOW',
          onAction: () {},
        ),
        const SizedBox(height: 16),
        SeniorCareCard(
          title: 'Morning Heart Medication',
          subtitle: 'Aspirin 81mg - Take with water',
          actionLabel: 'MARK TAKEN',
          isCompleted: true,
          onAction: () {},
        ),
        const SizedBox(height: 16),
        SeniorCareCard(
          title: 'Afternoon Caregiver Visit',
          subtitle: 'Nurse Sarah arrives at 2:00 PM',
          actionLabel: 'VIEW DETAILS',
          onAction: () {},
        ),
      ],
    );
  }

  Widget _buildEmergencyTab() {
    return SeniorEmergencySheet(
      allergies: const ['Penicillin', 'Peanuts', 'Sulfa Drugs'],
      homeAddress: '742 Evergreen Terrace, Springfield',
      onEmergencyCall: () {},
    );
  }
}
