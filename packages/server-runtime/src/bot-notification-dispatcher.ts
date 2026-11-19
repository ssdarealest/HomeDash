import { randomBytes } from 'node:crypto';

export interface ActionTokenData {
  householdId: string;
  medicationId: string;
  memberId: string;
  scheduledAt: string;
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
    const id = randomBytes(6).toString('hex'); // 12-char hex string
    const data: ActionTokenData = {
      householdId,
      medicationId,
      memberId,
      scheduledAt,
    };
    this.tokenRegistry.set(id, data);

    return {
      takenToken: `t:${id}:taken`,
      snoozeToken: `t:${id}:snooze`,
    };
  }

  resolveToken(token: string): ResolvedAction | null {
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
