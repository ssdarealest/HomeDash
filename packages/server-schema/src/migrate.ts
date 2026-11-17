import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

export interface MigrationOptions {
  migrationsFolder?: string;
  rlsSqlPath?: string;
}

export async function runMigrations(
  databaseUrlOrClient: string | ReturnType<typeof postgres>,
  options?: MigrationOptions
): Promise<void> {
  const sql =
    typeof databaseUrlOrClient === 'string'
      ? postgres(databaseUrlOrClient, { max: 1 })
      : databaseUrlOrClient;

  const db = drizzle(sql);

  const migrationsFolder = options?.migrationsFolder || join(__dirname, '../drizzle');
  if (existsSync(migrationsFolder)) {
    await migrate(db, { migrationsFolder });
  }

  // Apply Row-Level Security & CDC trigger policies
  const rlsPath = options?.rlsSqlPath || join(__dirname, 'rls.sql');
  if (existsSync(rlsPath)) {
    const rlsSql = readFileSync(rlsPath, 'utf-8');
    await sql.unsafe(rlsSql);
  }

  if (typeof databaseUrlOrClient === 'string') {
    await sql.end();
  }
}

// Direct execution entrypoint
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.ts')) {
  const dbUrl = process.env.DATABASE_URL || 'postgres://homedash:homedash_secret_password@localhost:5432/homedash';
  runMigrations(dbUrl)
    .then(() => {
      console.log('Migrations and RLS policies applied successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
