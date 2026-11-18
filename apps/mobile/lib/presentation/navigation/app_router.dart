import 'package:flutter/material.dart';
import '../../domain/models/user_role.dart';
import '../../domain/state/session_state.dart';

class AppRouter {
  /// Strictly checks whether the active session role has permission to access a route.
  /// Caregiver guests are unconditionally blocked from `/finance` and `/vault`.
  static bool canAccessRoute(String route, UserRole role) {
    if (role == UserRole.caregiverGuest || role.value == 'caregiver_guest') {
      if (route == '/finance' ||
          route.startsWith('/finance/') ||
          route == '/vault' ||
          route.startsWith('/vault/')) {
        return false;
      }
    }
    return true;
  }

  static Route<dynamic> generateRoute(RouteSettings settings, SessionState session) {
    final route = settings.name ?? '/';

    // Route quarantine enforcement
    if (!canAccessRoute(route, session.activeRole)) {
      return MaterialPageRoute(
        builder: (_) => Scaffold(
          appBar: AppBar(title: const Text('Access Denied')),
          body: const Center(
            child: Padding(
              padding: EdgeInsets.all(24.0),
              child: Text(
                'Caregiver Guest accounts are strictly quarantined from financial and zero-knowledge vault modules.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.red),
              ),
            ),
          ),
        ),
      );
    }

    return MaterialPageRoute(
      builder: (_) => Scaffold(
        body: Center(child: Text('Route: $route')),
      ),
    );
  }
}
