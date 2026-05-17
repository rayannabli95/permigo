// ═══════════════════════════════════════════════════════════════
// Skeleton loaders — HTML helpers pour les états de chargement
// Les classes .skel / .skel-text / .skel-card sont définies dans animations.css
// ═══════════════════════════════════════════════════════════════

/** Skeleton carte (height configurable) */
export function skelCard(h = '80px') {
  return `<div class="skel skel-card" style="height:${h}"></div>`;
}

/** N skeleton cartes empilées */
export function skelCards(n = 3, h = '80px') {
  return Array.from({ length: n }, () => skelCard(h)).join('');
}

/** Lignes de texte skeleton */
export function skelText(lines = 2) {
  return Array.from({ length: lines }, (_, i) => `
    <div class="skel skel-text" style="width:${i === lines - 1 ? '65%' : '100%'}"></div>
  `).join('');
}

/** Skeleton rangée liste (avatar rond + 2 lignes texte) */
export function skelRow() {
  return `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px">
      <div class="skel" style="width:40px;height:40px;border-radius:50%;flex-shrink:0"></div>
      <div style="flex:1">${skelText(2)}</div>
    </div>
  `;
}

/** N rangées liste */
export function skelRows(n = 4) {
  return Array.from({ length: n }, () => skelRow()).join('');
}

/** Skeleton page entière (header + cards) */
export function skelPage(cardCount = 3) {
  return `
    <div style="padding:16px">
      <div class="skel" style="height:24px;width:55%;margin-bottom:6px"></div>
      <div class="skel skel-text" style="width:40%"></div>
    </div>
    <div style="padding:0 16px">${skelCards(cardCount)}</div>
  `;
}
