import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Drift SQLite Schema Parity with packages/client-schema', () => {
  it('should define canonical local_ tables matching client-schema.sql', () => {
    const tablesPath = path.resolve(__dirname, '../lib/data/database/tables.dart');
    expect(fs.existsSync(tablesPath)).toBe(true);
    const content = fs.readFileSync(tablesPath, 'utf8');
    const canonicalTables = [
      'LocalChores',
      'LocalMedications',
      'LocalMedicationLogs',
      'LocalCaregiverShifts',
      'LocalVitalsLogs',
      'LocalMedicalAllergies',
      'LocalFinanceAccounts',
      'LocalFinanceTransactions',
      'LocalVaultItems',
      'LocalGroceryItems',
      'OutboxMutations',
    ];
    for (const table of canonicalTables) {
      expect(content).toContain(`class ${table} extends Table`);
    }
  });

  it('should include correct envelope fields in LocalVaultItems table', () => {
    const tablesPath = path.resolve(__dirname, '../lib/data/database/tables.dart');
    expect(fs.existsSync(tablesPath)).toBe(true);
    const content = fs.readFileSync(tablesPath, 'utf8');
    expect(content).toContain('payloadCiphertext');
    expect(content).toContain('payloadNonce');
    expect(content).toContain('encryptedDek');
    expect(content).toContain('dekNonce');
    expect(content).toContain('kekSalt');
  });

  it('should implement OutboxDao with pending mutation queries', () => {
    const outboxDaoPath = path.resolve(__dirname, '../lib/data/database/daos/outbox_dao.dart');
    expect(fs.existsSync(outboxDaoPath)).toBe(true);
    const content = fs.readFileSync(outboxDaoPath, 'utf8');
    expect(content).toContain('watchPendingMutations');
    expect(content).toContain('markSynced');
  });

  it('should implement AppDatabase with all table definitions', () => {
    const dbPath = path.resolve(__dirname, '../lib/data/database/app_database.dart');
    expect(fs.existsSync(dbPath)).toBe(true);
    const content = fs.readFileSync(dbPath, 'utf8');
    expect(content).toContain('class AppDatabase');
  });
});
