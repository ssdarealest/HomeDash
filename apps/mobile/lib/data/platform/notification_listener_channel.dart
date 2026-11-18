import 'dart:async';
import 'package:flutter/services.dart';

class ParsedBankNotification {
  final double amount;
  final String merchant;
  final String currency;
  final DateTime timestamp;
  final String rawText;

  const ParsedBankNotification({
    required this.amount,
    required this.merchant,
    required this.currency,
    required this.timestamp,
    required this.rawText,
  });

  Map<String, dynamic> toJson() => {
        'amount': amount,
        'merchant': merchant,
        'currency': currency,
        'timestamp': timestamp.toIso8601String(),
        'rawText': rawText,
      };
}

class NotificationListenerChannel {
  static const MethodChannel _channel = MethodChannel('com.homedash.app/notification_listener');
  static const EventChannel _eventChannel = EventChannel('com.homedash.app/notification_events');

  final StreamController<ParsedBankNotification> _mockStreamController =
      StreamController<ParsedBankNotification>.broadcast();

  Stream<ParsedBankNotification> get notificationStream {
    // Merge real Android EventChannel broadcast stream with simulator mock stream
    try {
      final nativeStream = _eventChannel.receiveBroadcastStream()
          .map((event) => parseTransactionPayload(event.toString()))
          .where((p) => p != null)
          .cast<ParsedBankNotification>();

      return StreamGroup.merge([nativeStream, _mockStreamController.stream]);
    } catch (_) {
      // In simulator or non-Android environment, return mock stream
      return _mockStreamController.stream;
    }
  }

  /// Parses incoming notification body text for bank/card transaction patterns:
  /// Examples:
  /// - "Chase: You made a $42.50 transaction at TRADER JOE'S on Nov 18"
  /// - "Apple Pay: Charged $15.99 at SPOTIFY"
  static ParsedBankNotification? parseTransactionPayload(String text) {
    try {
      final amountRegex = RegExp(r'[\$£€]\s?([0-9]+(?:\.[0-9]{2})?)');
      final match = amountRegex.firstMatch(text);
      if (match == null) return null;

      final amount = double.parse(match.group(1)!);

      // Extract merchant if preceded by "at" or "to"
      final merchantRegex = RegExp(r'\b(?:at|to)\s+([A-Z0-9\s&.\'\-]+?)(?:\s+(?:on|with|card|\.|$))', caseSensitive: false);
      final merchantMatch = merchantRegex.firstMatch(text);
      final merchant = merchantMatch != null ? merchantMatch.group(1)!.trim() : 'Unknown Merchant';

      return ParsedBankNotification(
        amount: amount,
        merchant: merchant,
        currency: 'USD',
        timestamp: DateTime.now(),
        rawText: text,
      );
    } catch (_) {
      return null;
    }
  }

  /// Helper for simulator/testing: emits simulated bank transaction into the staging stream
  void emitMockNotification(String rawNotificationText) {
    final parsed = parseTransactionPayload(rawNotificationText);
    if (parsed != null) {
      _mockStreamController.add(parsed);
    }
  }

  Future<bool> isPermissionGranted() async {
    try {
      final bool result = await _channel.invokeMethod('isPermissionGranted');
      return result;
    } catch (_) {
      return true;
    }
  }

  Future<void> requestPermission() async {
    try {
      await _channel.invokeMethod('requestPermission');
    } catch (_) {
      // Stub
    }
  }

  void dispose() {
    _mockStreamController.close();
  }
}

// Minimal stream group merger for pure Dart
class StreamGroup {
  static Stream<T> merge<T>(List<Stream<T>> streams) {
    final controller = StreamController<T>.broadcast();
    for (final s in streams) {
      s.listen(controller.add, onError: controller.addError);
    }
    return controller.stream;
  }
}
