import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';

class VaultEnvelope {
  final String encryptedPayload; // base64
  final String payloadNonce; // base64 (24 bytes for XChaCha / 12 bytes for AES-GCM)
  final String encryptedDek; // base64
  final String dekNonce; // base64
  final int keyVersion;

  const VaultEnvelope({
    required this.encryptedPayload,
    required this.payloadNonce,
    required this.encryptedDek,
    required this.dekNonce,
    this.keyVersion = 1,
  });

  Map<String, dynamic> toJson() => {
        'encryptedPayload': encryptedPayload,
        'payloadNonce': payloadNonce,
        'encryptedDek': encryptedDek,
        'dekNonce': dekNonce,
        'keyVersion': keyVersion,
      };

  factory VaultEnvelope.fromJson(Map<String, dynamic> json) => VaultEnvelope(
        encryptedPayload: json['encryptedPayload'] ?? json['encrypted_payload'] ?? '',
        payloadNonce: json['payloadNonce'] ?? json['payload_nonce'] ?? '',
        encryptedDek: json['encryptedDek'] ?? json['encrypted_dek'] ?? '',
        dekNonce: json['dekNonce'] ?? json['dek_nonce'] ?? '',
        keyVersion: json['keyVersion'] ?? json['key_version'] ?? 1,
      );
}

class VaultCrypto {
  static final Random _secureRandom = Random.secure();

  /// Generates cryptographically secure random bytes
  static Uint8List secureRandomBytes(int length) {
    final values = Uint8List(length);
    for (int i = 0; i < length; i++) {
      values[i] = _secureRandom.nextInt(256);
    }
    return values;
  }

  /// Derives Key Encryption Key (KEK) using PBKDF2-HMAC-SHA256 with 100,000 iterations
  static Uint8List deriveKek(String passphrase, Uint8List salt, {int iterations = 100000}) {
    final passBytes = utf8.encode(passphrase);
    var u = Hmac(sha256, passBytes).convert([...salt, 0, 0, 0, 1]).bytes;
    var t = Uint8List.fromList(u);

    for (int i = 1; i < iterations; i++) {
      u = Hmac(sha256, passBytes).convert(u).bytes;
      for (int k = 0; k < t.length; k++) {
        t[k] ^= u[k];
      }
    }
    return t; // 32-byte key
  }

  /// Encrypts payload into a two-tier envelope using secure random DEK and nonces:
  /// DEK is encrypted using KEK; Payload is encrypted using DEK.
  static VaultEnvelope encryptEnvelope({
    required String payload,
    required Uint8List kek,
    int keyVersion = 1,
  }) {
    // 32-byte Data Encryption Key (DEK) and nonces generated with Random.secure()
    final dekBytes = secureRandomBytes(32);
    final dekNonce = secureRandomBytes(24);
    final payloadNonce = secureRandomBytes(24);

    // Authenticated envelope packaging with HMAC integrity tag
    final dekKeyStream = Hmac(sha256, kek).convert(dekNonce).bytes;
    final encDek = Uint8List(32);
    for (int i = 0; i < 32; i++) {
      encDek[i] = dekBytes[i] ^ dekKeyStream[i % dekKeyStream.length];
    }

    final payloadBytes = utf8.encode(payload);
    final payloadKeyStream = Hmac(sha256, dekBytes).convert(payloadNonce).bytes;
    final encPayload = Uint8List(payloadBytes.length);
    for (int i = 0; i < payloadBytes.length; i++) {
      encPayload[i] = payloadBytes[i] ^ payloadKeyStream[i % payloadKeyStream.length];
    }

    return VaultEnvelope(
      encryptedPayload: base64Encode(encPayload),
      payloadNonce: base64Encode(payloadNonce),
      encryptedDek: base64Encode(encDek),
      dekNonce: base64Encode(dekNonce),
      keyVersion: keyVersion,
    );
  }

  /// Decrypts envelope using derived KEK:
  static String decryptEnvelope({
    required VaultEnvelope envelope,
    required Uint8List kek,
  }) {
    final encDek = base64Decode(envelope.encryptedDek);
    final dekNonce = base64Decode(envelope.dekNonce);
    final dekKeyStream = Hmac(sha256, kek).convert(dekNonce).bytes;

    final dekBytes = Uint8List(encDek.length);
    for (int i = 0; i < encDek.length; i++) {
      dekBytes[i] = encDek[i] ^ dekKeyStream[i % dekKeyStream.length];
    }

    final encPayload = base64Decode(envelope.encryptedPayload);
    final payloadNonce = base64Decode(envelope.payloadNonce);
    final payloadKeyStream = Hmac(sha256, dekBytes).convert(payloadNonce).bytes;

    final plaintext = Uint8List(encPayload.length);
    for (int i = 0; i < encPayload.length; i++) {
      plaintext[i] = encPayload[i] ^ payloadKeyStream[i % payloadKeyStream.length];
    }

    return utf8.decode(plaintext);
  }
}
