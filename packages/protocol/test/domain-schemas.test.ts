import { describe, it, expect } from 'vitest';
import {
  GroceryCheckoutSchema,
  MealPlanCreateSchema,
  ChoreVerifySchema,
  MedicationTakeSchema,
  VitalsLogCreateSchema,
  MedicalAllergyCreateSchema,
  AndroidPushNotificationSchema,
  UtilityBillCreateSchema,
  BotActionCallbackSchema,
} from '../src';

describe('Domain Protocol Schemas (Phase 5)', () => {
  it('validates grocery checkout schema with account and amount', () => {
    const valid = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      accountId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      category: 'Groceries',
      totalAmountCents: 4520,
      notes: 'Weekly supermarket restock',
    };
    const parsed = GroceryCheckoutSchema.parse(valid);
    expect(parsed.totalAmountCents).toBe(4520);
    expect(parsed.accountId).toBe(valid.accountId);

    expect(() => GroceryCheckoutSchema.parse({ ...valid, totalAmountCents: -50 })).toThrow();
  });

  it('validates meal plan schema', () => {
    const valid = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      plannedDate: '2026-11-20',
      mealType: 'dinner',
      recipeTitle: 'Peanut Butter Sesame Noodles',
      notes: 'Contains crushed peanuts and soy sauce',
    };
    const parsed = MealPlanCreateSchema.parse(valid);
    expect(parsed.recipeTitle).toBe('Peanut Butter Sesame Noodles');
  });

  it('validates chore verification schema', () => {
    const parsed = ChoreVerifySchema.parse({ verified: true });
    expect(parsed.verified).toBe(true);
  });

  it('validates medication take schema', () => {
    const parsed = MedicationTakeSchema.parse({
      takenAt: '2026-11-19T08:05:00.000Z',
      photoProofUrl: 'https://minio.local/proofs/dose-1.jpg',
    });
    expect(parsed.photoProofUrl).toBeDefined();
  });

  it('validates vitals log creation schema', () => {
    const valid = {
      memberId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      vitalType: 'blood_pressure',
      valuePrimary: 120,
      valueSecondary: 80,
      unit: 'mmHg',
      notes: 'Morning measurement before medication',
    };
    const parsed = VitalsLogCreateSchema.parse(valid);
    expect(parsed.valuePrimary).toBe(120);
    expect(parsed.valueSecondary).toBe(80);
  });

  it('validates medical allergy schema', () => {
    const valid = {
      memberId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      allergen: 'Peanuts',
      severity: 'critical',
      reactionDescription: 'Anaphylaxis risk requiring EpiPen',
    };
    const parsed = MedicalAllergyCreateSchema.parse(valid);
    expect(parsed.severity).toBe('critical');
  });

  it('validates android companion push payload', () => {
    const valid = {
      packageName: 'com.chase.sig.android',
      rawText: 'Chase: You spent $42.50 at Trader Joe\'s',
      timestamp: 1763568000000,
    };
    const parsed = AndroidPushNotificationSchema.parse(valid);
    expect(parsed.packageName).toBe('com.chase.sig.android');
  });

  it('validates utility bill creation schema', () => {
    const valid = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      providerName: 'City Power & Electric',
      billType: 'electricity',
      amountCents: 14500,
      dueDate: '2026-12-05',
    };
    const parsed = UtilityBillCreateSchema.parse(valid);
    expect(parsed.billType).toBe('electricity');
  });

  it('validates bot action callback token schema', () => {
    const valid = {
      token: 't:ab12cd34ef56:taken',
      action: 'taken',
    };
    const parsed = BotActionCallbackSchema.parse(valid);
    expect(parsed.action).toBe('taken');
  });
});
