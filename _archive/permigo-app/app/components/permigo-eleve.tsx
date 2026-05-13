"use client";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
  cubicBezier,
} from "framer-motion";
import { useRef, useMemo } from "react";

const easeIntoFocus = cubicBezier(0.22, 1, 0.36, 1);
const easeOutOfFocus = cubicBezier(0, 0, 0.58, 1);
const focusEase = [easeIntoFocus, easeOutOfFocus] as const;

type Competence = {
  id: number;
  axeId: number;
  name: string;
  desc: string;
  icon: React.ReactNode;
  unlocked: boolean;
};

type Axe = {
  id: number;
  name: string;
  color: string;
};

const AXES: Axe[] = [
  { id: 1, name: "Maîtriser le Véhicule", color: "#FF6B6B" },
  { id: 2, name: "Appréhender la Route", color: "#25D9D9" },
  { id: 3, name: "Partager la Route", color: "#FFE066" },
  { id: 4, name: "Maintenir sa Concentration", color: "#D7A3FF" },
  { id: 5, name: "Mobilité Citoyenne", color: "#95E1D3" },
];

const COMPETENCES: Competence[] = [
  { id: 1, axeId: 1, name: "Démarrage & Arrêt", desc: "Maîtrise du moteur", icon: "🏁", unlocked: false },
  { id: 2, axeId: 1, name: "Volant & Direction", desc: "Contrôle du véhicule", icon: "🎡", unlocked: false },
  { id: 3, axeId: 1, name: "Maîtrise des Pédales", desc: "Accélérateur & freinage", icon: "🦶", unlocked: true },
  { id: 4, axeId: 1, name: "Boîte de Vitesse", desc: "Manuel/Automatique", icon: "⚙️", unlocked: false },
  { id: 5, axeId: 1, name: "Stationnement", desc: "Ligne & créneau", icon: "🅿️", unlocked: true },

  { id: 6, axeId: 2, name: "Panneaux & Signalisation", desc: "Lecture des panneaux", icon: "🛑", unlocked: false },
  { id: 7, axeId: 2, name: "Adaptation Météo", desc: "Pluie, neige, nuit", icon: "🌧️", unlocked: false },
  { id: 8, axeId: 2, name: "Circulation Urbaine", desc: "Carrefours & feux", icon: "🚦", unlocked: true },
  { id: 9, axeId: 2, name: "Route de Campagne", desc: "Routes non urbaines", icon: "🛣️", unlocked: false },
  { id: 10, axeId: 2, name: "Autoroute", desc: "Vitesses élevées", icon: "🛣️", unlocked: false },

  { id: 11, axeId: 3, name: "Priorités & Cédez", desc: "Règles de priorité", icon: "👑", unlocked: false },
  { id: 12, axeId: 3, name: "Distances de Sécurité", desc: "Espacements corrects", icon: "📏", unlocked: false },
  { id: 13, axeId: 3, name: "Rétroviseurs", desc: "Monitoring 360°", icon: "🔍", unlocked: true },
  { id: 14, axeId: 3, name: "Piétons & Cyclistes", desc: "Protection des usagers", icon: "🚶", unlocked: false },
  { id: 15, axeId: 3, name: "Communication", desc: "Signalisation active", icon: "🚨", unlocked: false },

  { id: 16, axeId: 4, name: "Distractions", desc: "Rester concentré", icon: "🎯", unlocked: false },
  { id: 17, axeId: 4, name: "Vigilance", desc: "Attention routière", icon: "👀", unlocked: true },
  { id: 18, axeId: 4, name: "Fatigue", desc: "Reconnaître les signes", icon: "😴", unlocked: false },
  { id: 19, axeId: 4, name: "Temps de Réaction", desc: "Rapidité de réponse", icon: "⚡", unlocked: false },

  { id: 20, axeId: 5, name: "Éco-Conduite", desc: "Efficiency énergétique", icon: "🌱", unlocked: false },
  { id: 21, axeId: 5, name: "Entretien Véhicule", desc: "Maintenance & vérifications", icon: "🔧", unlocked: false },
  { id: 22, axeId: 5, name: "Assurance & Docs", desc: "Papiers obligatoires", icon: "📄", unlocked: false },
  { id: 23, axeId: 5, name: "Transport & Passagers", desc: "Équipement & sécurité", icon: "👥", unlocked: false },
];

