import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://homedash:homedash_secret_password@localhost:5432/homedash',
  },
  verbose: true,
  strict: true,
});
