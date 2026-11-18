import '../../core/hlc/hlc.dart';

enum ReconcileDecision {
  applyIncoming,
  retainExisting,
}

class ReconcileResult {
  final ReconcileDecision decision;
  final bool shouldApply;
  final bool isTombstone;
  final String winnerHlc;

  const ReconcileResult({
    required this.decision,
    required this.shouldApply,
    required this.isTombstone,
    required this.winnerHlc,
  });
}

class ConflictReconciler {
  /// Reconciles an incoming remote change against the existing local record
  /// using deterministic Last-Write-Wins (LWW) with HLC comparison.
  static ReconcileResult reconcileHlc({
    required String incomingHlc,
    required Map<String, dynamic> incomingRecord,
    required String? existingHlc,
    required Map<String, dynamic>? existingRecord,
    bool isIncomingDeleted = false,
  }) {
    // If no existing record exists locally, always apply incoming change
    if (existingHlc == null || existingRecord == null) {
      return ReconcileResult(
        decision: ReconcileDecision.applyIncoming,
        shouldApply: true,
        isTombstone: isIncomingDeleted,
        winnerHlc: incomingHlc,
      );
    }

    final inTs = HybridLogicalClock.unpack(incomingHlc);
    final exTs = HybridLogicalClock.unpack(existingHlc);
    final comparison = HybridLogicalClock.compare(inTs, exTs);

    if (comparison > 0) {
      // Incoming is strictly newer by physical millis, counter, or node ID tie-break
      return ReconcileResult(
        decision: ReconcileDecision.applyIncoming,
        shouldApply: true,
        isTombstone: isIncomingDeleted,
        winnerHlc: incomingHlc,
      );
    } else {
      // Existing record is newer or wins tie-break; retain local state
      final existingDeleted = existingRecord['is_deleted'] == true ||
          existingRecord['isDeleted'] == true;
      return ReconcileResult(
        decision: ReconcileDecision.retainExisting,
        shouldApply: false,
        isTombstone: existingDeleted,
        winnerHlc: existingHlc,
      );
    }
  }
}
