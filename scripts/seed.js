/**
 * Script de seed — initialise la DB locale avec quelques profils + REMC vide.
 * Usage : npm run db:seed
 */

import { db, schema } from '../src/db/client.js';

console.log('[seed] démarrage…');

// Admin / gérant
const [admin] = await db.insert(schema.profiles).values({
  role: 'admin',
  nom: 'Rayan Nabli',
  email: 'rayannabli27@gmail.com',
}).returning();

// Moniteurs
const [rayan] = await db.insert(schema.profiles).values({
  role: 'moniteur',
  nom: 'Rayan Nabli',
  email: 'rayan.nabli@autopilot.fr',
  maxHeures: 35,
}).returning();

const [lassaad] = await db.insert(schema.profiles).values({
  role: 'moniteur',
  nom: 'Lassaad Sahli',
  email: 'lassaad.sahli@autopilot.fr',
  maxHeures: 40,
}).returning();

// Élèves
const [latifa] = await db.insert(schema.profiles).values({
  role: 'eleve',
  nom: 'Latifa Sahli',
  email: 'latifa.sahli@autopilot.fr',
  forfaitH: 20,
}).returning();

const [sherine] = await db.insert(schema.profiles).values({
  role: 'eleve',
  nom: 'Sherine Nabli',
  email: 'sherine.nabli@autopilot.fr',
  forfaitH: 30,
}).returning();

console.log('[seed] profils créés :');
console.log('  admin:', admin?.nom);
console.log('  moniteurs:', rayan?.nom, lassaad?.nom);
console.log('  élèves:', latifa?.nom, sherine?.nom);
console.log('[seed] terminé ✅');
