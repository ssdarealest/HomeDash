import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  GroceryItemCreateSchema,
  GroceryItemCheckSchema,
  GroceryCheckoutSchema,
  MealPlanCreateSchema,
  ChoreToggleSchema,
  ChoreVerifySchema,
} from '@homedash/protocol';
import {
  authMiddleware,
  requireRole,
  DailyOpsService,
} from '@homedash/server-runtime';
import { z } from 'zod';

export interface DailyOpsRouterOptions {
  dailyOpsService: DailyOpsService;
  jwtSecret: string;
}

const ChoreCreateInputSchema = z.object({
  householdId: z.string().uuid(),
  title: z.string().min(1).max(120),
  assignedMemberId: z.string().uuid().optional(),
  recurrenceRule: z.string().optional(),
  rewardPoints: z.number().int().nonnegative().optional(),
  allowanceCents: z.number().int().nonnegative().optional(),
});

export function createDailyOpsRouter(opts: DailyOpsRouterOptions) {
  const router = new Hono();
  const { dailyOpsService, jwtSecret } = opts;

  router.use('*', authMiddleware(jwtSecret));

  // --- Grocery ---
  router.get('/grocery', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const items = await dailyOpsService.getGroceryItems(householdId);
    return c.json(items);
  });

  router.post(
    '/grocery',
    zValidator('json', GroceryItemCreateSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const data = c.req.valid('json');
      const item = await dailyOpsService.createGroceryItem(data);
      return c.json(item, 201);
    }
  );

  router.patch(
    '/grocery/:id/check',
    zValidator('json', GroceryItemCheckSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const id = c.req.param('id');
      const { isChecked, checkedByMemberId } = c.req.valid('json');
      const item = await dailyOpsService.checkGroceryItem(id, isChecked, checkedByMemberId);
      if (!item) return c.json({ error: 'Item not found' }, 404);
      return c.json(item);
    }
  );

  router.post(
    '/grocery/checkout',
    zValidator('json', GroceryCheckoutSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const data = c.req.valid('json');
      const result = await dailyOpsService.checkoutGroceryList(data);
      return c.json(result);
    }
  );

  // --- Meal Plans ---
  router.get('/meal-plans', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const plans = await dailyOpsService.getMealPlans(householdId);
    return c.json(plans);
  });

  router.post(
    '/meal-plans',
    zValidator('json', MealPlanCreateSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const data = c.req.valid('json');
      const result = await dailyOpsService.createMealPlan(data);
      return c.json(result, 201);
    }
  );

  // --- Chores ---
  router.get('/chores', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const chores = await dailyOpsService.getChores(householdId);
    return c.json(chores);
  });

  router.post(
    '/chores',
    zValidator('json', ChoreCreateInputSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const data = c.req.valid('json');
      const chore = await dailyOpsService.createChore(data);
      return c.json(chore, 201);
    }
  );

  router.patch(
    '/chores/:id/toggle',
    zValidator('json', ChoreToggleSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const id = c.req.param('id');
      const { isCompleted } = c.req.valid('json');
      const chore = await dailyOpsService.toggleChore(id, isCompleted);
      if (!chore) return c.json({ error: 'Chore not found' }, 404);
      return c.json(chore);
    }
  );

  router.post(
    '/chores/:id/verify',
    requireRole(['admin']),
    zValidator('json', ChoreVerifySchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const id = c.req.param('id');
      const { verified } = c.req.valid('json');
      const res = await dailyOpsService.verifyChore(id, verified);
      if (!res) return c.json({ error: 'Chore not found' }, 404);
      return c.json(res);
    }
  );

  router.get('/chores/points/:memberId', async (c) => {
    const memberId = c.req.param('memberId');
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const totalPoints = await dailyOpsService.getMemberPoints(householdId, memberId);
    return c.json({ memberId, totalPoints });
  });

  return router;
}
