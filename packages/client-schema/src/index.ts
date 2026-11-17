import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const CLIENT_SCHEMA_SQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

export const CLIENT_TABLES = [
  'local_finance_accounts',
  'local_finance_transactions',
  'local_utility_bills',
  'local_medications',
  'local_medication_logs',
  'local_caregiver_shifts',
  'local_vitals_logs',
  'local_medical_allergies',
  'local_grocery_items',
  'local_meal_plans',
  'local_chores',
  'local_home_wiki_cards',
] as const;

export type ClientTable = (typeof CLIENT_TABLES)[number];
