import { xchacha20poly1305 } from '@noble/ciphers/chacha';

export interface SealedItem {
  encryptedPayload: string;
  payloadNonce: string;
  encryptedDek: string;
  dekNonce: string;
}

export function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function sealVaultItem(payload: Uint8Array, householdKek: Uint8Array): SealedItem {
  // 1. Generate random 32-byte DEK and 24-byte payload nonce
  const dek = crypto.getRandomValues(new Uint8Array(32));
  const payloadNonce = crypto.getRandomValues(new Uint8Array(24));

  // 2. Encrypt cleartext payload with DEK using XChaCha20-Poly1305
  const payloadCipher = xchacha20poly1305(dek, payloadNonce);
  const encryptedPayloadBytes = payloadCipher.encrypt(payload);

  // 3. Generate random 24-byte DEK wrap nonce
  const dekNonce = crypto.getRandomValues(new Uint8Array(24));

  // 4. Wrap DEK with Household KEK using XChaCha20-Poly1305
  const dekCipher = xchacha20poly1305(householdKek, dekNonce);
  const encryptedDekBytes = dekCipher.encrypt(dek);

  return {
    encryptedPayload: toBase64(encryptedPayloadBytes),
    payloadNonce: toBase64(payloadNonce),
    encryptedDek: toBase64(encryptedDekBytes),
    dekNonce: toBase64(dekNonce),
  };
}

export function unsealVaultItem(sealed: SealedItem, householdKek: Uint8Array): Uint8Array {
  // 1. Unseal DEK with Household KEK
  const dekNonce = fromBase64(sealed.dekNonce);
  const encryptedDek = fromBase64(sealed.encryptedDek);

  const dekCipher = xchacha20poly1305(householdKek, dekNonce);
  const dek = dekCipher.decrypt(encryptedDek);

  // 2. Decrypt payload with unsealed DEK
  const payloadNonce = fromBase64(sealed.payloadNonce);
  const encryptedPayload = fromBase64(sealed.encryptedPayload);

  const payloadCipher = xchacha20poly1305(dek, payloadNonce);
  return payloadCipher.decrypt(encryptedPayload);
}
