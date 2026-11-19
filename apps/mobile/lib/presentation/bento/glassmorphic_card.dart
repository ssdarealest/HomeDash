import 'dart:ui';
import 'package:flutter/material.dart';

class GlassmorphicCard extends StatelessWidget {
  final Widget child;
  final bool isGlassmorphic;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const GlassmorphicCard({
    super.key,
    required this.child,
    this.isGlassmorphic = true,
    this.padding = const EdgeInsets.all(16.0),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (!isGlassmorphic) {
      // Solid Material 3 Mode for maximum contrast & accessibility
      return Card(
        elevation: 0,
        color: Theme.of(context).colorScheme.surfaceContainer,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.0),
          side: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant,
            width: 1.0,
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(16.0),
          onTap: onTap,
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      );
    }

    // Glassmorphic surface treatment
    final backgroundColor = isDark
        ? const Color.fromRGBO(255, 255, 255, 0.08)
        : const Color.fromRGBO(255, 255, 255, 0.65);

    final borderColor = isDark
        ? const Color.fromRGBO(255, 255, 255, 0.14)
        : const Color.fromRGBO(255, 255, 255, 0.60);

    return ClipRRect(
      borderRadius: BorderRadius.circular(16.0),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16.0, sigmaY: 16.0),
        child: Container(
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(16.0),
            border: Border.all(
              color: borderColor,
              width: 1.0,
            ),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16.0),
              onTap: onTap,
              child: Padding(
                padding: padding,
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
