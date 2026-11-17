import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { households, householdModules, users, householdMembers } from './schema/index';

export interface SeedResult {
  householdId: string;
  adminUserId: string;
  householdName: string;
}

export async function seedDefaultHousehold(db: any): Promise<SeedResult> {
  // 1. Create Default Household
  const [household] = await db
    .insert(households)
    .values({
      name: 'The Family',
    })
    .returning();

  // 2. Enable All Household Modules
  await db
    .insert(householdModules)
    .values({
      householdId: household.id,
      financeEnabled: true,
      healthEnabled: true,
      vaultEnabled: true,
      dailyOpsEnabled: true,
    })
    .returning();

  // 3. Create Default Household Administrator User
  const [adminUser] = await db
    .insert(users)
    .values({
      fullName: 'Household Admin',
      email: 'admin@homedash.local',
      phoneNumber: '+15550000000',
    })
    .returning();

  // 4. Create Admin Household Membership
  await db
    .insert(householdMembers)
    .values({
      householdId: household.id,
      userId: adminUser.id,
      role: 'admin',
      displayName: 'Admin',
      isEmergencyContact: true,
    })
    .returning();

  return {
    householdId: household.id,
    adminUserId: adminUser.id,
    householdName: household.name,
  };
}

// Direct execution entrypoint
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  const dbUrl = process.env.DATABASE_URL || 'postgres://homedash:homedash_secret_password@localhost:5432/homedash';
  const sql = postgres(dbUrl, { max: 1 });
  const db = drizzle(sql);

  seedDefaultHousehold(db)
    .then((result) => {
      console.log('Seeding completed successfully:', result);
      return sql.end();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
