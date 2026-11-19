import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  FinanceAccountCreateSchema,
  FinanceTransactionCreateSchema,
  UtilityBillCreateSchema,
} from '@homedash/protocol';
import {
  authMiddleware,
  requireRole,
  FinanceService,
} from '@homedash/server-runtime';

export interface FinanceRouterOptions {
  financeService: FinanceService;
  jwtSecret: string;
}

export function createFinanceRouter(opts: FinanceRouterOptions) {
  const router = new Hono();
  const { financeService, jwtSecret } = opts;

  router.use('*', authMiddleware(jwtSecret));
  // Only household members with role admin, senior, or teen_child can access finance (caregiver guests blocked)
  router.use('*', requireRole(['admin', 'senior', 'teen_child']));

  // Assert session household matches query if provided
  router.use('*', async (c, next) => {
    const session = c.get('session' as any);
    const queryHouseholdId = c.req.query('householdId');
    if (queryHouseholdId && session && queryHouseholdId !== session.householdId) {
      return c.json({ error: 'Forbidden: household mismatch' }, 403);
    }
    await next();
  });

  // --- Accounts ---
  router.get('/accounts', async (c) => {
    const session = c.get('session' as any);
    const householdId = session.householdId;
    const accounts = await financeService.getAccounts(householdId);
    return c.json(accounts);
  });

  router.post(
    '/accounts',
    zValidator('json', FinanceAccountCreateSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const session = c.get('session' as any);
      const data = c.req.valid('json');
      if (data.householdId !== session.householdId) {
        return c.json({ error: 'Forbidden: household mismatch' }, 403);
      }
      const account = await financeService.createAccount(data);
      return c.json(account, 201);
    }
  );

  // --- Transactions ---
  router.get('/transactions', async (c) => {
    const session = c.get('session' as any);
    const householdId = session.householdId;
    const accountId = c.req.query('accountId');
    const transactions = await financeService.getTransactions(householdId, accountId);
    return c.json(transactions);
  });

  router.post(
    '/transactions',
    zValidator('json', FinanceTransactionCreateSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const session = c.get('session' as any);
      const data = c.req.valid('json');
      if (data.householdId !== session.householdId) {
        return c.json({ error: 'Forbidden: household mismatch' }, 403);
      }
      try {
        const transaction = await financeService.createTransaction(data);
        return c.json(transaction, 201);
      } catch (err: any) {
        return c.json({ error: err.message }, 400);
      }
    }
  );

  // --- Sinking Funds ---
  router.get('/sinking-funds', async (c) => {
    const session = c.get('session' as any);
    const householdId = session.householdId;
    const summary = await financeService.getSinkingFundsSummary(householdId);
    return c.json(summary);
  });

  // --- Utility Bills ---
  router.get('/bills', async (c) => {
    const session = c.get('session' as any);
    const householdId = session.householdId;
    const billType = c.req.query('billType');
    const bills = await financeService.getUtilityBills(householdId, billType);
    return c.json(bills);
  });

  router.post(
    '/bills',
    zValidator('json', UtilityBillCreateSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const session = c.get('session' as any);
      const data = c.req.valid('json');
      if (data.householdId !== session.householdId) {
        return c.json({ error: 'Forbidden: household mismatch' }, 403);
      }
      const result = await financeService.createUtilityBill(data);
      return c.json(result, 201);
    }
  );

  return router;
}
