// Parcours élève — main screen with sinuous road

function HeaderStats() {
  return (
    <div style={{ padding: '0 18px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
        <div>
          <div className="font-display" style={{ fontSize:22, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em' }}>Parcours de conduite</div>
          <div style={{ fontSize:12.5, color:'#64748B', marginTop:2 }}>Bonjour Léa — continue ta progression</div>
        </div>
        <div style={{ width:38, height:38, borderRadius:12, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <I.bell />
          <span style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:4, background:'#EF4444', border:'2px solid #fff' }}/>
        </div>
      </div>

      {/* progression principale */}
      <div style={{ background:'#fff', border:'1px solid #EEF2F7', borderRadius:18, padding:14 }} className="shadow-card">
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontSize:12.5, color:'#475569', fontWeight:600 }}>3 compétences validées sur 31</div>
          <div className="font-num" style={{ fontSize:13, fontWeight:700, color:'#16A34A' }}>10%</div>
        </div>
        <Bar value={10} color={{from:'#34D399', to:'#16A34A'}} height={8}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:12 }}>
          <Stat icon={<I.bolt color="#6D5BFF"/>} label="XP total" value="2 450" tint="#EFEBFF"/>
          <Stat icon={<I.trophy color="#F59E0B"/>} label="Trophées" value="2/6" tint="#FEF3C7"/>
          <Stat icon={<I.flame color="#F97316"/>} label="Série" value="5 j" tint="#FFE4E1"/>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tint }) {
  return (
    <div style={{ borderRadius:14, background:'#F8FAFC', padding:'10px 10px 8px', border:'1px solid #EEF2F7' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:22, height:22, borderRadius:7, background:tint, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
        <div style={{ fontSize:10.5, color:'#64748B', fontWeight:600, letterSpacing:0.2 }}>{label.toUpperCase()}</div>
      </div>
      <div className="font-num" style={{ fontSize:16, fontWeight:800, color:'#0F172A', marginTop:4 }}>{value}</div>
    </div>
  );
}

// Sinuous road with nodes positioned along a curve.
// Stations are placed along an S-curve to mimic Duolingo/Candy-Crush feel,
// but premium — soft sky gradient, distant skyline, no childish art.
function SinuousRoad({ nodes, onPick }) {
  const W = 354, H = 460;
  // S-curve waypoints (x, y) — alternates left/right
  const waypoints = [
    { x: 90,  y: 60  },
    { x: 250, y: 130 },
    { x: 90,  y: 215 },
    { x: 250, y: 305 },
    { x: 110, y: 395 },
  ];

  // Build path between waypoints with curves
  const pathD = waypoints.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i-1];
    const midY = (prev.y + p.y)/2;
    return `${acc} C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
  }, '');

  return (
    <div style={{
      position:'relative', width:W, height:H,
      borderRadius:22, overflow:'hidden',
      background:'linear-gradient(180deg,#E8F1FF 0%, #EAF6EC 60%, #DFF1E2 100%)',
      border:'1px solid #DCE7F2',
    }}>
      {/* distant skyline */}
      <svg width={W} height={120} viewBox={`0 0 ${W} 120`} style={{ position:'absolute', top:0, left:0, opacity:0.45 }}>
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#BCD3F0"/>
            <stop offset="1" stopColor="#E8F1FF" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect width={W} height="120" fill="url(#sky)"/>
        <g fill="#94A3B8" opacity="0.55">
          <rect x="14"  y="70" width="22" height="40"/>
          <rect x="40"  y="60" width="14" height="50"/>
          <rect x="58"  y="78" width="20" height="32"/>
          <rect x="82"  y="55" width="16" height="55"/>
          <rect x="104" y="72" width="22" height="38"/>
          <rect x="138" y="60" width="14" height="50"/>
          <rect x="156" y="68" width="22" height="42"/>
          <rect x="182" y="50" width="18" height="60"/>
          <rect x="204" y="74" width="26" height="36"/>
          <rect x="236" y="62" width="14" height="48"/>
          <rect x="254" y="70" width="22" height="40"/>
          <rect x="280" y="56" width="16" height="54"/>
          <rect x="300" y="76" width="24" height="34"/>
          <rect x="328" y="64" width="14" height="46"/>
        </g>
      </svg>

      {/* trees scattered */}
      {[{x:30,y:175},{x:330,y:240},{x:35,y:340},{x:320,y:380},{x:200,y:175},{x:180,y:415}].map((t,i)=>(
        <div key={i} style={{ position:'absolute', left:t.x, top:t.y, width:16, height:18, opacity:0.6 }}>
          <svg viewBox="0 0 24 24" fill="#86A789"><circle cx="12" cy="10" r="8"/><rect x="11" y="14" width="2" height="6" fill="#7A6248"/></svg>
        </div>
      ))}

      {/* road */}
      <svg width={W} height={H} style={{ position:'absolute', inset:0 }}>
        <defs>
          <filter id="rdsh" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {/* shadow */}
        <path d={pathD} fill="none" stroke="rgba(15,23,42,0.10)" strokeWidth="34" strokeLinecap="round" filter="url(#rdsh)"/>
        {/* asphalt */}
        <path d={pathD} fill="none" stroke="#CBD9E7" strokeWidth="28" strokeLinecap="round"/>
        {/* edges */}
        <path d={pathD} fill="none" stroke="#fff" strokeWidth="30" strokeLinecap="round" strokeOpacity="0.0"/>
        {/* dashed center line */}
        <path d={pathD} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 8"/>
      </svg>

      {/* Nodes */}
      {nodes.map((c, i) => {
        const wp = waypoints[i];
        return (
          <div key={c.id}
            onClick={() => onPick && c.status!=='locked' && onPick(c)}
            style={{
              position:'absolute', left:wp.x-30, top:wp.y-30,
              cursor: c.status==='locked' ? 'default' : 'pointer',
            }}>
            <StatusNode status={c.status} size={60}/>
            {/* label */}
            <div style={{
              position:'absolute', top:64, left:'50%', transform:'translateX(-50%)',
              whiteSpace:'nowrap', padding:'5px 10px', borderRadius:10,
              background:'#fff', boxShadow:'0 4px 12px -4px rgba(15,23,42,0.18)',
              fontSize:11.5, fontWeight:700, color:'#0F172A',
              border:'1px solid #EEF2F7',
            }}>
              <span style={{ color:'#94A3B8', fontWeight:700, marginRight:6 }}>{String(c.id).padStart(2,'0')}</span>
              {c.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// World card row (compact, locked or unlocked)
function WorldCard({ w, progress = 0, locked = true }) {
  return (
    <div style={{
      borderRadius:16, padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
      background: locked ? '#FFFFFF' : `linear-gradient(180deg, ${w.accent}, #fff)`,
      border:`1px solid ${locked ? '#EEF2F7' : w.color+'40'}`,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{
        width:42, height:42, borderRadius:12,
        background: locked ? '#F1F5F9' : w.color,
        color: locked ? '#94A3B8' : '#fff',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontWeight:800, fontSize:14, fontFamily:'Inter', letterSpacing:'-0.02em',
      }}>
        {locked ? <I.lock size={18} color="#94A3B8"/> : w.idx}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <span style={{ fontSize:10, fontWeight:700, color: locked ? '#94A3B8' : w.color, letterSpacing:0.5 }}>MONDE {w.id}</span>
        </div>
        <div className="font-display" style={{ fontSize:14.5, fontWeight:700, color:'#0F172A', marginTop:1 }}>{w.name}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div className="font-num" style={{ fontSize:12.5, fontWeight:700, color:'#0F172A' }}>{progress}/{w.count}</div>
        <I.chevR/>
      </div>
    </div>
  );
}

