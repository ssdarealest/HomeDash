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
    return _mockStreamController.stream;
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
      // In simulator / non-Android environment, return mock true
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
