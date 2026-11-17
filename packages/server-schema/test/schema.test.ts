import { describe, it, expect } from 'vitest';
import * as schema from '../src/index';

describe('PostgreSQL Drizzle Server Schema', () => {
  it('should export all core multi-tenant tables', () => {
    expect(schema.households).toBeDefined();
    expect(schema.householdModules).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.householdMembers).toBeDefined();
    expect(schema.auditLogs).toBeDefined();
    expect(schema.syncChanges).toBeDefined();
  });

  it('should export Module A Finance tables with householdId and deletedAt', () => {
    expect(schema.financeAccounts).toBeDefined();
    expect(schema.financeAccounts.householdId).toBeDefined();
    expect(schema.financeAccounts.deletedAt).toBeDefined();

    expect(schema.financeTransactions).toBeDefined();
    expect(schema.financeTransactions.householdId).toBeDefined();

    expect(schema.utilityBills).toBeDefined();
    expect(schema.utilityBills.householdId).toBeDefined();
  });

  it('should export Module B Health tables with proper escalation & log structures', () => {
    expect(schema.medications).toBeDefined();
    expect(schema.medications.remainingPills).toBeDefined();
    expect(schema.medicationLogs).toBeDefined();
    expect(schema.caregiverShifts).toBeDefined();
    expect(schema.vitalsLogs).toBeDefined();
    expect(schema.medicalAllergies).toBeDefined();
  });

  it('should export Module C Zero-Knowledge Vault and Break-Glass tables', () => {
    expect(schema.vaultItems).toBeDefined();
    expect(schema.vaultItems.encryptedDek).toBeDefined();
    expect(schema.vaultItems.encryptedPayload).toBeDefined();

    expect(schema.householdVaultKeys).toBeDefined();
    expect(schema.vaultEscrowShares).toBeDefined();
    expect(schema.vaultEscrowShares.encryptedKekShare).toBeDefined();

    expect(schema.breakGlassRequests).toBeDefined();
    expect(schema.breakGlassRequests.cooldownExpiresAt).toBeDefined();
  });

  it('should export Module D Daily Operations tables', () => {
    expect(schema.groceryItems).toBeDefined();
    expect(schema.groceryItems.aisleCategory).toBeDefined();
    expect(schema.mealPlans).toBeDefined();
    expect(schema.chores).toBeDefined();
  });
});
