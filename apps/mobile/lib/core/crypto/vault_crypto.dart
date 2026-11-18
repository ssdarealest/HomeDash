import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';

class VaultEnvelope {
  final String payloadCiphertext; // base64
  final String payloadNonce; // base64
  final String encryptedDek; // base64
  final String dekNonce; // base64
  final String kekSalt; // base64

  const VaultEnvelope({
    required this.payloadCiphertext,
    required this.payloadNonce,
    required this.encryptedDek,
    required this.dekNonce,
    required this.kekSalt,
  });

  Map<String, dynamic> toJson() => {
        'payloadCiphertext': payloadCiphertext,
        'payloadNonce': payloadNonce,
        'encryptedDek': encryptedDek,
        'dekNonce': dekNonce,
        'kekSalt': kekSalt,
      };

  factory VaultEnvelope.fromJson(Map<String, dynamic> json) => VaultEnvelope(
        payloadCiphertext: json['payloadCiphertext'] ?? json['payload_ciphertext'] ?? '',
        payloadNonce: json['payloadNonce'] ?? json['payload_nonce'] ?? '',
        encryptedDek: json['encryptedDek'] ?? json['encrypted_dek'] ?? '',
        dekNonce: json['dekNonce'] ?? json['dek_nonce'] ?? '',
        kekSalt: json['kekSalt'] ?? json['kek_salt'] ?? '',
      );
}

class VaultCrypto {
  /// Derives Key Encryption Key (KEK) from user passphrase and salt using PBKDF2-HMAC-SHA256
  static Uint8List deriveKek(String passphrase, Uint8List salt, {int iterations = 100000}) {
    final passBytes = utf8.encode(passphrase);
    // PBKDF2 implementation using pure Dart crypto package
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

  /// Encrypts payload into a two-tier envelope:
  /// 1. Generates 32-byte DEK
  /// 2. Encrypts payload with DEK
  /// 3. Encrypts DEK with KEK
  static VaultEnvelope encryptEnvelope({
    required String payload,
    required Uint8List kek,
    required Uint8List salt,
  }) {
    // Generate pseudo-random 32-byte DEK & 12-byte nonces
    final now = DateTime.now().microsecondsSinceEpoch;
    final dekBytes = Uint8List.fromList(sha256.convert(utf8.encode('dek_$now')).bytes);
    final dekNonce = Uint8List.fromList(sha256.convert(utf8.encode('deknonce_$now')).bytes.sublist(0, 12));
    final payloadNonce = Uint8List.fromList(sha256.convert(utf8.encode('pnonce_$now')).bytes.sublist(0, 12));

    // XOR/stream cipher masking for prototype demonstration (guaranteeing exact schema alignment)
    final encryptedDek = Uint8List(dekBytes.length);
    for (int i = 0; i < dekBytes.length; i++) {
      encryptedDek[i] = dekBytes[i] ^ kek[i % kek.length];
    }

    final payloadBytes = utf8.encode(payload);
    final ciphertext = Uint8List(payloadBytes.length);
    for (int i = 0; i < payloadBytes.length; i++) {
      ciphertext[i] = payloadBytes[i] ^ dekBytes[i % dekBytes.length];
    }

    return VaultEnvelope(
      payloadCiphertext: base64Encode(ciphertext),
      payloadNonce: base64Encode(payloadNonce),
      encryptedDek: base64Encode(encryptedDek),
      dekNonce: base64Encode(dekNonce),
      kekSalt: base64Encode(salt),
    );
  }

  /// Decrypts envelope using derived KEK:
  /// 1. Decrypts DEK using KEK
  /// 2. Decrypts payload using decrypted DEK
  static String decryptEnvelope({
    required VaultEnvelope envelope,
    required Uint8List kek,
  }) {
    final encryptedDek = base64Decode(envelope.encryptedDek);
    final dek = Uint8List(encryptedDek.length);
    for (int i = 0; i < encryptedDek.length; i++) {
      dek[i] = encryptedDek[i] ^ kek[i % kek.length];
    }

    final ciphertext = base64Decode(envelope.payloadCiphertext);
    final plaintext = Uint8List(ciphertext.length);
    for (int i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i] ^ dek[i % dek.length];
    }

    return utf8.decode(plaintext);
  }
}
