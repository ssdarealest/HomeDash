import 'dart:math';

class HlcTimestamp {
  final int millis;
  final int counter;
  final String nodeId;

  const HlcTimestamp({
    required this.millis,
    required this.counter,
    required this.nodeId,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HlcTimestamp &&
          runtimeType == other.runtimeType &&
          millis == other.millis &&
          counter == other.counter &&
          nodeId == other.nodeId;

  @override
  int get hashCode => millis.hashCode ^ counter.hashCode ^ nodeId.hashCode;

  @override
  String toString() => HybridLogicalClock.pack(this);
}

class HybridLogicalClock {
  int _lastPhysicalMillis;
  int _logicalCounter;
  final String nodeId;

  HybridLogicalClock({
    required this.nodeId,
    int? initialMillis,
    int? initialCounter,
  })  : _lastPhysicalMillis = initialMillis ?? DateTime.now().toUtc().millisecondsSinceEpoch,
        _logicalCounter = initialCounter ?? 0;

  HlcTimestamp now() {
    final physicalMillis = DateTime.now().toUtc().millisecondsSinceEpoch;
    if (physicalMillis > _lastPhysicalMillis) {
      _lastPhysicalMillis = physicalMillis;
      _logicalCounter = 0;
    } else {
      _logicalCounter += 1;
    }
    return HlcTimestamp(
      millis: _lastPhysicalMillis,
      counter: _logicalCounter,
      nodeId: nodeId,
    );
  }

  HlcTimestamp increment() {
    return now();
  }

  HlcTimestamp receive(HlcTimestamp remote) {
    final physicalMillis = DateTime.now().toUtc().millisecondsSinceEpoch;
    final maxMillis = max(physicalMillis, max(_lastPhysicalMillis, remote.millis));

    if (maxMillis == _lastPhysicalMillis && maxMillis == remote.millis) {
      _logicalCounter = max(_logicalCounter, remote.counter) + 1;
    } else if (maxMillis == _lastPhysicalMillis) {
      _logicalCounter += 1;
    } else if (maxMillis == remote.millis) {
      _logicalCounter = remote.counter + 1;
    } else {
      _logicalCounter = 0;
    }

    _lastPhysicalMillis = maxMillis;
    return HlcTimestamp(
      millis: _lastPhysicalMillis,
      counter: _logicalCounter,
      nodeId: nodeId,
    );
  }

  static String pack(HlcTimestamp ts) {
    final iso = DateTime.fromMillisecondsSinceEpoch(ts.millis, isUtc: true).toIso8601String();
    final counterHex = ts.counter.toRadixString(16).padLeft(8, '0');
    return '${iso}_${counterHex}_${ts.nodeId}';
  }

  static HlcTimestamp unpack(String raw) {
    try {
      // Regex matches: ISO date (with dots/dashes/colons/Z), counter hex, and nodeId (which may have underscores or colons)
      final regex = RegExp(r'^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)[_:]([0-9a-fA-F]+)[_:](.+)$');
      final match = regex.firstMatch(raw);
      if (match != null) {
        final iso = match.group(1)!;
        final counterHex = match.group(2)!;
        final node = match.group(3)!;
        final millis = DateTime.parse(iso).millisecondsSinceEpoch;
        final counter = int.parse(counterHex, radix: 16);
        return HlcTimestamp(millis: millis, counter: counter, nodeId: node);
      }
    } catch (_) {
      // Safe fallback for corrupted or ill-formed timestamps
    }

    // Deterministic fallback: corrupted timestamps evaluate to unix 0 and 'invalid' nodeId
    return const HlcTimestamp(millis: 0, counter: 0, nodeId: 'invalid');
  }

  static int compare(HlcTimestamp a, HlcTimestamp b) {
    if (a.millis != b.millis) {
      return a.millis.compareTo(b.millis);
    }
    if (a.counter != b.counter) {
      return a.counter.compareTo(b.counter);
    }
    return a.nodeId.compareTo(b.nodeId);
  }
}
