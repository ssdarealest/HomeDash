import { randomBytes } from 'node:crypto';

export interface ActionTokenData {
  householdId: string;
  medicationId: string;
  memberId: string;
  scheduledAt: string;
  createdAt: number;
}

export interface ResolvedAction {
  action: 'taken' | 'snooze';
  data: ActionTokenData;
}

export class BotNotificationDispatcher {
  private tokenRegistry = new Map<string, ActionTokenData>();

  createActionTokens(
    householdId: string,
    medicationId: string,
    memberId: string,
    scheduledAt: string
  ): { takenToken: string; snoozeToken: string } {
    // 8 bytes (16 hex chars) - high entropy while comfortably fitting in Telegram 64-byte callback_data
    const takenId = randomBytes(8).toString('hex');
    const snoozeId = randomBytes(8).toString('hex');
    const now = Date.now();
    const data: ActionTokenData = {
      householdId,
      medicationId,
      memberId,
      scheduledAt,
      createdAt: now,
    };
    this.tokenRegistry.set(takenId, data);
    this.tokenRegistry.set(snoozeId, data);

    // Prune stale tokens older than 24h if registry exceeds 5000 items
    if (this.tokenRegistry.size > 5000) {
      const cutoff = now - 24 * 60 * 60 * 1000;
      for (const [key, val] of this.tokenRegistry.entries()) {
        if (val.createdAt < cutoff) {
          this.tokenRegistry.delete(key);
        }
      }
    }

    return {
      takenToken: `t:${takenId}:taken`,
      snoozeToken: `t:${snoozeId}:snooze`,
    };
  }

  resolveToken(token: string, consume: boolean = true): ResolvedAction | null {
    const parts = token.split(':');
    if (parts.length !== 3 || parts[0] !== 't') {
      return null;
    }

    const [, id, action] = parts;
    if (action !== 'taken' && action !== 'snooze') {
      return null;
    }

    const data = this.tokenRegistry.get(id);
    if (!data) return null;

    // Check token expiry (24 hours)
    if (Date.now() - data.createdAt > 24 * 60 * 60 * 1000) {
      this.tokenRegistry.delete(id);
      return null;
    }

    // Single-use token: consume upon successful resolution to prevent replay attacks
    if (consume) {
      this.tokenRegistry.delete(id);
    }

    return {
      action,
      data,
    };
  }

  formatMedicationReminder(
    medicationName: string,
    dosage: string,
    patientName: string,
    tokens: { takenToken: string; snoozeToken: string }
  ): { text: string; inlineKeyboard: Array<Array<{ text: string; callback_data: string }>> } {
    return {
      text: `Reminder: Time for ${patientName}'s ${medicationName} (${dosage}).`,
      inlineKeyboard: [
        [
          { text: 'Taken', callback_data: tokens.takenToken },
          { text: 'Snooze 15m', callback_data: tokens.snoozeToken },
        ],
      ],
    };
  }
}
