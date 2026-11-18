import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'domain/models/user_role.dart';
import 'domain/state/session_state.dart';
import 'domain/state/vault_state.dart';
import 'presentation/navigation/app_router.dart';
import 'presentation/senior/senior_dashboard.dart';
import 'presentation/bento/bento_grid.dart';
import 'presentation/bento/widgets/hero_emergency_card.dart';
import 'presentation/bento/widgets/medication_timeline_card.dart';
import 'presentation/bento/widgets/cash_flow_card.dart';
import 'presentation/bento/widgets/caregiver_shift_card.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SessionState()),
        ChangeNotifierProvider(create: (_) => VaultState()),
      ],
      child: const HomeDashApp(),
    ),
  );
}

class HomeDashApp extends StatelessWidget {
  const HomeDashApp({super.key});

  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionState>(context);

    return MaterialApp(
      title: 'HomeDash — Family OS',
      debugShowCheckedModeBanner: false,
      theme: session.isSeniorMode ? AppTheme.senior() : AppTheme.light(),
      darkTheme: session.isSeniorMode ? AppTheme.senior() : AppTheme.dark(),
      onGenerateRoute: (settings) => AppRouter.generateRoute(settings, session),
      home: session.isSeniorMode
          ? const SeniorDashboard()
          : Scaffold(
              appBar: AppBar(
                title: Text('HomeDash — ${session.activeRole.label}'),
                actions: [
                  PopupMenuButton<UserRole>(
                    icon: const Icon(Icons.account_circle),
                    onSelected: (role) => session.switchRole(role),
                    itemBuilder: (ctx) => UserRole.values
                        .map(
                          (r) => PopupMenuItem(
                            value: r,
                            child: Text(r.label),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
              body: BentoGrid(
                isCaregiver: session.activeRole.isCaregiver,
                children: [
                  const HeroEmergencyCard(
                    title: 'Family Operational Status',
                    message: 'All systems online. Offline-first local synchronization active.',
                  ),
                  MedicationTimelineCard(
                    dueCount: 2,
                    completedCount: 3,
                    onLogDose: () {},
                  ),
                  // CashFlowCard is passed to BentoGrid, which conditionally quarantines it for caregivers
                  CashFlowCard(
                    totalBalanceCents: 1542000,
                    spentThisMonthCents: 412000,
                    onLogExpense: () {},
                  ),
                  CaregiverShiftCard(
                    activeCaregiver: 'Nurse Sarah',
                    shiftWindow: '14:00 - 20:00 (Today)',
                    onHandOffNotes: () {},
                  ),
                ],
              ),
            ),
    );
  }
}
