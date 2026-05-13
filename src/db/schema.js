/**
 * Schéma DB Drizzle — UNIQUE source de vérité pour SQLite (dev) ET Postgres (prod).
 * Drizzle traduit automatiquement les types selon le dialecte cible.
 *
 * Ajouter une table = éditer ce fichier + `npm run db:generate` + `npm run db:migrate`.
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── PROFILES ───
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  authId: text('auth_id').unique(),
  role: text('role', { enum: ['admin', 'moniteur', 'eleve'] }).notNull(),
  nom: text('nom').notNull(),
  email: text('email').unique(),
  tel: text('tel'),
  plaque: text('plaque'),
  maxHeures: integer('max_heures').default(35),
  neph: text('neph'),
  dob: text('dob'),
  forfaitH: integer('forfait_h').default(20),
  statut: text('statut').default('Actif'),
  codeStatut: text('code_statut').default('En cours'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── EVENTS (leçons, dispos, absences) ───
export const events = sqliteTable('events', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  eleveId: text('eleve_id').references(() => profiles.id, { onDelete: 'set null' }),
  moniteurId: text('moniteur_id').references(() => profiles.id, { onDelete: 'set null' }),
  h: text('h').notNull(), // "09:00"
  d: integer('d').notNull(), // 1-7 = lundi-dimanche
  t: text('t'), // conf|pend|lecon|dispo|perso|absence
  dur: real('dur').default(1),
  lieu: text('lieu'),
  comment: text('comment'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── REMC ENTRIES (livret par élève) ───
export const remcEntries = sqliteTable('remc_entries', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  eleveId: text('eleve_id').references(() => profiles.id, { onDelete: 'cascade' }),
  moniteurId: text('moniteur_id').references(() => profiles.id),
  compId: text('comp_id').notNull(), // ex: "C1a"
  checked: integer('checked', { mode: 'boolean' }).default(false),
  lv: text('lv'), // 'v'=acquis, 'p'=en cours, 'r'=à retravailler
  note: text('note'),
  validatedAt: text('validated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── ABSENCES ───
export const absences = sqliteTable('absences', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  moniteurId: text('moniteur_id').references(() => profiles.id, { onDelete: 'cascade' }),
  dateAbs: text('date_abs').notNull(),
  dureeH: real('duree_h').default(4),
  motif: text('motif'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── NOTATIONS (élève → moniteur, étoiles) ───
export const notations = sqliteTable('notations', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  eleveId: text('eleve_id').references(() => profiles.id, { onDelete: 'cascade' }),
  moniteurId: text('moniteur_id').references(() => profiles.id, { onDelete: 'cascade' }),
  stars: integer('stars').notNull(), // 1-5
  commentaire: text('commentaire'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── LIEUX (points RDV par moniteur) ───
export const lieux = sqliteTable('lieux', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  moniteurId: text('moniteur_id').references(() => profiles.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  adresse: text('adresse'),
  actif: integer('actif', { mode: 'boolean' }).default(true),
});

// ─── NOTES PRIVÉES (moniteur sur élève) ───
export const notesPriv = sqliteTable('notes_priv', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  moniteurId: text('moniteur_id').references(() => profiles.id, { onDelete: 'cascade' }),
  eleveId: text('eleve_id').references(() => profiles.id, { onDelete: 'cascade' }),
  contenu: text('contenu'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── NOTIFICATIONS ───
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').default('info'),
  title: text('title').notNull(),
  body: text('body'),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── AUDIT LOG (immuable) ───
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  userNom: text('user_nom'),
  userRole: text('user_role'),
  action: text('action').notNull(),
  tableName: text('table_name'),
  recordId: text('record_id'),
  details: text('details'), // JSON stringifié
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
