import 'package:flutter/material.dart';

class AppColors {
  // Brand seeds
  static const Color familyBlueSeed = Color(0xFF1E88E5);
  static const Color healthGreenSeed = Color(0xFF2E7D32);
  static const Color emergencyRed = Color(0xFFD32F2F);

  // Light Mode M3 Tonal Surfaces
  static const Color surfaceContainerLowestLight = Color(0xFFFFFFFF);
  static const Color surfaceContainerLowLight = Color(0xFFF7F2FA);
  static const Color surfaceContainerLight = Color(0xFFF3EDF7);
  static const Color surfaceContainerHighLight = Color(0xFFECE6F0);
  static const Color surfaceContainerHighestLight = Color(0xFFE6E0E9);

  // Dark Mode M3 Tonal Surfaces
  static const Color surfaceContainerLowestDark = Color(0xFF0F0D13);
  static const Color surfaceContainerLowDark = Color(0xFF1D1B20);
  static const Color surfaceContainerDark = Color(0xFF211F26);
  static const Color surfaceContainerHighDark = Color(0xFF2B2930);
  static const Color surfaceContainerHighestDark = Color(0xFF36343B);

  // Dynamic getters mapped to ColorScheme
  static Color surfaceContainerLowest(ColorScheme scheme) =>
      scheme.brightness == Brightness.light
          ? surfaceContainerLowestLight
          : surfaceContainerLowestDark;

  static Color surfaceContainerLow(ColorScheme scheme) =>
      scheme.brightness == Brightness.light
          ? surfaceContainerLowLight
          : surfaceContainerLowDark;

  static Color surfaceContainer(ColorScheme scheme) =>
      scheme.brightness == Brightness.light
          ? surfaceContainerLight
          : surfaceContainerDark;

  static Color surfaceContainerHigh(ColorScheme scheme) =>
      scheme.brightness == Brightness.light
          ? surfaceContainerHighLight
          : surfaceContainerHighDark;

  static Color surfaceContainerHighest(ColorScheme scheme) =>
      scheme.brightness == Brightness.light
          ? surfaceContainerHighestLight
          : surfaceContainerHighestDark;

  // Senior Mode High-Contrast Tokens (WCAG AAA)
  static const Color seniorBackground = Color(0xFFFFFFFF);
  static const Color seniorSurface = Color(0xFFF5F5F5);
  static const Color seniorCardBorder = Color(0xFF000000);
  static const Color seniorText = Color(0xFF000000);
  static const Color seniorSecondaryText = Color(0xFF212121);
  static const Color seniorPrimaryAction = Color(0xFF0D47A1); // Deep High-Contrast Blue
  static const Color seniorEmergencyAction = Color(0xFFB71C1C); // Deep High-Contrast Red
}
