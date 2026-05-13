/**
 * Backend Hono — API REST minimale.
 *
 * Sert :
 *  - /api/profiles
 *  - /api/events
 *  - /api/remc
 *  - /api/notifications
 *
 * En dev : utilise SQLite via src/db/client.js
 * En prod : utilise Postgres (Supabase) via la même façade
 *
 * NOTE : pour la v7 on peut aussi rester 100% client-Supabase (RLS gère la sécu)
 * et n'utiliser ce backend QUE pour les ops admin avec service_role.
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { db, schema } from '../db/client.js';
import { env } from '../config/env.js';
import { eq } from 'drizzle-orm';

const app = new Hono();

app.use('/api/*', cors({ origin: '*', allowMethods: ['GET','POST','PATCH','DELETE'] }));

// ─── Health check ───
app.get('/api/health', (c) => c.json({ ok: true, env: env.NODE_ENV, time: new Date().toISOString() }));

// ─── Profiles ───
app.get('/api/profiles', async (c) => {
  const role = c.req.query('role');
  let rows;
  if (role) {
    rows = await db.select().from(schema.profiles).where(eq(schema.profiles.role, role));
  } else {
    rows = await db.select().from(schema.profiles);
  }
  return c.json(rows);
});

app.get('/api/profiles/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id));
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(row);
});

// ─── Events ───
app.get('/api/events', async (c) => {
  const monId = c.req.query('moniteurId');
  const eleveId = c.req.query('eleveId');
  let q = db.select().from(schema.events);
  if (monId)  q = q.where(eq(schema.events.moniteurId, monId));
  if (eleveId) q = q.where(eq(schema.events.eleveId, eleveId));
  return c.json(await q);
});

// ─── REMC ───
app.get('/api/remc/:eleveId', async (c) => {
  const eleveId = c.req.param('eleveId');
  const rows = await db.select().from(schema.remcEntries).where(eq(schema.remcEntries.eleveId, eleveId));
  return c.json(rows);
});

// ─── Start ───
const port = parseInt(env.PORT || '3001', 10);
console.log(`[hono] API démarre sur http://localhost:${port}`);
serve({ fetch: app.fetch, port });
