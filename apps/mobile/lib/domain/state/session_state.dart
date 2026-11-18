import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/user_role.dart';

class SessionState extends ChangeNotifier {
  String _activeHouseholdId = 'household_default_01';
  String _activeUserId = 'user_admin_01';
  String _activeUserName = 'Family Admin';
  UserRole _activeRole = UserRole.admin;
  String _jwtToken = 'demo_admin_jwt_session_token';
  bool _isSeniorMode = false;
  String _apiBaseUrl = 'http://localhost:3000';

  String get activeHouseholdId => _activeHouseholdId;
  String get activeUserId => _activeUserId;
  String get activeUserName => _activeUserName;
  UserRole get activeRole => _activeRole;
  String get jwtToken => _jwtToken;
  bool get isSeniorMode => _isSeniorMode;
  String get apiBaseUrl => _apiBaseUrl;

  void setApiBaseUrl(String url) {
    _apiBaseUrl = url;
    notifyListeners();
  }

  void switchRole(UserRole role) {
    _activeRole = role;
    if (role == UserRole.senior) {
      _isSeniorMode = true;
      _activeUserId = 'user_senior_01';
      _activeUserName = 'Grandma Rose';
      _jwtToken = 'demo_senior_jwt_session_token';
    } else if (role == UserRole.admin) {
      _isSeniorMode = false;
      _activeUserId = 'user_admin_01';
      _activeUserName = 'Family Admin';
      _jwtToken = 'demo_admin_jwt_session_token';
    } else if (role == UserRole.teenChild) {
      _isSeniorMode = false;
      _activeUserId = 'user_teen_01';
      _activeUserName = 'Leo (Teen)';
      _jwtToken = 'demo_teen_jwt_session_token';
    } else if (role == UserRole.caregiverGuest) {
      _isSeniorMode = false;
      _activeUserId = 'user_caregiver_01';
      _activeUserName = 'Nurse Sarah';
      _jwtToken = 'demo_caregiver_jwt_session_token';
    }
    notifyListeners();
  }

  void toggleSeniorMode(bool enabled) {
    _isSeniorMode = enabled;
    notifyListeners();
  }

  Future<bool> consumeCaregiverMagicLink(String token) async {
    try {
      final url = Uri.parse('$_apiBaseUrl/auth/caregiver/verify');
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': token}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        _jwtToken = data['token'] as String? ?? token;
        _activeRole = UserRole.caregiverGuest;
        _isSeniorMode = false;
        notifyListeners();
        return true;
      }
    } catch (_) {
      // In offline / simulator mode, fall back to setting caregiver profile directly
    }

    _activeRole = UserRole.caregiverGuest;
    _jwtToken = token;
    _isSeniorMode = false;
    notifyListeners();
    return true;
  }
}
