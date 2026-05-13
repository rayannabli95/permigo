/**
 * Façade DB — point unique d'accès aux données depuis le backend.
 *
 * En dev (NODE_ENV=development) → SQLite via better-sqlite3
 * En prod (NODE_ENV=production)  → Postgres via Supabase
 *
 * Le code applicatif importe `db` et `schema` sans se soucier du dialecte sous-jacent.
 *
 * @example
 *   import { db, schema } from '@/db/client.js';
 *   const eleves = await db.select().from(schema.profiles).where(eq(schema.profiles.role, 'eleve'));
 */

import { env } from '../config/env.js';
import * as schema from './schema.js';

let _db;

if (env.IS_PROD) {
  // ─── Postgres (prod) ───
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const postgres = (await import('postgres')).default;
  const client = postgres(env.DATABASE_URL, { max: 5 });
  _db = drizzle(client, { schema });
} else {
  // ─── SQLite (dev) via @libsql/client (pure JS, 0 compilation) ───
  const { drizzle } = await import('drizzle-orm/libsql');
  const { createClient } = await import('@libsql/client');
  // libsql accepte file:./dev.db nativement
  const client = createClient({ url: env.DATABASE_URL });
  _db = drizzle(client, { schema });
}

export const db = _db;
export { schema };
