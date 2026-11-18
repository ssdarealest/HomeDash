import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import '../../core/crypto/vault_crypto.dart';

class VaultState extends ChangeNotifier {
  Uint8List? _activeKek;
  bool _isUnlocked = false;

  bool get isUnlocked => _isUnlocked;

  Future<bool> unlock(String passphrase, {Uint8List? salt}) async {
    try {
      final s = salt ?? Uint8List.fromList(utf8.encode('homedash_vault_salt_constant'));
      _activeKek = VaultCrypto.deriveKek(passphrase, s, iterations: 100000);
      _isUnlocked = true;
      notifyListeners();
      return true;
    } catch (_) {
      _activeKek = null;
      _isUnlocked = false;
      notifyListeners();
      return false;
    }
  }

  void lock() {
    _activeKek = null;
    _isUnlocked = false;
    notifyListeners();
  }

  String? decryptItem(VaultEnvelope envelope) {
    if (!_isUnlocked || _activeKek == null) {
      throw StateError('Vault is locked. Cannot decrypt items without unlocking.');
    }
    return VaultCrypto.decryptEnvelope(envelope: envelope, kek: _activeKek!);
  }

  VaultEnvelope encryptItem(String plaintext, {int keyVersion = 1}) {
    if (!_isUnlocked || _activeKek == null) {
      throw StateError('Vault is locked. Cannot encrypt items without unlocking.');
    }
    return VaultCrypto.encryptEnvelope(payload: plaintext, kek: _activeKek!, keyVersion: keyVersion);
  }
}
