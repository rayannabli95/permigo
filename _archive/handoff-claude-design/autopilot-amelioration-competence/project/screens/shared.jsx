// Shared constants, icons, primitives for Parcours REMC mockup

const WORLDS = [
  { id: 1, name: 'Mise en route',          subtitle: 'Découvrir la voiture et partir sereinement',  color: '#22C55E', accent: '#ECFDF3', count: 5, idx: '01' },
  { id: 2, name: 'Contrôle du véhicule',   subtitle: 'Maîtriser les commandes et la trajectoire',   color: '#3B82F6', accent: '#EFF6FF', count: 5, idx: '02' },
  { id: 3, name: 'Priorités & circulation',subtitle: 'Lire la route et appliquer les règles',       color: '#F59E0B', accent: '#FEF3C7', count: 5, idx: '03' },
  { id: 4, name: 'Environnement complexe', subtitle: 'Ville dense, multivoies, nuit et météo',      color: '#6D5BFF', accent: '#EFEBFF', count: 5, idx: '04' },
  { id: 5, name: 'Anticipation',           subtitle: 'Prévoir, observer, sécuriser',                color:'#14B8A6', accent:'#CCFBF1', count: 5, idx: '05' },
  { id: 6, name: 'Conduite autonome',      subtitle: 'Rouler seul·e en confiance',                  color: '#EC4899', accent: '#FCE7F3', count: 6, idx: '06' },
];

// Sample competences for World 1 (Mise en route) — used in main parcours
const W1 = [
  { id: 1, name: 'Premier Contact',          status: 'done',   xp: 50 },
  { id: 2, name: 'Position de Pilotage',     status: 'done',   xp: 50 },
  { id: 3, name: 'Démarrage Fluide',         status: 'active', xp: 60 },
  { id: 4, name: 'Arrêt & Contrôle',         status: 'locked', xp: 60 },
  { id: 5, name: 'Scanner la Route',         status: 'locked', xp: 70 },
];

// World 2 sample (locked-but-previewable)
const W2 = [
  { id: 6,  name: 'Gestion des Vitesses',     status: 'locked' },
  { id: 7,  name: 'Direction & Trajectoire',  status: 'locked' },
  { id: 8,  name: 'Maîtrise de l\u2019Allure',status: 'locked' },
  { id: 9,  name: 'Virages & Courbes',        status: 'locked' },
  { id: 10, name: 'Conduite Fluide',          status: 'locked' },
];

// ─── Icons (inline SVG to avoid network) ─────────────────────────
const I = {
  check: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke={p.color||'#fff'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  lock: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke={p.color||'#fff'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
  ),
  key: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke={p.color||'#fff'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="15.5" cy="8.5" r="4.5"/><path d="M12.5 11.5 4 20l2 2 2-2 2 2 3-3"/></svg>
  ),
  warn: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke={p.color||'#fff'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"/><circle cx="12" cy="17" r="0.6" fill={p.color||'#fff'} stroke="none"/><path d="M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/></svg>
  ),
  trophy: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke={p.color||'#F59E0B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v3a3 3 0 0 1-3 3M7 5H4v3a3 3 0 0 0 3 3"/></svg>
  ),
  bolt: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill={p.fill||'none'} stroke={p.color||'#7C6BFF'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2"/></svg>
  ),
  star: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill={p.fill||'#F59E0B'} stroke="none"><polygon points="12 2 14.9 8.6 22 9.3 16.7 14.1 18.3 21 12 17.3 5.7 21 7.3 14.1 2 9.3 9.1 8.6"/></svg>
  ),
  chevR: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke={p.color||'#94A3B8'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
  ),
  chevL: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke={p.color||'#0F172A'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 6 9 12 15 18"/></svg>
  ),
  bell: (p={}) => (
    <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke={p.color||'#0F172A'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
  ),
  home: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke={p.color||'#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11 12 3l9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9Z"/></svg>
  ),
  calendar: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke={p.color||'#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
  ),
  users: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke={p.color||'#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><circle cx="17" cy="9" r="2.5"/><path d="M15 21v-1a4 4 0 0 1 4-4h.5"/></svg>
  ),
  route: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke={p.color||'#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/></svg>
  ),
  menu: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke={p.color||'#94A3B8'} strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
  ),
  mic: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke={p.color||'#6D5BFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
  ),
  msg: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke={p.color||'#6D5BFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-8 8H8l-5 3 2-5a8 8 0 1 1 16-6Z"/></svg>
  ),
  clipboard: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none" stroke={p.color||'#6D5BFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6M9 12h6M9 16h4"/></svg>
  ),
  sparkle: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill={p.color||'#F59E0B'}><path d="M12 2 13.5 8.5 20 10 13.5 11.5 12 18 10.5 11.5 4 10 10.5 8.5 12 2Z"/></svg>
  ),
  flame: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill={p.color||'#F97316'}><path d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-1 .5-2 1-3-2 1-4 4-4 7a7 7 0 0 0 14 0c0-5-5-9-7-12Z"/></svg>
  ),
  car: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke={p.color||'#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l2-5a2 2 0 0 1 2-1h6a2 2 0 0 1 2 1l2 5"/><path d="M3 18v-4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v4"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>
  ),
  steering: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke={p.color||'#fff'} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 14v7M10.5 12.7l-7 3.5M13.5 12.7l7 3.5"/></svg>
  ),
};

