import '../../core/hlc/hlc.dart';

enum ReconcileDecision {
  applyIncoming,
  retainExisting,
  rejectCorrupt,
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
    final inTs = HybridLogicalClock.unpack(incomingHlc);

    // Defend against corrupted or ill-formed timestamps
    if (inTs.nodeId == 'invalid' || inTs.millis == 0) {
      final fallbackHlc = existingHlc ?? '1970-01-01T00:00:00.000Z_00000000_invalid';
      return ReconcileResult(
        decision: ReconcileDecision.rejectCorrupt,
        shouldApply: false,
        isTombstone: false,
        winnerHlc: fallbackHlc,
      );
    }

    // If no existing record exists locally, apply incoming change
    if (existingHlc == null || existingRecord == null) {
      return ReconcileResult(
        decision: ReconcileDecision.applyIncoming,
        shouldApply: true,
        isTombstone: isIncomingDeleted,
        winnerHlc: incomingHlc,
      );
    }

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
