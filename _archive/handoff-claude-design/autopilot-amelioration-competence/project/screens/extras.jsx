// Extra artboards — moniteur view + dopamine celebration + monde détail

// ──────────────────────────────────────────────────────────────────────
// Monde détail — opens when tapping a world card (premium dark hero)
// ──────────────────────────────────────────────────────────────────────
function MondeDetail() {
  const w = WORLDS[1]; // Contrôle du véhicule
  const items = [
    { id:6,  name:'Gestion des Vitesses',    sub:'Embrayage, point de patinage, séquence', status:'next',   xp:60 },
    { id:7,  name:'Direction & Trajectoire', sub:'Tenue de cap, regard, croisement',       status:'locked', xp:60 },
    { id:8,  name:'Maîtrise de l\u2019Allure',sub:'Vitesse adaptée à l\u2019environnement', status:'locked', xp:70 },
    { id:9,  name:'Virages & Courbes',       sub:'Anticipation et placement',              status:'locked', xp:70 },
    { id:10, name:'Conduite Fluide',         sub:'Coordination des commandes',             status:'locked', xp:80 },
  ];
  return (
    <div style={{ background:'#F8FAFC', height:'100%', display:'flex', flexDirection:'column' }}>
      <div className="no-scroll" style={{ overflow:'auto', flex:1 }}>
        {/* hero */}
        <div style={{
          position:'relative', padding:'18px 18px 26px',
          background:`radial-gradient(120% 90% at 30% 0%, ${w.color}DD 0%, #0F172A 70%)`,
          color:'#fff',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.16)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <I.chevL color="#fff"/>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', letterSpacing:1 }}>MONDE {w.id} / 6</div>
            <div style={{ width:36, height:36 }}/>
          </div>
          <div style={{ marginTop:18, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:64, height:64, borderRadius:18,
              background:'rgba(255,255,255,0.16)', border:'1px solid rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <I.steering color="#fff" size={32}/>
            </div>
            <div style={{ flex:1 }}>
              <div className="font-display" style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.02em' }}>{w.name}</div>
              <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{w.subtitle}</div>
            </div>
          </div>
          <div style={{ marginTop:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
              <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>0/5 compétences</div>
              <div className="font-num" style={{ fontSize:12, fontWeight:700 }}>+ 340 XP à gagner</div>
            </div>
            <Bar value={0} color="rgba(255,255,255,0.9)" track="rgba(255,255,255,0.18)" height={6}/>
          </div>
        </div>

        {/* trophée prochain */}
        <div style={{
          margin:'-14px 14px 14px', background:'#fff', borderRadius:18,
          padding:'12px 14px', border:'1px solid #EEF2F7', display:'flex', alignItems:'center', gap:12,
        }} className="shadow-card">
          <div style={{ width:42, height:42, borderRadius:12, background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <I.trophy color="#D97706" size={22}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>Trophée « Pilote en herbe »</div>
            <div style={{ fontSize:11.5, color:'#64748B', marginTop:1 }}>Validez les 5 compétences pour le débloquer</div>
          </div>
        </div>

        {/* list */}
        <div style={{ padding:'4px 14px 24px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#64748B', letterSpacing:1, padding:'6px 4px' }}>COMPÉTENCES</div>
          {items.map(it => (
            <div key={it.id} style={{
              background:'#fff', border:'1px solid #EEF2F7', borderRadius:16,
              padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
            }} className="shadow-card">
              <StatusNode status={it.status==='next'?'active':'locked'} size={40}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'#94A3B8' }}>{String(it.id).padStart(2,'0')}</span>
                  <span className="font-display" style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>{it.name}</span>
                </div>
                <div style={{ fontSize:11.5, color:'#64748B', marginTop:2 }}>{it.sub}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <Pill bg="#EFEBFF" color="#5B43E8"><I.bolt size={10} color="#5B43E8"/> {it.xp} XP</Pill>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Vue moniteur — instructor view of a student's parcours
// ──────────────────────────────────────────────────────────────────────
function VueMoniteur() {
  const students = [
    { name:'Léa Marin',    monde:1, comp:'Démarrage Fluide',  pct:10, color:'#22C55E', state:'active' },
    { name:'Hugo Petit',   monde:3, comp:'Priorités droite',  pct:42, color:'#F59E0B', state:'review' },
    { name:'Sara Bernard', monde:2, comp:'Direction',         pct:28, color:'#3B82F6', state:'active' },
  ];
  return (
    <div style={{ background:'#F8FAFC', height:'100%', display:'flex', flexDirection:'column' }}>
      <div className="no-scroll" style={{ overflow:'auto', flex:1, paddingBottom:88 }}>
        <div style={{ padding:'14px 18px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div className="font-display" style={{ fontSize:22, fontWeight:800, color:'#0F172A', letterSpacing:'-0.02em' }}>Mes élèves</div>
            <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Vue moniteur · 14 élèves actifs</div>
          </div>
          <div style={{ width:38, height:38, borderRadius:12, background:'#6D5BFF', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>TD</div>
        </div>

        {/* search */}
        <div style={{ padding:'4px 14px 12px' }}>
          <div style={{
            background:'#fff', border:'1px solid #EEF2F7', borderRadius:14,
            padding:'10px 12px', display:'flex', alignItems:'center', gap:10, color:'#94A3B8', fontSize:13,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            Rechercher un élève…
          </div>
        </div>

        {/* filters */}
        <div style={{ padding:'0 14px 12px', display:'flex', gap:6, overflowX:'auto' }} className="no-scroll">
          {['Tous','En cours','À revoir','Examens proches','Validés'].map((f,i)=>(
            <div key={f} style={{
              padding:'7px 12px', borderRadius:999, fontSize:11.5, fontWeight:700, whiteSpace:'nowrap',
              background: i===0 ? '#0F172A' : '#fff',
              color: i===0 ? '#fff' : '#475569',
              border: i===0 ? 'none' : '1px solid #E2E8F0',
            }}>{f}</div>
          ))}
        </div>

        {/* student cards */}
        <div style={{ padding:'0 14px', display:'flex', flexDirection:'column', gap:10 }}>
          {students.map((s,i) => (
            <div key={i} style={{
              background:'#fff', borderRadius:18, border:'1px solid #EEF2F7',
              padding:14, display:'flex', flexDirection:'column', gap:10,
            }} className="shadow-card">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width:42, height:42, borderRadius:'50%',
                  background:`linear-gradient(135deg, ${s.color}, ${s.color}88)`,
                  color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13,
                }}>{s.name.split(' ').map(p=>p[0]).join('')}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="font-display" style={{ fontSize:14.5, fontWeight:700, color:'#0F172A' }}>{s.name}</div>
                  <div style={{ fontSize:11.5, color:'#64748B', marginTop:1 }}>Monde {s.monde} · {s.comp}</div>
                </div>
                <Pill bg={s.state==='review'?'#FEF3C7':'#EFEBFF'} color={s.state==='review'?'#B45309':'#5B43E8'}>
                  {s.state==='review' ? 'à revoir' : 'en cours'}
                </Pill>
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <div style={{ fontSize:10.5, color:'#94A3B8', fontWeight:700, letterSpacing:0.5 }}>PROGRESSION GLOBALE</div>
                  <div className="font-num" style={{ fontSize:11.5, color:'#0F172A', fontWeight:800 }}>{s.pct}%</div>
                </div>
                <Bar value={s.pct} color={{from:s.color, to:s.color}} height={6}/>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={{
                  flex:1, height:34, borderRadius:10, border:'1px solid #E2E8F0', background:'#fff',
                  fontWeight:700, fontSize:12, color:'#0F172A', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}><I.clipboard size={14} color="#6D5BFF"/> Évaluer</button>
                <button style={{
                  flex:1, height:34, borderRadius:10, border:'none', background:'#6D5BFF',
                  fontWeight:700, fontSize:12, color:'#fff', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}><I.msg size={14} color="#fff"/> Message</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="std"/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Feedback dopamine — competence validated celebration screen
// ──────────────────────────────────────────────────────────────────────
function FeedbackDopamine() {
  // confetti positions
  const confetti = [
    {l:30, t:80,  c:'#6D5BFF', r:18},
    {l:300,t:100, c:'#22C55E', r:-12},
    {l:60, t:160, c:'#F59E0B', r:45},
    {l:280,t:180, c:'#EC4899', r:-30},
    {l:130,t:60,  c:'#22C55E', r:25},
    {l:240,t:40,  c:'#6D5BFF', r:-15},
    {l:200,t:240, c:'#F59E0B', r:30},
    {l:90, t:240, c:'#EC4899', r:-22},
    {l:330,t:260, c:'#22C55E', r:10},
    {l:20, t:280, c:'#6D5BFF', r:-40},
  ];
  return (
    <div style={{
      height:'100%', position:'relative', overflow:'hidden',
      background:'radial-gradient(120% 80% at 50% 0%, #2A1A6B 0%, #0B1020 70%)',
      display:'flex', flexDirection:'column',
    }}>
      {/* confetti */}
      {confetti.map((c,i)=>(
        <div key={i} className="confetti-dot float-soft"
          style={{ left:c.l, top:c.t, background:c.c, transform:`rotate(${c.r}deg)`, animationDelay:`${i*0.2}s` }}/>
      ))}

      {/* rays */}
      <svg width="100%" height="320" viewBox="0 0 400 320" style={{ position:'absolute', top:60, left:0, opacity:0.3 }}>
        <defs>
          <radialGradient id="ray" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FBBF24" stopOpacity="0.7"/>
            <stop offset="1" stopColor="#FBBF24" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="200" cy="160" r="160" fill="url(#ray)"/>
      </svg>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#fff', padding:'0 24px', position:'relative' }}>
        <div className="float-soft" style={{
          width:160, height:160, borderRadius:'50%',
          background:'linear-gradient(180deg,#FBBF24,#F59E0B)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 30px 80px -20px rgba(245,158,11,0.65), 0 0 0 8px rgba(255,255,255,0.06), 0 0 0 16px rgba(255,255,255,0.03)',
          marginBottom:30,
        }}>
          <I.trophy color="#fff" size={76}/>
        </div>

        <div style={{ fontSize:11, fontWeight:800, color:'#FCD34D', letterSpacing:2 }}>COMPÉTENCE VALIDÉE</div>
        <div className="font-display" style={{ fontSize:32, fontWeight:800, letterSpacing:'-0.03em', marginTop:8, textAlign:'center' }}>Bravo Léa !</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', marginTop:8, textAlign:'center', maxWidth:280, textWrap:'pretty' }}>
          Tu maîtrises <b style={{color:'#fff'}}>Position de Pilotage</b> — étape 02 du Monde 1.
        </div>

        {/* xp + streak chips */}
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:14,
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
            backdropFilter:'blur(10px)',
          }}>
            <I.bolt color="#A5B4FC" size={18} fill="#A5B4FC"/>
            <div>
              <div className="font-num" style={{ fontSize:16, fontWeight:800 }}>+ 50 XP</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>2 450 au total</div>
            </div>
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:14,
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
            backdropFilter:'blur(10px)',
          }}>
            <I.flame color="#FB923C" size={18}/>
            <div>
              <div className="font-num" style={{ fontSize:16, fontWeight:800 }}>5 jours</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Série en cours</div>
            </div>
          </div>
        </div>

        {/* next preview */}
        <div style={{
          marginTop:34, width:'100%', maxWidth:300,
          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:18, padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
        }}>
          <StatusNode status="active" size={42}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:700, letterSpacing:1 }}>PROCHAINE ÉTAPE</div>
            <div style={{ fontSize:13.5, fontWeight:700, color:'#fff', marginTop:2 }}>Démarrage Fluide</div>
          </div>
          <I.chevR color="#fff"/>
        </div>
      </div>

      <div style={{ padding:'14px 18px 24px' }}>
        <button style={{
          width:'100%', height:54, borderRadius:14, border:'none', cursor:'pointer',
          background:'#fff', color:'#0F172A', fontSize:15, fontWeight:800,
          boxShadow:'0 14px 40px -10px rgba(255,255,255,0.35)',
        }}>Continuer le parcours</button>
        <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'rgba(255,255,255,0.55)', fontWeight:600 }}>
          Partager ta réussite
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MondeDetail, VueMoniteur, FeedbackDopamine });
