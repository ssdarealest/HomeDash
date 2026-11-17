import { describe, it, expect } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as schema from '../src/index';

describe('PostgreSQL Drizzle Server Schema', () => {
  it('should export all core multi-tenant tables', () => {
    expect(schema.households).toBeDefined();
    expect(schema.householdModules).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.householdMembers).toBeDefined();
    expect(schema.auditLogs).toBeDefined();
    expect(schema.syncChanges).toBeDefined();

    const householdMembersConfig = getTableConfig(schema.householdMembers);
    expect(householdMembersConfig.uniqueConstraints.some((u) => u.name === 'unique_household_user')).toBe(true);
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

  it('should export Module C Zero-Knowledge Vault and Break-Glass tables with unique constraints', () => {
    expect(schema.vaultItems).toBeDefined();
    expect(schema.vaultItems.encryptedDek).toBeDefined();
    expect(schema.vaultItems.encryptedPayload).toBeDefined();

    expect(schema.householdVaultKeys).toBeDefined();
    const vaultKeysConfig = getTableConfig(schema.householdVaultKeys);
    expect(vaultKeysConfig.uniqueConstraints.some((u) => u.name === 'unique_vault_key')).toBe(true);

    expect(schema.vaultEscrowShares).toBeDefined();
    expect(schema.vaultEscrowShares.encryptedKekShare).toBeDefined();
    const escrowSharesConfig = getTableConfig(schema.vaultEscrowShares);
    expect(escrowSharesConfig.uniqueConstraints.some((u) => u.name === 'unique_escrow_share')).toBe(true);

    expect(schema.breakGlassRequests).toBeDefined();
    expect(schema.breakGlassRequests.cooldownExpiresAt).toBeDefined();
  });

  it('should export Module D Daily Operations tables', () => {
    expect(schema.groceryItems).toBeDefined();
    expect(schema.groceryItems.aisleCategory).toBeDefined();
    expect(schema.mealPlans).toBeDefined();
    expect(schema.chores).toBeDefined();
  });

  it('should define RLS policies for every secured table without orphaned tables or deadlocks', () => {
    const rlsSql = readFileSync(join(__dirname, '../src/rls.sql'), 'utf-8');

    // Extract all tables enabled for RLS
    const enabledTables = Array.from(
      rlsSql.matchAll(/ALTER TABLE (\w+) ENABLE ROW LEVEL SECURITY;/g)
    ).map((m) => m[1]);

    expect(enabledTables.length).toBe(22);

    // Verify each table has at least one policy defined
    for (const table of enabledTables) {
      const policyRegex = new RegExp(`CREATE POLICY \\w+ ON ${table}`, 'i');
      expect(policyRegex.test(rlsSql), `Missing RLS policy for table: ${table}`).toBe(true);
    }

    // Verify break_glass_requests has a SELECT policy (preventing escrow deadlock)
    expect(rlsSql).toContain('CREATE POLICY break_glass_select ON break_glass_requests');

    // Verify medication_logs has UPDATE policy
    expect(rlsSql).toContain('CREATE POLICY medication_caregiver_update ON medication_logs');

    // Verify CDC trigger function records tombstone with NULL payload
    expect(rlsSql).toContain('CREATE OR REPLACE FUNCTION fn_record_sync_change()');
    expect(rlsSql).toContain("op := 'DELETE';");
    expect(rlsSql).toContain('payload := NULL;');
  });
});