const CompetenceCard = ({ comp, side, progress }: { comp: Competence; side: "L" | "R"; progress: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start 80%", "center 50%", "end 20%"],
  });

  const reduce = useReducedMotion();
  const sign = side === "L" ? -1 : 1;
  const axe = AXES[comp.axeId - 1];

  // Animations
  const blur = useTransform(p, [0, 0.5, 1], [12, 0, 12], { ease: focusEase });
  const bright = useTransform(p, [0, 0.5, 1], [0.6, 1, 0.6], { ease: focusEase });
  const ty = useTransform(p, [0, 0.5, 1], ["60px", "0px", "-60px"], { ease: focusEase });
  const tz = useTransform(p, [0, 0.5, 1], [200, 0, 200], { ease: focusEase });
  const rx = useTransform(p, [0, 0.5, 1], [25, 0, -25], { ease: focusEase });
  const rot = useTransform(p, [0, 0.5, 1], [-sign * 8, 0, sign * 8], { ease: focusEase });
  const scale = useTransform(p, [0, 0.5, 1], [0.85, 1, 0.85], { ease: focusEase });

  const filter = useMotionTemplate`blur(${blur}px) brightness(${bright})`;
  const bgColor = comp.unlocked ? axe.color : "#E8EBF0";
  const borderColor = comp.unlocked ? "#FFD700" : "transparent";

  if (reduce) {
    return (
      <div
        ref={ref}
        className="relative w-full aspect-square rounded-2xl overflow-hidden"
        style={{ backgroundColor: bgColor, borderColor, borderWidth: "3px" }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <div className="text-5xl mb-3">{comp.icon}</div>
          <h3 className="font-bold text-white text-sm">{comp.name}</h3>
          <p className="text-xs text-white/70 mt-1">{comp.desc}</p>
          {comp.unlocked && <div className="absolute top-3 right-3 text-2xl">✓</div>}
          {!comp.unlocked && <div className="absolute top-3 right-3 text-xl">🔒</div>}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        perspective: 1200,
        backgroundColor: bgColor,
        borderColor,
        borderWidth: "3px",
        filter,
        y: ty,
        z: tz,
        rotateX: rx,
        rotateZ: rot,
        scale,
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity"
        style={{ backgroundColor: axe.color }} />

      {/* Content */}
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative z-10">
        <motion.div className="text-6xl mb-4 drop-shadow-lg">{comp.icon}</motion.div>
        <h3 className="font-bold text-sm md:text-base text-white drop-shadow">{comp.name}</h3>
        <p className="text-xs text-white/80 mt-2 drop-shadow">{comp.desc}</p>

        {/* Status badge */}
        {comp.unlocked && (
          <motion.div
            className="absolute top-3 right-3 text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            ✓
          </motion.div>
        )}
        {!comp.unlocked && (
          <div className="absolute top-3 right-3 text-xl">🔒</div>
        )}
      </div>

      {/* Grayscale overlay when locked */}
      {!comp.unlocked && (
        <div className="absolute inset-0 bg-black/20 z-5" />
      )}
    </motion.div>
  );
};

export default function PermiGoEleve() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  // Yellow progress bar
  const progressScaleX = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const unlockedCount = useMemo(() => COMPETENCES.filter(c => c.unlocked).length, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-y-scroll overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 scroll-smooth"
    >
      {/* Yellow scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-yellow-400 z-50 origin-left"
        style={{ scaleX: progressScaleX }}
      />

      {/* Header */}
      <section className="relative flex h-screen flex-col items-center justify-center px-6 text-center">
        <motion.h1
          className="text-5xl md:text-7xl font-black bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          PermiGo
        </motion.h1>
        <motion.p
          className="mt-4 max-w-md text-lg text-slate-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Votre route vers la maîtrise du permis
        </motion.p>
        <motion.div
          className="mt-8 px-6 py-3 bg-red-100 rounded-full text-red-600 font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {unlockedCount}/23 compétences débloquées
        </motion.div>
        <motion.p
          className="mt-8 text-sm text-slate-500"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ↓ Scrollez vers le bas ↓
        </motion.p>
      </section>

      {/* Grid */}
      <div className="mx-auto w-full max-w-3xl px-6 pb-[20vh] pt-[10vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {COMPETENCES.map((comp, i) => (
            <div
              key={comp.id}
              className={i % 2 === 1 ? "md:mt-12" : ""}
            >
              <CompetenceCard
                comp={comp}
                side={i % 2 === 0 ? "L" : "R"}
                progress={scrollYProgress}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <section className="relative flex h-screen flex-col items-center justify-center px-6 text-center bg-gradient-to-t from-slate-900 to-slate-800">
        <motion.h2 className="text-4xl font-bold text-white">
          Bravo! 🎓
        </motion.h2>
        <motion.p className="mt-4 max-w-md text-lg text-slate-300">
          Vous avez {unlockedCount}/23 compétences déverrouillées.
        </motion.p>
        <motion.button
          className="mt-8 px-8 py-3 bg-yellow-400 text-slate-900 font-bold rounded-lg hover:bg-yellow-300 transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continuer votre progression →
        </motion.button>
      </section>
    </div>
  );
}
