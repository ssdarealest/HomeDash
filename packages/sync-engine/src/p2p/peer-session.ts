import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { PeerHandshakeRequest, PeerHandshakeResponse } from '@homedash/protocol';

export class PeerSessionCoordinator {
  createHandshakeRequest(
    householdId: string,
    peerId: string,
    householdKey: string
  ): PeerHandshakeRequest {
    const nonce = randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();
    const payload = `${householdId}:${peerId}:${nonce}:${timestamp}`;
    const signature = createHmac('sha256', householdKey).update(payload).digest('hex');

    return {
      householdId,
      peerId,
      nonce,
      signature,
      timestamp,
    };
  }

  verifyHandshakeRequest(
    req: PeerHandshakeRequest,
    expectedHouseholdId: string,
    householdKey: string,
    nowMs: number = Date.now()
  ): { valid: boolean; reason?: string } {
    if (req.householdId !== expectedHouseholdId) {
      return { valid: false, reason: 'Household mismatch' };
    }

    const payload = `${req.householdId}:${req.peerId}:${req.nonce}:${req.timestamp}`;
    const expectedSig = createHmac('sha256', householdKey).update(payload).digest('hex');

    const sigBuf = Buffer.from(req.signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: 'Invalid signature' };
    }

    const reqTime = new Date(req.timestamp).getTime();
    if (Math.abs(nowMs - reqTime) > 5 * 60 * 1000) {
      return { valid: false, reason: 'Timestamp skew exceeded' };
    }

    return { valid: true };
  }

  createHandshakeResponse(
    req: PeerHandshakeRequest,
    householdKey: string
  ): PeerHandshakeResponse {
    const sessionNonce = randomBytes(16).toString('hex');
    const payload = `${req.nonce}:${sessionNonce}`;
    const sessionSignature = createHmac('sha256', householdKey).update(payload).digest('hex');

    return {
      accepted: true,
      sessionNonce,
      sessionSignature,
    };
  }

  verifyHandshakeResponse(
    req: PeerHandshakeRequest,
    res: PeerHandshakeResponse,
    householdKey: string
  ): boolean {
    if (!res.accepted) return false;

    const payload = `${req.nonce}:${res.sessionNonce}`;
    const expectedSig = createHmac('sha256', householdKey).update(payload).digest('hex');

    const sigBuf = Buffer.from(res.sessionSignature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  }

  deriveSessionKey(reqNonce: string, resNonce: string, householdKey: string): string {
    const payload = `session:${reqNonce}:${resNonce}`;
    return createHmac('sha256', householdKey).update(payload).digest('hex');
  }
}
