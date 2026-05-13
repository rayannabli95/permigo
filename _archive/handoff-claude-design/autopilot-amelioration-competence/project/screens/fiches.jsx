// Fiche compétence — 3 états (validée / en cours / à retravailler)

function FicheHeader({ status, name, worldName, worldColor }) {
  const map = {
    done:   { bg:'linear-gradient(180deg,#34D399,#16A34A)', text:'Compétence acquise',   pill:'#DCFCE7', pillT:'#15803D' },
    active: { bg:'linear-gradient(180deg,#9A8BFF,#6D5BFF)', text:'En cours d\u2019acquisition', pill:'#EFEBFF', pillT:'#5B43E8' },
    review: { bg:'linear-gradient(180deg,#FBBF24,#F59E0B)', text:'À retravailler',       pill:'#FEF3C7', pillT:'#B45309' },
  };
  const s = map[status];
  const icon = status==='done' ? <I.check size={42}/> : status==='active' ? <I.key size={40}/> : <I.warn size={40}/>;
  return (
    <div style={{
      position:'relative',
      background:`radial-gradient(120% 80% at 50% 0%, ${worldColor}22 0%, #0F172A 60%, #0A1124 100%)`,
      paddingBottom:38,
    }}>
      {/* city silhouette */}
      <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ position:'absolute', left:0, bottom:30, opacity:0.18 }}>
        <g fill="#fff">
          <rect x="0" y="70" width="40" height="50"/>
          <rect x="42" y="50" width="28" height="70"/>
          <rect x="72" y="80" width="38" height="40"/>
          <rect x="114" y="40" width="34" height="80"/>
          <rect x="150" y="76" width="42" height="44"/>
          <rect x="194" y="60" width="28" height="60"/>
          <rect x="226" y="34" width="40" height="86"/>
          <rect x="268" y="72" width="50" height="48"/>
          <rect x="320" y="56" width="34" height="64"/>
          <rect x="356" y="80" width="44" height="40"/>
        </g>
      </svg>

      {/* back button */}
      <div style={{ position:'absolute', top:8, left:14, width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.14)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(8px)' }}>
        <I.chevL color="#fff"/>
      </div>

      {/* big circular node */}
      <div style={{ display:'flex', justifyContent:'center', paddingTop:22 }}>
        <div style={{
          width:104, height:104, borderRadius:'50%',
          background: s.bg, border:'4px solid #fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 18px 40px -10px rgba(0,0,0,0.45)', color:'#fff',
        }}>
          {icon}
        </div>
      </div>

      <div style={{ textAlign:'center', color:'#fff', marginTop:14, padding:'0 24px' }}>
        <div className="font-display" style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.02em' }}>{name}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:4 }}>{worldName}</div>
        <div style={{ marginTop:12, display:'inline-flex' }}>
          <Pill bg={s.pill} color={s.pillT}>{s.text}</Pill>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value, valueColor='#0F172A' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px dashed #EEF2F7' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:30, height:30, borderRadius:9, background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
        <div style={{ fontSize:13, color:'#475569', fontWeight:600 }}>{label}</div>
      </div>
      <div className="font-num" style={{ fontSize:13.5, fontWeight:800, color:valueColor }}>{value}</div>
    </div>
  );
}

