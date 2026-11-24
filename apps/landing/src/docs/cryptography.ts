import type { DocArticle } from './types';

export const cryptographyDoc: DocArticle = {
  id: 'cryptography',
  title: 'Cryptography & Security Architecture',
  description:
    'In-depth architectural review of zero-knowledge client-side encryption, Argon2id key derivation, XChaCha20-Poly1305 envelope encryption, and Shamir break-glass recovery.',
  category: 'Security',
  badge: 'Zero-Knowledge',
  iconName: 'Shield',
  sections: [
    {
      id: 'zero-knowledge-model',
      title: 'Zero-Knowledge Security Model',
      content:
        'HomeDash implements an uncompromising zero-knowledge architecture. The backend server and storage layers act purely as blind relays and encrypted block stores. Cryptographic operations occur strictly within client devices before any payload is committed to network transport.',
      table: {
        headers: ['Layer', 'Cryptographic Primitive', 'Specification', 'Security Guarantee'],
        rows: [
          ['Key Derivation', 'Argon2id', '64 MB Memory, 3 Iterations, p=4', 'Quantum-resistant brute force & ASIC mitigation'],
          ['Data Encryption', 'XChaCha20-Poly1305', '256-bit Key, 192-bit Extended Nonce', 'Authenticated Encryption with Associated Data (AEAD)'],
          ['Break-Glass Escrow', 'Shamir Secret Sharing', '2-of-3 Quorum Threshold, GF(256)', 'Distributed threshold recovery without single point of failure'],
          ['Identity & Auth', 'FIDO2 / WebAuthn', 'ECDSA P-256 / Ed25519 Passkeys', 'Phishing-resistant passwordless authentication'],
        ],
      },
    },
    {
      id: 'argon2id-derivation',
      title: 'Client-Side Key Derivation (Argon2id)',
      content:
        'The Household Master Key (HMK) is derived client-side from the user passphrase and a unique household salt using Argon2id, the state-of-the-art password-hashing algorithm selected by the Password Hashing Competition (PHC).',
      subsections: [
        {
          id: 'argon2id-parameters',
          title: 'Memory and Time Hardness Parameters',
          content:
            'To neutralize GPU and specialized ASIC cluster acceleration attacks, HomeDash mandates: Memory Cost (m): 65536 KiB (64 MB), Time Cost (t): 3 iterations, Parallelism (p): 4 threads, Output Length: 32 bytes (256-bit derived key), Salt: 32 cryptographically random bytes generated via Web Crypto API.',
        },
      ],
      snippets: [
        {
          language: 'typescript',
          filename: 'packages/crypto/src/kdf.ts',
          description: 'Client-side Argon2id key derivation invocation using WebAssembly',
          code: `import { argon2id } from 'hash-wasm';

export interface KdfParameters {
  passphrase: string;
  salt: Uint8Array;
}

export async function deriveHouseholdMasterKey({
  passphrase,
  salt,
}: KdfParameters): Promise<Uint8Array> {
  const derivedKeyHex = await argon2id({
    password: passphrase,
    salt,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536, // 64 MB memory cost
    hashLength: 32,    // 256-bit key output
    outputType: 'hex',
  });

  return new Uint8Array(
    derivedKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
}`,
        },
      ],
    },
    {
      id: 'envelope-encryption',
      title: 'Envelope Encryption (XChaCha20-Poly1305)',
      content:
        'HomeDash adopts an envelope encryption pattern. Every sensitive record (financial transaction, health vital, vault secret, or receipt blob) is encrypted under a unique, disposable Data Encryption Key (DEK). The DEK is subsequently encrypted under the Household Master Key (HMK).',
      subsections: [
        {
          id: 'xchacha20-nonce-security',
          title: '192-bit Extended Nonce Advantage',
          content:
            'Standard ChaCha20-Poly1305 utilizes a 96-bit nonce, which carries birthday paradox collision risks after approximately 2^48 messages under a single key. XChaCha20 extends the nonce to 192 bits (24 bytes) using HChaCha20 subkey derivation, making random nonce collision mathematically impossible across the lifetime of the universe.',
        },
      ],
      snippets: [
        {
          language: 'typescript',
          filename: 'packages/crypto/src/envelope.ts',
          description: 'XChaCha20-Poly1305 envelope encryption workflow',
          code: `import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/ciphers/webcrypto';

export interface EncryptedEnvelope {
  ciphertext: Uint8Array;
  nonce: Uint8Array;          // 24 bytes (192-bit XChaCha20 nonce)
  encryptedDek: Uint8Array;    // DEK encrypted under HMK
  dekNonce: Uint8Array;        // 24 bytes nonce for DEK wrapper
}

export function encryptRecord(
  plaintext: Uint8Array,
  householdMasterKey: Uint8Array
): EncryptedEnvelope {
  // 1. Generate ephemeral 256-bit Data Encryption Key (DEK)
  const dek = randomBytes(32);
  const nonce = randomBytes(24);

  // 2. Encrypt plaintext payload with DEK
  const cipher = xchacha20poly1305(dek, nonce);
  const ciphertext = cipher.encrypt(plaintext);

  // 3. Encrypt DEK under Household Master Key
  const dekNonce = randomBytes(24);
  const masterCipher = xchacha20poly1305(householdMasterKey, dekNonce);
  const encryptedDek = masterCipher.encrypt(dek);

  return { ciphertext, nonce, encryptedDek, dekNonce };
}`,
        },
      ],
    },
    {
      id: 'shamir-break-glass',
      title: 'Shamir Secret Sharing Break-Glass Escrow',
      content:
        'In the event of medical emergencies, death, or complete loss of primary hardware authenticators, HomeDash provides a deterministic break-glass escrow mechanism governed by Shamir Secret Sharing with a 2-of-3 quorum threshold.',
      subsections: [
        {
          id: 'shamir-threshold-math',
          title: '2-of-3 Quorum Threshold',
          content:
            'The Household Master Key is split into 3 distinct mathematical shares using a degree-1 polynomial over the finite field GF(256). Any 2 shares suffice to reconstruct the secret key via Lagrange polynomial interpolation. Any single share yields zero mathematical knowledge about the underlying key.',
        },
        {
          id: 'break-glass-cooldown',
          title: '48-Hour Mandatory Cooldown & Veto Safety Window',
          content:
            'When a recovery contact submits their share to initiate break-glass recovery, a tamper-proof 48-hour countdown timer begins immediately. Realtime push notifications, SMS alerts, and email notices broadcast to all household members. Any active household administrator can veto and terminate the recovery attempt with one tap.',
        },
      ],
      snippets: [
        {
          language: 'typescript',
          filename: 'packages/crypto/src/shamir.ts',
          description: 'Shamir Secret Sharing share generation and Lagrange polynomial reconstruction',
          code: `import { splitSecret, combineShares } from '@homedash/crypto';

// Split master key into 3 shares with threshold 2
export function setupEmergencyEscrow(masterKey: Uint8Array) {
  const shares = splitSecret(masterKey, {
    shares: 3,     // Total shards produced
    threshold: 2,  // 2-of-3 quorum required to reconstruct
  });

  return {
    shareA: shares[0], // Distributed to trusted steward 1
    shareB: shares[1], // Distributed to trusted steward 2
    shareC: shares[2], // Physical vault lockbox backup
  };
}

// Reconstruct master key from any 2 quorum shares
export function recoverMasterKey(shard1: string, shard2: string): Uint8Array {
  return combineShares([shard1, shard2]);
}`,
        },
      ],
    },
  ],
};
