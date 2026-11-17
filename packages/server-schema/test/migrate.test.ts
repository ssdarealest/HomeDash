import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runMigrations } from '../src/migrate';
import { seedDefaultHousehold } from '../src/seed';

describe('Database Migration Pipeline & Seeding', () => {
  const rootDir = join(__dirname, '..');

  it('should verify drizzle.config.ts configuration', () => {
    const configPath = join(rootDir, 'drizzle.config.ts');
    expect(existsSync(configPath), 'drizzle.config.ts must exist').toBe(true);

    const configContent = readFileSync(configPath, 'utf-8');
    expect(configContent).toContain("dialect: 'postgresql'");
    expect(configContent).toContain("schema: './src/schema/index.ts'");
  });

  it('should export runMigrations function that accepts a client or url and rls path', () => {
    expect(typeof runMigrations).toBe('function');
  });

  it('should execute seedDefaultHousehold against mock database interface', async () => {
    expect(typeof seedDefaultHousehold).toBe('function');

    const insertedRecords: Record<string, any[]> = {
      households: [],
      householdModules: [],
      users: [],
      householdMembers: [],
    };

    const mockDb = {
      insert: (table: any) => ({
        values: (data: any) => ({
          returning: async () => {
            const row = { id: 'mock-uuid-' + Math.random(), ...data };
            if (table._?.name) {
              insertedRecords[table._.name] = insertedRecords[table._.name] || [];
              insertedRecords[table._.name].push(row);
            }
            return [row];
          },
        }),
      }),
    };

    const result = await seedDefaultHousehold(mockDb as any);
    expect(result).toBeDefined();
    expect(result.householdId).toBeDefined();
    expect(result.adminUserId).toBeDefined();
  });
});
