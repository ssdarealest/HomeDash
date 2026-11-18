import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.familyBlueSeed,
      brightness: Brightness.light,
    );
    return _buildTheme(colorScheme, AppTypography.standardTextTheme, isSenior: false);
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.familyBlueSeed,
      brightness: Brightness.dark,
    );
    return _buildTheme(colorScheme, AppTypography.standardTextTheme, isSenior: false);
  }

  static ThemeData senior() {
    const colorScheme = ColorScheme.light(
      primary: AppColors.seniorPrimaryAction,
      onPrimary: Colors.white,
      secondary: AppColors.seniorPrimaryAction,
      onSecondary: Colors.white,
      surface: AppColors.seniorSurface,
      onSurface: AppColors.seniorText,
      error: AppColors.seniorEmergencyAction,
      onError: Colors.white,
    );
    return _buildTheme(colorScheme, AppTypography.seniorTextTheme, isSenior: true);
  }

  static ThemeData _buildTheme(
    ColorScheme colorScheme,
    TextTheme textTheme, {
    required bool isSenior,
  }) {
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: isSenior ? AppColors.seniorBackground : colorScheme.surface,
      cardTheme: CardTheme(
        elevation: isSenior ? 2 : 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(isSenior ? 12 : 16),
          side: isSenior ? const BorderSide(color: AppColors.seniorCardBorder, width: 2) : BorderSide.none,
        ),
        color: isSenior ? AppColors.seniorSurface : AppColors.surfaceContainer(colorScheme),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(48, 48),
          padding: EdgeInsets.symmetric(
            horizontal: isSenior ? 24 : 16,
            vertical: isSenior ? 16 : 12,
          ),
          textStyle: isSenior
              ? const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
              : const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(isSenior ? 8 : 12),
          ),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          minimumSize: const Size(48, 48),
        ),
      ),
    );
  }
}
