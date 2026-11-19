import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import { signSessionJwt } from '@homedash/server-runtime';

describe('Daily Ops Routes & Workflows (Phase 5 Task 2)', () => {
  const jwtSecret = 'test_secret_key_daily_ops_phase5';
  let app: ReturnType<typeof createApp>;
  let adminToken: string;
  let childToken: string;
  const householdId = '11111111-1111-4111-a111-111111111111';
  const childMemberId = '22222222-2222-4222-a222-222222222222';

  beforeEach(async () => {
    app = createApp({ jwtSecret });
    adminToken = await signSessionJwt(
      {
        userId: 'admin-user-id',
        householdId,
        role: 'admin',
      },
      jwtSecret
    );

    childToken = await signSessionJwt(
      {
        userId: 'child-user-id',
        householdId,
        role: 'teen_child',
      },
      jwtSecret
    );
  });

  it('manages grocery list and atomically executes checkout-to-expense', async () => {
    // 1. Add grocery items
    const addItemRes = await app.request('/api/v1/daily-ops/grocery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        name: 'Oat Milk',
        quantity: '2 cartons',
        aisleCategory: 'dairy',
      }),
    });
    expect(addItemRes.status).toBe(201);
    const item = await addItemRes.json();
    expect(item.name).toBe('Oat Milk');
    expect(item.isChecked).toBe(false);

    // 2. Check the item
    const checkRes = await app.request(`/api/v1/daily-ops/grocery/${item.id}/check`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        isChecked: true,
      }),
    });
    expect(checkRes.status).toBe(200);
    const checkedItem = await checkRes.json();
    expect(checkedItem.isChecked).toBe(true);

    // 3. Checkout and log expense
    const accountId = '33333333-3333-4333-a333-333333333333';
    const checkoutRes = await app.request('/api/v1/daily-ops/grocery/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        accountId,
        category: 'Groceries',
        totalAmountCents: 850,
        notes: 'Target grocery run',
      }),
    });
    expect(checkoutRes.status).toBe(200);
    const checkoutResult = await checkoutRes.json();
    expect(checkoutResult.archivedItemCount).toBeGreaterThanOrEqual(1);
    expect(checkoutResult.expenseLogged).toBe(true);
  });

  it('checks meal plans against household medical allergies', async () => {
    const mealRes = await app.request('/api/v1/daily-ops/meal-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        plannedDate: '2026-11-21',
        mealType: 'dinner',
        recipeTitle: 'Spicy Peanut Satay with Noodles',
        notes: 'Includes peanut sauce and crushed peanuts',
      }),
    });
    expect(mealRes.status).toBe(201);
    const mealData = await mealRes.json();
    expect(mealData.mealPlan.recipeTitle).toBe('Spicy Peanut Satay with Noodles');
    expect(Array.isArray(mealData.allergenWarnings)).toBe(true);
  });

  it('handles chore completion, admin verification, and point reward computation', async () => {
    // 1. Create a chore
    const createChoreRes = await app.request('/api/v1/daily-ops/chores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        title: 'Mow the front lawn',
        assignedMemberId: childMemberId,
        rewardPoints: 50,
        allowanceCents: 500,
      }),
    });
    expect(createChoreRes.status).toBe(201);
    const chore = await createChoreRes.json();

    // 2. Child completes chore
    const toggleRes = await app.request(`/api/v1/daily-ops/chores/${chore.id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${childToken}`,
      },
      body: JSON.stringify({ isCompleted: true }),
    });
    expect(toggleRes.status).toBe(200);
    const toggled = await toggleRes.json();
    expect(toggled.isCompleted).toBe(true);
    expect(toggled.verifiedByAdmin).toBe(false);

    // 3. Admin verifies chore
    const verifyRes = await app.request(`/api/v1/daily-ops/chores/${chore.id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ verified: true }),
    });
    expect(verifyRes.status).toBe(200);
    const verified = await verifyRes.json();
    expect(verified.chore.verifiedByAdmin).toBe(true);
    expect(verified.pointsAwarded).toBe(50);

    // 4. Check dynamic reward point balance for child
    const pointsRes = await app.request(`/api/v1/daily-ops/chores/points/${childMemberId}?householdId=${householdId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${childToken}`,
      },
    });
    expect(pointsRes.status).toBe(200);
    const pointsData = await pointsRes.json();
    expect(pointsData.totalPoints).toBe(50);
  });
});
