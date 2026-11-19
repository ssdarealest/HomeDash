import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { AndroidPushNotification } from '@homedash/protocol';
import { FinanceService, FinanceTransactionRecord } from './finance-service';

export interface AndroidIngestResult {
  status: 'ingested' | 'duplicate_ignored' | 'rejected';
  transaction?: FinanceTransactionRecord;
  error?: string;
}

export class AndroidIngestService {
  private financeService: FinanceService;
  private processedHashes = new Set<string>();

  constructor(financeService: FinanceService) {
    this.financeService = financeService;
  }

  verifySignature(signatureHex: string, rawBody: string, secret: string): boolean {
    try {
      const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex');
      const sigBuffer = Buffer.from(signatureHex, 'hex');
      const expectedBuffer = Buffer.from(expectedHex, 'hex');

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  parseNotificationText(rawText: string): {
    amountCents: number;
    merchant: string;
    transactionType: 'income' | 'expense';
  } {
    // 1. "You spent $42.50 at Trader Joe's"
    const spentMatch = rawText.match(/spent\s+\$?([0-9,]+(?:\.[0-9]{2})?)\s+at\s+([^.,\n]+)/i);
    if (spentMatch) {
      const rawAmount = spentMatch[1].replace(/,/g, '');
      const amountCents = Math.round(parseFloat(rawAmount) * 100);
      const merchant = spentMatch[2].trim();
      return { amountCents, merchant, transactionType: 'expense' };
    }

    // 2. "Payment of $15.00 to John"
    const paymentMatch = rawText.match(/payment\s+of\s+\$?([0-9,]+(?:\.[0-9]{2})?)(?:\s+to\s+([^.,\n]+))?/i);
    if (paymentMatch) {
      const rawAmount = paymentMatch[1].replace(/,/g, '');
      const amountCents = Math.round(parseFloat(rawAmount) * 100);
      const merchant = paymentMatch[2]?.trim() || 'Payment';
      return { amountCents, merchant, transactionType: 'expense' };
    }

    // 3. "Received $50.00 from Jane" or "Deposit of $50.00"
    const depositMatch = rawText.match(/(?:received|deposit\s+of)\s+\$?([0-9,]+(?:\.[0-9]{2})?)(?:\s+from\s+([^.,\n]+))?/i);
    if (depositMatch) {
      const rawAmount = depositMatch[1].replace(/,/g, '');
      const amountCents = Math.round(parseFloat(rawAmount) * 100);
      const merchant = depositMatch[2]?.trim() || 'Deposit';
      return { amountCents, merchant, transactionType: 'income' };
    }

    // 4. Fallback: match any dollar amount
    const fallbackMatch = rawText.match(/\$?([0-9,]+(?:\.[0-9]{2})?)/);
    if (fallbackMatch) {
      const rawAmount = fallbackMatch[1].replace(/,/g, '');
      const amountCents = Math.round(parseFloat(rawAmount) * 100);
      return { amountCents, merchant: 'Card Purchase', transactionType: 'expense' };
    }

    return { amountCents: 0, merchant: 'Unknown Transaction', transactionType: 'expense' };
  }

  async ingestNotification(
    householdId: string,
    payload: AndroidPushNotification,
    rawBody: string,
    signatureHex: string
  ): Promise<AndroidIngestResult> {
    const secret = await this.financeService.getCompanionSecret(householdId);
    if (!secret || !this.verifySignature(signatureHex, rawBody, secret)) {
      return { status: 'rejected', error: 'Invalid companion signature' };
    }

    // Idempotency check: hash(packageName + rawText + timestamp)
    const idempotencyHash = createHash('sha256')
      .update(`${payload.packageName}:${payload.rawText}:${payload.timestamp}`)
      .digest('hex');

    if (this.processedHashes.has(idempotencyHash)) {
      return { status: 'duplicate_ignored' };
    }
    this.processedHashes.add(idempotencyHash);

    // Resolve target account
    let targetAccountId = payload.accountId;
    if (!targetAccountId) {
      const accounts = await this.financeService.getAccounts(householdId);
      const checking = accounts.find((a) => a.accountType === 'shared_checking') || accounts[0];
      if (!checking) {
        return { status: 'rejected', error: 'No financial account found for household' };
      }
      targetAccountId = checking.id;
    }

    // Parse notification
    const parsed = this.parseNotificationText(payload.rawText);

    // Create transaction
    const transaction = await this.financeService.createTransaction({
      householdId,
      accountId: targetAccountId,
      amountCents: parsed.amountCents,
      transactionType: parsed.transactionType,
      category: parsed.merchant,
      description: payload.rawText,
      source: 'android_push',
    });

    return {
      status: 'ingested',
      transaction,
    };
  }
}