// ─── Status node ────────────────────────────────────────────────
// Big circular node used along the road.
function StatusNode({ status, n, size = 56 }) {
  const map = {
    done:   { bg:'linear-gradient(180deg,#34D399,#16A34A)', ring:'#fff', shadow:'0 10px 24px -6px rgba(22,163,74,0.55)' },
    active: { bg:'linear-gradient(180deg,#9A8BFF,#6D5BFF)', ring:'#fff', shadow:'0 10px 24px -6px rgba(109,91,255,0.65)' },
    review: { bg:'linear-gradient(180deg,#FBBF24,#F59E0B)', ring:'#fff', shadow:'0 10px 24px -6px rgba(245,158,11,0.55)' },
    locked: { bg:'linear-gradient(180deg,#94A3B8,#475569)', ring:'#fff', shadow:'0 6px 16px -6px rgba(71,85,105,0.45)' },
  };
  const s = map[status];
  const content =
    status === 'done'   ? <I.check size={Math.round(size*0.42)} /> :
    status === 'active' ? <I.key   size={Math.round(size*0.42)} /> :
    status === 'review' ? <I.warn  size={Math.round(size*0.42)} /> :
                          <I.lock  size={Math.round(size*0.38)} />;
  return (
    <div
      className={status==='active' ? 'pulse-violet' : status==='review' ? 'pulse-orange' : ''}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: s.bg, border: `3px solid ${s.ring}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: s.shadow, color:'#fff',
        position:'relative',
      }}
    >
      {content}
      {n!=null && (
        <div style={{
          position:'absolute', right:-6, bottom:-6, minWidth:22, height:22, padding:'0 6px',
          borderRadius:11, background:'#0F172A', color:'#fff', fontSize:11, fontWeight:700,
          display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff',
          fontFamily:'Inter',
        }}>{n}</div>
      )}
    </div>
  );
}

// ─── Soft pill ────────────────────────────────────────────
function Pill({ children, color = '#0F172A', bg = '#F1F5F9', style = {} }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'4px 10px', borderRadius:999, background:bg, color,
      fontSize:11, fontWeight:600, letterSpacing:0.2,
      ...style,
    }}>{children}</span>
  );
}

// ─── Progress bar ─────────────────────────────────────────
function Bar({ value, color = '#22C55E', track = '#E2E8F0', height = 8, radius = 999 }) {
  return (
    <div style={{ width:'100%', height, background:track, borderRadius:radius, overflow:'hidden' }}>
      <div style={{
        width: `${Math.max(0, Math.min(100, value))}%`, height:'100%',
        background: typeof color === 'string' ? color : `linear-gradient(90deg, ${color.from}, ${color.to})`,
        borderRadius: radius,
        transition: 'width .4s ease',
      }}/>
    </div>
  );
}

Object.assign(window, { WORLDS, W1, W2, I, StatusNode, Pill, Bar });
