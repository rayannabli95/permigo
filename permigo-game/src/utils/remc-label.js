import { REMC } from '@/data/remc.js';

const SUBS = REMC.flatMap(c => c.subs);

export function labelComp(id) {
  const sub = SUBS.find(s => s.c === id);
  return sub ? sub.n : id;
}
