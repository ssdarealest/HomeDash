import { describe, it, expect } from 'vitest';
import { derivePersonalKek } from '../src/argon2';
import { sealVaultItem, unsealVaultItem } from '../src/envelope';
import { sealEscrowShare, unsealEscrowShare, generateX25519Keypair } from '../src/escrow';
import cryptoVectors from '@homedash/shared/fixtures/crypto-vectors.json';

describe('Cryptographic Primitives & Envelope Encryption', () => {
  it('should derive personal KEK deterministically from passphrase and salt', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const kek1 = await derivePersonalKek(cryptoVectors.argon2id.passphrase, salt, { memory: 1024, iterations: 1 });
    const kek2 = await derivePersonalKek(cryptoVectors.argon2id.passphrase, salt, { memory: 1024, iterations: 1 });

    expect(kek1.length).toBe(32);
    expect(kek1).toEqual(kek2);
  });

  it('should seal and unseal vault item using envelope encryption (DEK + KEK)', () => {
    const householdKek = new Uint8Array(32).fill(7);
    const originalText = 'Allergy: Penicillin - Severe anaphylaxis risk';
    const payload = new TextEncoder().encode(originalText);

    const sealed = sealVaultItem(payload, householdKek);
    expect(sealed.encryptedPayload).toBeDefined();
    expect(sealed.payloadNonce).toBeDefined();
    expect(sealed.encryptedDek).toBeDefined();
    expect(sealed.dekNonce).toBeDefined();

    const unsealed = unsealVaultItem(sealed, householdKek);
    const recoveredText = new TextDecoder().decode(unsealed);
    expect(recoveredText).toBe(originalText);

    // Wrong KEK should throw error
    const wrongKek = new Uint8Array(32).fill(9);
    expect(() => unsealVaultItem(sealed, wrongKek)).toThrow();
  });

  it('should seal and unseal Break-Glass escrow share using X25519 asymmetric ECDH', () => {
    const householdKek = new Uint8Array(32).fill(42);
    const recipientKeypair = generateX25519Keypair();

    const escrowShare = sealEscrowShare(householdKek, recipientKeypair.publicKey);
    expect(escrowShare.encryptedKekShare).toBeDefined();
    expect(escrowShare.ephemeralPublicKey).toBeDefined();
    expect(escrowShare.nonce).toBeDefined();

    const recoveredKek = unsealEscrowShare(escrowShare, recipientKeypair.privateKey);
    expect(recoveredKek).toEqual(householdKek);

    // Wrong private key must fail
    const impostorKeypair = generateX25519Keypair();
    expect(() => unsealEscrowShare(escrowShare, impostorKeypair.privateKey)).toThrow();
  });
});
