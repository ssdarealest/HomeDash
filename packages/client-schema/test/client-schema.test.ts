import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { CLIENT_SCHEMA_SQL } from '../src/index';

describe('Local SQLite Client Schema', () => {
  it('should execute schema SQL and create all local tables in SQLite', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(CLIENT_SCHEMA_SQL);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((r: any) => r.name);

    expect(tables).toContain('local_medication_logs');
    expect(tables).toContain('local_grocery_items');
    expect(tables).toContain('local_vitals_logs');
    expect(tables).toContain('local_finance_transactions');
    expect(tables).toContain('local_vault_items');
    expect(tables).toContain('local_asset_renewals');

    db.close();
  });

  it('should have sync columns (sync_state, hlc_timestamp, is_deleted) on local tables', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(CLIENT_SCHEMA_SQL);

    const columns = db.prepare("PRAGMA table_info('local_grocery_items')").all() as any[];
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain('id');
    expect(colNames).toContain('household_id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('sync_state');
    expect(colNames).toContain('hlc_timestamp');
    expect(colNames).toContain('is_deleted');

    db.close();
  });
});
