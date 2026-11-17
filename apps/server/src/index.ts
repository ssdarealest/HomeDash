import { createApp } from './app';
import { runMigrations } from '@homedash/server-schema/migrate';

const app = createApp();
const port = parseInt(process.env.PORT || '3000', 10);
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && process.env.NODE_ENV === 'production') {
  console.log('[Family OS] Running database schema migrations and RLS policies...');
  try {
    await runMigrations(databaseUrl);
    console.log('[Family OS] Database migrations applied successfully.');
  } catch (err) {
    console.error('[Family OS] Migration failed on startup:', err);
  }
}

console.log(`[Family OS] Backend API server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