function WorldHero() {
  return (
    <div style={{
      margin:'0 14px 12px', borderRadius:22, padding:'14px 14px 16px',
      background:'linear-gradient(180deg, #ECFDF3 0%, #DEFCE6 100%)',
      border:'1px solid #BBF7D0',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:6 }}>
        <div>
          <div style={{ fontSize:10.5, fontWeight:800, color:'#16A34A', letterSpacing:1 }}>MONDE 1</div>
          <div className="font-display" style={{ fontSize:19, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em', marginTop:1 }}>Mise en route</div>
          <div style={{ fontSize:11.5, color:'#475569', marginTop:2 }}>Découvrir la voiture et partir sereinement</div>
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap:4,
          padding:'5px 10px', borderRadius:999, background:'#fff',
          border:'1px solid #BBF7D0', color:'#15803D', fontWeight:800, fontSize:12,
        }}>
          <I.trophy color="#16A34A" size={14}/> 2/5
        </div>
      </div>
    </div>
  );
}

function TabBar({ active = 'comp' }) {
  const items = [
    { id:'home',  label:'Accueil',     icon:<I.home/> },
    { id:'plan',  label:'Planning',    icon:<I.calendar/> },
    { id:'std',   label:'Élèves',      icon:<I.users/> },
    { id:'comp',  label:'Compétences', icon:<I.route color="#6D5BFF"/> },
    { id:'menu',  label:'Menu',        icon:<I.menu/> },
  ];
  return (
    <div className="tabbar-blur" style={{
      position:'absolute', left:0, right:0, bottom:0,
      paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 22px)', paddingTop:8,
      display:'flex', justifyContent:'space-around',
    }}>
      {items.map(it => {
        const on = it.id===active;
        return (
          <div key={it.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, opacity: on?1:0.85 }}>
            {React.cloneElement(it.icon, { color: on?'#6D5BFF':'#94A3B8' })}
            <div style={{ fontSize:10, fontWeight: on?700:500, color: on?'#6D5BFF':'#94A3B8' }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function ParcoursEleve() {
  return (
    <div style={{ background:'#F8FAFC', height:'100%', position:'relative', display:'flex', flexDirection:'column' }}>
      <div className="no-scroll" style={{ overflow:'auto', flex:1, paddingBottom:88 }}>
        <div style={{ paddingTop:8 }}>
          <HeaderStats/>
          <WorldHero/>
          <div style={{ padding:'0 14px' }}>
            <SinuousRoad nodes={W1}/>
          </div>

          <div style={{ padding:'18px 14px 4px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div className="font-display" style={{ fontSize:14, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em' }}>Mondes suivants</div>
            <div style={{ fontSize:11.5, color:'#64748B', fontWeight:600 }}>5 verrouillés</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'8px 14px 24px' }}>
            {WORLDS.slice(1).map(w => <WorldCard key={w.id} w={w} progress={0} locked/>)}
          </div>
        </div>
      </div>
      <TabBar active="comp"/>
    </div>
  );
}

Object.assign(window, { ParcoursEleve, HeaderStats, SinuousRoad, WorldCard, TabBar });
