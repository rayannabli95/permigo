/**
 * Asset URL helper — résout les chemins d'assets compatibles avec le base path.
 *
 * En dev   : asset('permigo-logo.png') → '/permigo-logo.png'
 * En prod  : asset('permigo-logo.png') → '/permigo-v7/permigo-logo.png' (avec base GitHub Pages)
 *
 * Utilisation :
 *   import { asset } from '@/utils/asset.js';
 *   <img src="${asset('permigo-logo.png')}">
 */

const BASE = import.meta.env.BASE_URL || '/';

export function asset(path) {
  if (!path) return BASE;
  // Strip leading slash pour éviter le double slash
  return BASE + String(path).replace(/^\//, '');
}

export const BASE_URL = BASE;
