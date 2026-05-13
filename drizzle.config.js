import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  schema: './src/db/schema.js',
  out: './supabase/migrations',
  // Switch dialecte selon l'env
  // turso = dialecte SQLite via @libsql/client (compatible drizzle-kit)
  dialect: isProduction ? 'postgresql' : 'turso',
  dbCredentials: isProduction
    ? { url: process.env.DATABASE_URL }
    : { url: process.env.DATABASE_URL || 'file:dev.db' },
  verbose: true,
  strict: true,
};
