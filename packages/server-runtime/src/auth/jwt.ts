import { sign, verify } from 'hono/jwt';
import type { UserRole } from '@homedash/protocol';

export interface SessionPayload {
  userId: string;
  householdId: string;
  role: UserRole;
  isTemporaryCaregiver?: boolean;
  exp?: number;
  iat?: number;
}

export function parseDurationToSeconds(duration: string | number): number {
  if (typeof duration === 'number') return duration;
  const match = duration.match(/^(-?\d+)\s*(s|m|h|d)?$/);
  if (!match) return 3600; // default 1 hour
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return val;
    case 'm':
      return val * 60;
    case 'h':
      return val * 3600;
    case 'd':
      return val * 86400;
    default:
      return val;
  }
}

export async function signSessionJwt(
  payload: Omit<SessionPayload, 'exp' | 'iat'>,
  secret: string,
  expiresIn: string | number = '7d'
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const seconds = parseDurationToSeconds(expiresIn);
  const jwtPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + seconds,
  };

  return sign(jwtPayload as any, secret, 'HS256');
}

export async function verifySessionJwt(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    const payload = (await verify(token, secret, 'HS256')) as unknown as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const signSessionToken = signSessionJwt;
export const verifySessionToken = verifySessionJwt;

