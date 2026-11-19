import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export interface EscrowShareRecord {
  shareIndex: number;
  encryptedKekShare: string;
  ephemeralPublicKey: string;
  nonce: string;
}

export interface VaultItemRecord {
  id: string;
  householdId: string;
  title: string;
  category: string;
  encryptedPayload: string;
  payloadNonce: string;
  encryptedDek: string;
  dekNonce: string;
  keyVersion: number;
}

export interface BreakGlassRequestRecord {
  id: string;
  householdId: string;
  requestedByMemberId: string;
  status: 'pending_cooldown' | 'approved' | 'vetoed' | 'expired';
  cooldownExpiresAt: string;
  vetoTokenHash: string;
  createdAt: string;
  updatedAt: string;
}

export class VaultBreakGlassService {
  private requests = new Map<string, BreakGlassRequestRecord>();
  private escrowShares = new Map<string, EscrowShareRecord[]>(); // householdId -> shares
  private vaultItems = new Map<string, VaultItemRecord[]>(); // householdId -> items

  seedTestData(
    householdId: string,
    data: { escrowShares: EscrowShareRecord[]; vaultItems: VaultItemRecord[] }
  ): void {
    this.escrowShares.set(householdId, data.escrowShares);
    this.vaultItems.set(householdId, data.vaultItems);
  }

  evaluateStatus(
    request: BreakGlassRequestRecord,
    currentDate: Date = new Date()
  ): 'pending_cooldown' | 'approved' | 'vetoed' | 'expired' {
    if (request.status === 'pending_cooldown') {
      const expiresAt = new Date(request.cooldownExpiresAt).getTime();
      if (expiresAt <= currentDate.getTime()) {
        request.status = 'approved';
        request.updatedAt = currentDate.toISOString();
      }
    }
    return request.status;
  }

  async initiateBreakGlass(
    householdId: string,
    requestedByMemberId: string,
    cooldownHours: number = 48
  ): Promise<{ requestId: string; cooldownExpiresAt: string; vetoToken: string; status: 'pending_cooldown' }> {
    const id = crypto.randomUUID();
    const vetoToken = randomBytes(24).toString('hex');
    const vetoTokenHash = createHash('sha256').update(vetoToken).digest('hex');

    const cooldownExpiresAt = new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const record: BreakGlassRequestRecord = {
      id,
      householdId,
      requestedByMemberId,
      status: 'pending_cooldown',
      cooldownExpiresAt,
      vetoTokenHash,
      createdAt: now,
      updatedAt: now,
    };
    this.requests.set(id, record);

    return {
      requestId: id,
      cooldownExpiresAt,
      vetoToken,
      status: 'pending_cooldown',
    };
  }

  async initiateBreakGlassDirect(
    householdId: string,
    requestedByMemberId: string,
    cooldownMs: number = 0
  ): Promise<string> {
    const id = crypto.randomUUID();
    const vetoToken = randomBytes(24).toString('hex');
    const vetoTokenHash = createHash('sha256').update(vetoToken).digest('hex');

    const cooldownExpiresAt = new Date(Date.now() + cooldownMs).toISOString();
    const now = new Date().toISOString();

    const record: BreakGlassRequestRecord = {
      id,
      householdId,
      requestedByMemberId,
      status: 'pending_cooldown',
      cooldownExpiresAt,
      vetoTokenHash,
      createdAt: now,
      updatedAt: now,
    };
    this.requests.set(id, record);
    return id;
  }

  async vetoBreakGlass(
    requestId: string,
    vetoToken: string,
    currentDate: Date = new Date()
  ): Promise<{ status: 'vetoed' } | null> {
    const request = this.requests.get(requestId);
    if (!request) {
      return null;
    }

    // Lazily evaluate status first: if cooldown expired, it cannot be vetoed!
    const currentStatus = this.evaluateStatus(request, currentDate);
    if (currentStatus !== 'pending_cooldown') {
      return null;
    }

    const inputHash = createHash('sha256').update(vetoToken).digest('hex');
    const inputBuffer = Buffer.from(inputHash, 'hex');
    const expectedBuffer = Buffer.from(request.vetoTokenHash, 'hex');

    if (inputBuffer.length !== expectedBuffer.length || !timingSafeEqual(inputBuffer, expectedBuffer)) {
      return null;
    }

    request.status = 'vetoed';
    request.updatedAt = new Date().toISOString();
    return { status: 'vetoed' };
  }

  async getStatus(
    requestId: string,
    currentDate: Date = new Date()
  ): Promise<{ requestId: string; status: string; cooldownExpiresAt: string } | null> {
    const request = this.requests.get(requestId);
    if (!request) return null;

    const status = this.evaluateStatus(request, currentDate);

    return {
      requestId: request.id,
      status,
      cooldownExpiresAt: request.cooldownExpiresAt,
    };
  }

  async getEscrowShares(
    requestId: string,
    memberId: string,
    currentDate: Date = new Date()
  ): Promise<EscrowShareRecord[] | null> {
    const request = this.requests.get(requestId);
    if (!request) return null;

    const status = this.evaluateStatus(request, currentDate);
    if (status !== 'approved' || request.requestedByMemberId !== memberId) {
      return null;
    }
    return this.escrowShares.get(request.householdId) || [];
  }

  async getEmergencyVaultItems(
    requestId: string,
    memberId: string,
    currentDate: Date = new Date()
  ): Promise<VaultItemRecord[] | null> {
    const request = this.requests.get(requestId);
    if (!request) return null;

    const status = this.evaluateStatus(request, currentDate);
    if (status !== 'approved' || request.requestedByMemberId !== memberId) {
      return null;
    }
    return this.vaultItems.get(request.householdId) || [];
  }
}
