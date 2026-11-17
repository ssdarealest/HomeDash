export interface CaregiverTokenOptions {
  householdId: string;
  patientMemberId: string;
  caregiverName: string;
  ttlHours?: number;
}

export interface CaregiverTokenClaims {
  householdId: string;
  patientMemberId: string;
  caregiverName: string;
  role: 'caregiver_guest';
  expiresAt: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

async function computeHmacSha256(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Buffer.from(sig)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function generateCaregiverMagicToken(
  opts: CaregiverTokenOptions,
  secret: string
): Promise<string> {
  const ttl = opts.ttlHours ?? 8;
  const expiresAt = Date.now() + ttl * 3600 * 1000;

  const header = { alg: 'HS256', typ: 'CAREGIVER_MAGIC' };
  const payload: CaregiverTokenClaims = {
    householdId: opts.householdId,
    patientMemberId: opts.patientMemberId,
    caregiverName: opts.caregiverName,
    role: 'caregiver_guest',
    expiresAt,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await computeHmacSha256(dataToSign, secret);

  return `${dataToSign}.${signature}`;
}

export async function verifyCaregiverMagicToken(
  token: string,
  secret: string
): Promise<CaregiverTokenClaims | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = await computeHmacSha256(dataToSign, secret);

    if (signature !== expectedSig) {
      return null;
    }

    const payload: CaregiverTokenClaims = JSON.parse(base64UrlDecode(encodedPayload));
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
