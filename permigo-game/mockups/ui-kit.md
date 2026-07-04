# Bibliothèque UI PermiGo — catalogue

> Galerie vivante : ouvre **`mockups/ui-kit.html`** (bascule rôle élève/moniteur + thème clair/sombre en haut). Tokens réels dans `mockups/ui-kit-tokens.css` (miroir autonome de `src/styles/base.css`).

**Règle d'or** : n'utilise QUE les tokens (`var(--a)`, `var(--su)`, `var(--ink)`, `var(--bo)`…). N'invente jamais `--surface` / `--border` / `--muted` → bug dark mode. Pour du texte accent sur fond clair : `var(--a-txt)`.

---

## Fondations
Palette (accent `--a/--adk/--a-lt/--a-ink/--a-txt` + neutres `--su/--su2/--bg/--bo/--ink/--mu` + états `--gr/--am/--rd/--bl` + or Arène `--arene-gold`), rayons (`--r-sm→--rx`, `--r-full`), ombres (`--s1→--s4`, `--s-a`), typo (`--fs-xs→--fs-xl`, polices `--fb`), espacement (`--sp-1→--sp-5`). Tout est theme-aware.

## Boutons
Hiérarchie : `pri` (plein `--a`), `sec` (contour), `ghost`, `dang`. Tailles `sm/md/lg`, `full`, icône-seul (`btn-ic`, ≥44px). États hover/active/disabled/loading (spinner). **Relief 3D « plastique »** (`btn3d green/gold/accent`) réservé à l'action reine du monde Arène (Jouer) — s'écrase au press.
```html
<button class="uk-btn pri">Valider</button>
<button class="uk-btn3d green">▶ Jouer</button>
```

## Formulaires
Input (label + aide + erreur), mot de passe (œil), textarea, select, checkbox, radio, switch, **segment control** 2/3, recherche. Focus = anneau accent (`0 0 0 4px var(--ap)`), erreur = `--rd`. Cibles ≥ 44px.

## Cartes
`card` (base), `card cardc` (cliquable : chevron plein + enfoncement `:active`), `cardm` (média), **tuile Arène** `arena` (nuit-violet + médaillon + CTA relief — le seul objet « plastique »), `kpi` (grand chiffre + delta).

## Chips · badges · pastilles
Chips filtre (`on`), tags statut (`new`/`mini`/`pro`), badge compteur (pastille rouge), **pastille volants** (coin doré + nombre, `font-variant-numeric:tabular-nums`), **série** (flamme réelle `../public/skins/permigo-streak-flame-v1.webp`).

## Icônes — set médaillon
Un seul langage : disque dégradé + biseau (2 cercles stroke) + reflet haut + **glyphe blanc**. Généré par `med(id, stops, glyph)`. 8 glyphes fournis (examen/toque, volant, alerte, situation/route, question/ampoule, trophée, cible, éclair). C'est ce qui remplace les pictos-trait « effet IA ». Compléments : vrais assets `public/skins/badge-3d-*.webp`, `public/signs/*.svg`.

## Navigation
Header vitré (logo + pastille solde + avatar), **barre 5 portes** (onglet actif = couleur `--a` + soulignement), onglets (`tabs`), bouton retour, **FAB** (56px, `--s-a-lg`).

## Overlays
Rendus « ouverts » : bottom-sheet (poignée + actions), modal (titre + texte + 2 boutons), **toasts** (`ok`/`err`/`info`), info-bulle, **étape de tuto** (n/total + Passer/Suivant).

## États & feedback
Skeletons (shimmer), **état vide** (médaillon + titre + sous-titre + CTA), barre de progression, anneau (SVG), spinner, chargement **« feu vert »**, série. L'app ne laisse jamais d'écran mort.

## Listes
Ligne (média + titre + sous-titre + valeur/chevron), cliquable (`:active`), en-tête de section, **accordéon** (`<details>`), ligne « points faibles ».

## Avatars & bannières
Avatars initiales/image (`sm/md/lg`, anneau de statut), pile d'avatars, bannières `info/ok/warn`, nudge d'installation (A2HS), bandeau cookies.

---

### Incohérences repérées dans l'existant (chantier futur, hors de ce livrable)
Signalées par l'audit — à unifier un jour sur cette bibliothèque : préfixes CSS par page qui redéfinissent des composants proches (`acc2-`, `bo2-`, `rvh-`, `aj-`, `ens-`), plusieurs styles de boutons 3D, doublons skeleton/empty-state entre pages. **Ce livrable ne refactore PAS la prod** : il pose la référence.
