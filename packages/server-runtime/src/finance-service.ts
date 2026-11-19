import {
  FinanceAccountCreate,
  FinanceTransactionCreate,
  UtilityBillCreate,
} from '@homedash/protocol';

export interface FinanceAccountRecord {
  id: string;
  householdId: string;
  name: string;
  accountType: 'shared_checking' | 'personal_allowance' | 'sinking_fund';
  balanceCents: number;
  currency: string;
  ownerMemberId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransactionRecord {
  id: string;
  householdId: string;
  accountId: string;
  amountCents: number;
  transactionType: 'income' | 'expense' | 'transfer';
  category: string;
  description?: string;
  source: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UtilityBillRecord {
  id: string;
  householdId: string;
  providerName: string;
  billType: string;
  amountCents: number;
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceServiceOptions {
  getHouseholdCompanionSecret?: (householdId: string) => Promise<string | null>;
}

export class FinanceService {
  private accounts = new Map<string, FinanceAccountRecord>();
  private transactions = new Map<string, FinanceTransactionRecord>();
  private bills = new Map<string, UtilityBillRecord>();
  private options: FinanceServiceOptions;

  constructor(opts?: FinanceServiceOptions) {
    this.options = opts || {};
  }

  async getCompanionSecret(householdId: string): Promise<string | null> {
    if (this.options.getHouseholdCompanionSecret) {
      return this.options.getHouseholdCompanionSecret(householdId);
    }
    return null;
  }

  // --- Accounts ---
  async getAccounts(householdId: string): Promise<FinanceAccountRecord[]> {
    return Array.from(this.accounts.values()).filter(
      (a) => a.householdId === householdId
    );
  }

  async getAccount(id: string): Promise<FinanceAccountRecord | null> {
    return this.accounts.get(id) || null;
  }

  async createAccount(input: FinanceAccountCreate): Promise<FinanceAccountRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: FinanceAccountRecord = {
      id,
      householdId: input.householdId,
      name: input.name,
      accountType: input.accountType || 'shared_checking',
      balanceCents: 0,
      currency: input.currency || 'USD',
      ownerMemberId: input.ownerMemberId,
      createdAt: now,
      updatedAt: now,
    };
    this.accounts.set(id, record);
    return record;
  }

  // --- Transactions ---
  async getTransactions(
    householdId: string,
    accountId?: string
  ): Promise<FinanceTransactionRecord[]> {
    return Array.from(this.transactions.values()).filter(
      (t) => t.householdId === householdId && (!accountId || t.accountId === accountId)
    );
  }

  async createTransaction(
    input: FinanceTransactionCreate
  ): Promise<FinanceTransactionRecord> {
    const account = this.accounts.get(input.accountId);
    if (!account) {
      throw new Error(`Account not found: ${input.accountId}`);
    }

    if (account.householdId !== input.householdId) {
      throw new Error(`Account ${input.accountId} does not belong to household ${input.householdId}`);
    }

    if (input.transactionType === 'expense') {
      account.balanceCents -= input.amountCents;
    } else if (input.transactionType === 'income') {
      account.balanceCents += input.amountCents;
    }
    account.updatedAt = new Date().toISOString();

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: FinanceTransactionRecord = {
      id,
      householdId: input.householdId,
      accountId: input.accountId,
      amountCents: input.amountCents,
      transactionType: input.transactionType,
      category: input.category,
      description: input.description,
      source: input.source || 'manual',
      transactionDate: input.transactionDate || now.split('T')[0],
      createdAt: now,
      updatedAt: now,
    };
    this.transactions.set(id, record);
    return record;
  }

  // --- Sinking Funds ---
  async getSinkingFundsSummary(householdId: string): Promise<{
    totalSavedCents: number;
    funds: FinanceAccountRecord[];
  }> {
    const funds = Array.from(this.accounts.values()).filter(
      (a) => a.householdId === householdId && a.accountType === 'sinking_fund'
    );
    const totalSavedCents = funds.reduce((acc, f) => acc + f.balanceCents, 0);
    return {
      totalSavedCents,
      funds,
    };
  }

  // --- Utility Bills & Spike Detection ---
  async getUtilityBills(
    householdId: string,
    billType?: string
  ): Promise<UtilityBillRecord[]> {
    return Array.from(this.bills.values()).filter(
      (b) => b.householdId === householdId && (!billType || b.billType === billType)
    );
  }

  async createUtilityBill(input: UtilityBillCreate): Promise<{
    bill: UtilityBillRecord;
    isSpike: boolean;
    percentageIncrease?: number;
    historicalAverageCents?: number;
  }> {
    // Calculate historical average for bills of same billType and provider
    const existing = Array.from(this.bills.values()).filter(
      (b) =>
        b.householdId === input.householdId &&
        b.billType === input.billType &&
        b.providerName.toLowerCase() === input.providerName.toLowerCase()
    );

    let isSpike = false;
    let percentageIncrease: number | undefined;
    let historicalAverageCents: number | undefined;

    if (existing.length > 0) {
      const sum = existing.reduce((acc, b) => acc + b.amountCents, 0);
      const avg = sum / existing.length;
      historicalAverageCents = Math.round(avg);

      if (input.amountCents > 1.25 * avg) {
        isSpike = true;
        percentageIncrease = Math.round(((input.amountCents - avg) / avg) * 100);
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const bill: UtilityBillRecord = {
      id,
      householdId: input.householdId,
      providerName: input.providerName,
      billType: input.billType,
      amountCents: input.amountCents,
      dueDate: input.dueDate,
      billingPeriodStart: input.billingPeriodStart,
      billingPeriodEnd: input.billingPeriodEnd,
      status: 'detected',
      createdAt: now,
      updatedAt: now,
    };
    this.bills.set(id, bill);

    return {
      bill,
      isSpike,
      percentageIncrease,
      historicalAverageCents,
    };
  }
}