function FicheCompetence({ status }) {
  const W1info = WORLDS[0];
  const conf = {
    done:   { name:'Position de Pilotage', xpLabel:'XP gagnés',    xp:'+ 50 XP',   action:'Voir le détail', actionBg:'#6D5BFF' },
    active: { name:'Démarrage Fluide',     xpLabel:'XP gagnables', xp:'+ 60 XP',   action:'Continuer la leçon', actionBg:'#6D5BFF' },
    review: { name:'Arrêt & Contrôle',     xpLabel:'XP gagnables', xp:'+ 60 XP',   action:'Retravailler maintenant', actionBg:'#F59E0B' },
  }[status];

  const objectif = {
    done:   'S\u2019installer correctement au poste de conduite pour être à l\u2019aise et garder le contrôle du véhicule.',
    active: 'Démarrer le véhicule en douceur, sans caler, et en toute sécurité.',
    review: 'Maîtriser le freinage et l\u2019immobilisation du véhicule selon l\u2019environnement.',
  }[status];

  const criteres = {
    done: [
      { ok:true, t:'Réglage du siège et des rétroviseurs' },
      { ok:true, t:'Position des mains au volant' },
      { ok:true, t:'Réglage de l\u2019appui-tête et ceinture' },
    ],
    active: [
      { ok:true, t:'Démarrage moteur en sécurité' },
      { ok:true, t:'Coordination embrayage / accélération' },
      { ok:false, t:'Décollage sans à-coups' },
    ],
    review: [
      { ok:true,  t:'Freinage progressif anticipé' },
      { ok:false, t:'Distance de sécurité avant l\u2019arrêt' },
      { ok:false, t:'Stabilisation à l\u2019arrêt' },
    ],
  }[status];

  const feedback = {
    done:   { name:'Thomas D.', text:'Très bonne position, bien ajustée. Continue comme ça !' },
    active: { name:'Thomas D.', text:'Pense à mieux doser l\u2019embrayage au démarrage. On y retravaille mardi.' },
    review: { name:'Thomas D.', text:'Anticipe davantage la zone de freinage. À reprendre lors de la prochaine séance.' },
  }[status];

  return (
    <div style={{ background:'#F8FAFC', height:'100%', display:'flex', flexDirection:'column' }}>
      <div className="no-scroll" style={{ overflow:'auto', flex:1 }}>
        <FicheHeader status={status} name={conf.name} worldName={`Monde ${W1info.id} — ${W1info.name}`} worldColor={W1info.color}/>

        {/* card */}
        <div style={{ margin:'-22px 14px 14px', background:'#fff', borderRadius:20, padding:'16px 16px 6px', border:'1px solid #EEF2F7' }} className="shadow-card">
          <div style={{ fontSize:11, fontWeight:800, color:'#64748B', letterSpacing:1 }}>OBJECTIF PÉDAGOGIQUE</div>
          <div style={{ fontSize:13.5, color:'#0F172A', marginTop:6, lineHeight:1.5, textWrap:'pretty' }}>{objectif}</div>

          <div style={{ marginTop:10 }}>
            <MetaRow icon={<I.bolt color="#6D5BFF" size={16}/>} label={conf.xpLabel} value={conf.xp} valueColor="#5B43E8"/>
            {status === 'done' && <MetaRow icon={<I.calendar color="#475569" size={16}/>} label="Validée le" value="12 / 05 / 2026"/>}
            {status === 'active' && <MetaRow icon={<I.sparkle color="#F59E0B"/>} label="Statut" value="En cours" valueColor="#5B43E8"/>}
            {status === 'review' && <MetaRow icon={<I.warn color="#F59E0B" size={16}/>} label="Statut" value="À retravailler" valueColor="#B45309"/>}
            <MetaRow icon={<I.trophy color="#F59E0B" size={16}/>} label="Trophée du monde" value="2 / 5"/>
          </div>
        </div>

        {/* critères */}
        <div style={{ margin:'0 14px 14px', background:'#fff', borderRadius:20, padding:'14px 16px', border:'1px solid #EEF2F7' }} className="shadow-card">
          <div style={{ fontSize:11, fontWeight:800, color:'#64748B', letterSpacing:1, marginBottom:8 }}>CRITÈRES TRAVAILLÉS</div>
          {criteres.map((c,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0' }}>
              <div style={{
                width:22, height:22, borderRadius:'50%',
                background: c.ok ? '#DCFCE7' : '#FEF3C7',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {c.ok
                  ? <I.check color="#16A34A" size={14}/>
                  : <I.warn color="#B45309" size={14}/>}
              </div>
              <div style={{ fontSize:13, color:'#0F172A', fontWeight: c.ok ? 500 : 600 }}>{c.t}</div>
            </div>
          ))}
        </div>

        {/* moniteur feedback */}
        <div style={{ margin:'0 14px 14px', background:'#fff', borderRadius:20, padding:'14px 16px', border:'1px solid #EEF2F7' }} className="shadow-card">
          <div style={{ fontSize:11, fontWeight:800, color:'#64748B', letterSpacing:1, marginBottom:10 }}>DERNIER RETOUR MONITEUR</div>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#fda4af,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:12 }}>TD</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:'#0F172A' }}>{feedback.name}</div>
              <div style={{ fontSize:12.5, color:'#475569', marginTop:3, lineHeight:1.5 }}>"{feedback.text}"</div>
              <div style={{ fontSize:10.5, color:'#94A3B8', marginTop:6 }}>Il y a 2 jours</div>
            </div>
          </div>
        </div>

        <div style={{ height:88 }}/>
      </div>

      {/* CTA */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, padding:'12px 14px 22px',
        background:'linear-gradient(180deg, rgba(248,250,252,0) 0%, rgba(248,250,252,1) 30%)' }}>
        <button style={{
          width:'100%', height:52, borderRadius:14, border:'none', cursor:'pointer',
          background: conf.actionBg, color:'#fff', fontSize:14.5, fontWeight:800,
          letterSpacing:'-0.01em', boxShadow:'0 10px 24px -10px rgba(109,91,255,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>{conf.action} <I.chevR color="#fff"/></button>
      </div>
    </div>
  );
}

Object.assign(window, { FicheCompetence });
