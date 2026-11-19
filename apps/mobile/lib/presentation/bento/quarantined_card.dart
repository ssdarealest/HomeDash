import 'package:flutter/widgets.dart';

/// Marker interface for widgets containing sensitive financial or vault data
/// that must never be rendered to caregiver guests.
abstract class QuarantinedCard {
  bool get isQuarantined => true;
}

/// Recursively inspects a widget tree to ensure quarantined sensitive cards
/// are detected and quarantined even when wrapped in Padding, KeyedSubtree, etc.
bool isQuarantinedCard(Widget widget) {
  if (widget is QuarantinedCard) return true;
  if (widget is SingleChildRenderObjectWidget && widget.child != null) {
    return isQuarantinedCard(widget.child!);
  }
  if (widget is KeyedSubtree) {
    return isQuarantinedCard(widget.child);
  }
  return false;
}
