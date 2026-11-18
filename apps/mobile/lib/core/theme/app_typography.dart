import 'package:flutter/material.dart';

class AppTypography {
  // Standard Typography Scale
  static const TextTheme standardTextTheme = TextTheme(
    displayLarge: TextStyle(fontSize: 57, fontWeight: FontWeight.w400, letterSpacing: -0.25),
    displayMedium: TextStyle(fontSize: 45, fontWeight: FontWeight.w400),
    displaySmall: TextStyle(fontSize: 36, fontWeight: FontWeight.w400),
    headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w600),
    headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w600),
    headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
    titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w500),
    titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, letterSpacing: 0.15),
    titleSmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.1),
    bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, letterSpacing: 0.5),
    bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, letterSpacing: 0.25),
    bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, letterSpacing: 0.4),
    labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.1),
    labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, letterSpacing: 0.5),
    labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 0.5),
  );

  // Senior Mode 1.4x Scaled Scale Factor
  static const double seniorScaleFactor = 1.4;

  static TextTheme get seniorTextTheme {
    return TextTheme(
      headlineLarge: TextStyle(
        fontSize: 32 * seniorScaleFactor,
        fontWeight: FontWeight.w700,
        height: 1.3,
        color: const Color(0xFF000000),
      ),
      headlineMedium: TextStyle(
        fontSize: 28 * seniorScaleFactor,
        fontWeight: FontWeight.w700,
        height: 1.3,
        color: const Color(0xFF000000),
      ),
      titleLarge: TextStyle(
        fontSize: 22 * seniorScaleFactor,
        fontWeight: FontWeight.w700,
        height: 1.3,
        color: const Color(0xFF000000),
      ),
      titleMedium: TextStyle(
        fontSize: 16 * seniorScaleFactor,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: const Color(0xFF000000),
      ),
      bodyLarge: TextStyle(
        fontSize: 16 * seniorScaleFactor,
        fontWeight: FontWeight.w600,
        height: 1.4,
        color: const Color(0xFF000000),
      ),
      bodyMedium: TextStyle(
        fontSize: 14 * seniorScaleFactor,
        fontWeight: FontWeight.w500,
        height: 1.4,
        color: const Color(0xFF212121),
      ),
      labelLarge: TextStyle(
        fontSize: 14 * seniorScaleFactor,
        fontWeight: FontWeight.w700,
        height: 1.3,
        letterSpacing: 0.5,
        color: const Color(0xFF000000),
      ),
    );
  }
}
