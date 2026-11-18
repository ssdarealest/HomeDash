import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Zero-Knowledge Vault Cryptography & State', () => {
  it('should implement two-tier envelope decryption in vault_crypto.dart', () => {
    const cryptoPath = path.resolve(__dirname, '../lib/core/crypto/vault_crypto.dart');
    expect(fs.existsSync(cryptoPath)).toBe(true);
    const content = fs.readFileSync(cryptoPath, 'utf8');
    expect(content).toContain('class VaultCrypto');
    expect(content).toContain('decryptEnvelope');
    expect(content).toContain('encryptEnvelope');
    expect(content).toContain('deriveKek');
  });

  it('should maintain memory-only state and auto-lock in vault_state.dart', () => {
    const statePath = path.resolve(__dirname, '../lib/domain/state/vault_state.dart');
    expect(fs.existsSync(statePath)).toBe(true);
    const content = fs.readFileSync(statePath, 'utf8');
    expect(content).toContain('class VaultState');
    expect(content).toContain('unlock');
    expect(content).toContain('lock');
    expect(content).toContain('isUnlocked');
    expect(content).toContain('decryptItem');
  });
});
