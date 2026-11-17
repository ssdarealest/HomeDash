import { argon2id } from '@noble/hashes/argon2';

export interface Argon2Options {
  memory?: number;
  iterations?: number;
  parallelism?: number;
}

export async function derivePersonalKek(
  passphrase: string,
  salt: Uint8Array,
  opts?: Argon2Options
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(passphrase);
  // Default Argon2id parameters: 64MB memory (64 * 1024 KiB), 3 iterations, 4 parallelism, 32 bytes output
  return argon2id(passwordBytes, salt, {
    t: opts?.iterations ?? 3,
    m: opts?.memory ?? 64 * 1024,
    p: opts?.parallelism ?? 4,
    dkLen: 32,
  });
}
