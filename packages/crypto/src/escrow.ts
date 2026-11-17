import { x25519 } from '@noble/curves/ed25519';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { toBase64, fromBase64 } from './envelope';

export const ESCROW_HKDF_INFO = 'homedash-escrow-kek';

export interface X25519Keypair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EscrowShare {
  encryptedKekShare: string;
  ephemeralPublicKey: string;
  nonce: string;
}

export function generateX25519Keypair(): X25519Keypair {
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

export function deriveEscrowEncryptionKey(sharedSecret: Uint8Array): Uint8Array {
  return hkdf(sha256, sharedSecret, undefined, ESCROW_HKDF_INFO, 32);
}

export function sealEscrowShare(
  householdKek: Uint8Array,
  recipientPublicKey: Uint8Array
): EscrowShare {
  // 1. Generate ephemeral keypair for ECDH
  const ephemeral = generateX25519Keypair();

  // 2. Perform X25519 Diffie-Hellman to derive shared secret & pass through HKDF
  const sharedSecret = x25519.getSharedSecret(ephemeral.privateKey, recipientPublicKey);
  const encryptionKey = deriveEscrowEncryptionKey(sharedSecret);

  // 3. Encrypt Household KEK with derived encryption key
  const nonce = crypto.getRandomValues(new Uint8Array(24));
  const cipher = xchacha20poly1305(encryptionKey, nonce);
  const ciphertext = cipher.encrypt(householdKek);

  return {
    encryptedKekShare: toBase64(ciphertext),
    ephemeralPublicKey: toBase64(ephemeral.publicKey),
    nonce: toBase64(nonce),
  };
}

export function unsealEscrowShare(
  share: EscrowShare,
  recipientPrivateKey: Uint8Array
): Uint8Array {
  const ephemeralPublicKey = fromBase64(share.ephemeralPublicKey);
  const nonce = fromBase64(share.nonce);
  const ciphertext = fromBase64(share.encryptedKekShare);

  // 1. Recompute shared secret using recipient private key & ephemeral public key
  const sharedSecret = x25519.getSharedSecret(recipientPrivateKey, ephemeralPublicKey);
  const encryptionKey = deriveEscrowEncryptionKey(sharedSecret);

  // 2. Decrypt Household KEK
  const cipher = xchacha20poly1305(encryptionKey, nonce);
  return cipher.decrypt(ciphertext);
}
