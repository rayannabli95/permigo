// --- PermiGo Élève Component ---
"use client";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
  cubicBezier,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const easeIntoFocus = cubicBezier(0.22, 1, 0.36, 1);
const easeOutOfFocus = cubicBezier(0, 0, 0.58, 1);
const focusEase = [easeIntoFocus, easeOutOfFocus] as const;

type Competence = {
  id: number;
  axeId: number;
  axeName: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  unlocked: boolean;
};

type Axe = {
  id: number;
  name: string;
  color: string;
  colorGradient: string;
};

const AXES: Axe[] = [
  { id: 1, name: "Maîtriser le Véhicule", color: "#FF6B6B", colorGradient: "from-[#FF6B6B] to-[#FF8585]" },
  { id: 2, name: "Appréhender la Route", color: "#25D9D9", colorGradient: "from-[#25D9D9] to-[#1ABC9C]" },
  { id: 3, name: "Partager la Route", color: "#FFE066", colorGradient: "from-[#FFE066] to-[#FFD700]" },
  { id: 4, name: "Maintenir sa Concentration", color: "#D7A3FF", colorGradient: "from-[#D7A3FF] to-[#C66FE2]" },
  { id: 5, name: "Mobilité Citoyenne", color: "#95E1D3", colorGradient: "from-[#95E1D3] to-[#7FD9B8]" },
];

const COMPETENCES: Competence[] = [
  // AXE 1
  { id: 1, axeId: 1, axeName: "Axe 1", name: "Démarrage & Arrêt", desc: "Maîtrise du moteur", icon: <VehicleIcon />, unlocked: false },
  { id: 2, axeId: 1, axeName: "Axe 1", name: "Volant & Direction", desc: "Contrôle du véhicule", icon: <SteeringIcon />, unlocked: false },
  { id: 3, axeId: 1, axeName: "Axe 1", name: "Maîtrise des Pédales", desc: "Accélérateur & freinage", icon: <PedalsIcon />, unlocked: true },
  { id: 4, axeId: 1, axeName: "Axe 1", name: "Boîte de Vitesse", desc: "Manuel/Automatique", icon: <GearIcon />, unlocked: false },
  { id: 5, axeId: 1, axeName: "Axe 1", name: "Stationnement", desc: "Ligne & créneau", icon: <ParkingIcon />, unlocked: true },

  // AXE 2
  { id: 6, axeId: 2, axeName: "Axe 2", name: "Panneaux & Signalisation", desc: "Lecture des panneaux", icon: <SignsIcon />, unlocked: false },
  { id: 7, axeId: 2, axeName: "Axe 2", name: "Adaptation Météo", desc: "Pluie, neige, nuit", icon: <WeatherIcon />, unlocked: false },
  { id: 8, axeId: 2, axeName: "Axe 2", name: "Circulation Urbaine", desc: "Carrefours & feux", icon: <CityIcon />, unlocked: true },
  { id: 9, axeId: 2, axeName: "Axe 2", name: "Routes Nationales", desc: "Vitesse & dépassement", icon: <HighwayIcon />, unlocked: false },
  { id: 10, axeId: 2, axeName: "Axe 2", name: "Autoroute", desc: "Entrée & changement voie", icon: <FreewayIcon />, unlocked: false },

  // AXE 3
  { id: 11, axeId: 3, axeName: "Axe 3", name: "Priorité & Cédez-le", desc: "Règles de priorité", icon: <PriorityIcon />, unlocked: false },
  { id: 12, axeId: 3, axeName: "Axe 3", name: "Distance de Sécurité", desc: "Espacement correct", icon: <DistanceIcon />, unlocked: false },
  { id: 13, axeId: 3, axeName: "Axe 3", name: "Rétroviseurs & Angles", desc: "Vérification complète", icon: <MirrorIcon />, unlocked: true },
  { id: 14, axeId: 3, axeName: "Axe 3", name: "Respect Piétons & Vélos", desc: "Usagers vulnérables", icon: <PedestrianIcon />, unlocked: false },
  { id: 15, axeId: 3, axeName: "Axe 3", name: "Communication", desc: "Signalisation avec autrui", icon: <CommunicationIcon />, unlocked: false },

  // AXE 4
  { id: 16, axeId: 4, axeName: "Axe 4", name: "Absence Distractions", desc: "Téléphone & passagers", icon: <FocusIcon />, unlocked: false },
  { id: 17, axeId: 4, axeName: "Axe 4", name: "Vigilance Durée", desc: "Attention prolongée", icon: <VigilanceIcon />, unlocked: true },
  { id: 18, axeId: 4, axeName: "Axe 4", name: "Gestion Fatigue & Émotions", desc: "Bien-être du conducteur", icon: <FatigueIcon />, unlocked: false },
  { id: 19, axeId: 4, axeName: "Axe 4", name: "Réaction Danger", desc: "Décision rapide", icon: <ReactionIcon />, unlocked: false },

  // AXE 5
  { id: 20, axeId: 5, axeName: "Axe 5", name: "Éco-Conduite", desc: "Économie carburant", icon: <EcoDrivingIcon />, unlocked: false },
  { id: 21, axeId: 5, axeName: "Axe 5", name: "Entretien Basique", desc: "Maintenance simple", icon: <MaintenanceIcon />, unlocked: false },
  { id: 22, axeId: 5, axeName: "Axe 5", name: "Assurance & Responsabilité", desc: "Cadre légal", icon: <InsuranceIcon />, unlocked: false },
  { id: 23, axeId: 5, axeName: "Axe 5", name: "Transport Alternatif", desc: "Mobilité écologique", icon: <TransportIcon />, unlocked: false },
];

// SVG Icons
function VehicleIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="20" y="35" width="60" height="35" rx="4" opacity="0.2"/>
      <circle cx="30" cy="65" r="4"/>
      <circle cx="70" cy="65" r="4"/>
      <rect x="25" y="40" width="50" height="12" rx="2" opacity="0.3"/>
    </svg>
  );
}

function SteeringIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <path d="M50 20 L70 70 L30 70 Z" opacity="0.2"/>
      <path d="M50 30 L65 65 L35 65 Z" opacity="0.4" stroke="white" strokeWidth="2"/>
      <circle cx="50" cy="50" r="8" opacity="0.3"/>
    </svg>
  );
}

function PedalsIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="15" y="25" width="70" height="50" rx="4" opacity="0.2"/>
      <line x1="30" y1="40" x2="30" y2="65" stroke="white" strokeWidth="2"/>
      <line x1="50" y1="35" x2="50" y2="70" stroke="white" strokeWidth="2"/>
      <line x1="70" y1="40" x2="70" y2="65" stroke="white" strokeWidth="2"/>
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="2" opacity="0.3"/>
      <path d="M50 22 L50 78" stroke="white" strokeWidth="2" opacity="0.3"/>
      <path d="M22 50 L78 50" stroke="white" strokeWidth="2" opacity="0.3"/>
    </svg>
  );
}

function ParkingIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="20" y="30" width="60" height="40" rx="4" opacity="0.2"/>
      <circle cx="30" cy="60" r="3"/>
      <circle cx="70" cy="60" r="3"/>
    </svg>
  );
}

function SignsIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="30" y="25" width="40" height="50" rx="3" opacity="0.2" stroke="white" strokeWidth="2"/>
      <line x1="50" y1="35" x2="50" y2="65" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}

function WeatherIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <path d="M30 30 Q50 20 70 30 L70 70 Q50 60 30 70 Z" opacity="0.2"/>
      <path d="M35 40 L65 40" stroke="white" strokeWidth="1.5" opacity="0.6"/>
    </svg>
  );
}

function CityIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="20" y="35" width="15" height="30" rx="2" opacity="0.2"/>
      <rect x="42" y="30" width="15" height="35" rx="2" opacity="0.3"/>
      <rect x="64" y="40" width="15" height="25" rx="2" opacity="0.2"/>
    </svg>
  );
}

function HighwayIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <path d="M20 50 L80 50" stroke="white" strokeWidth="3" opacity="0.4"/>
      <circle cx="35" cy="50" r="4"/>
      <circle cx="65" cy="50" r="4"/>
    </svg>
  );
}

function FreewayIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <path d="M15 50 L85 50" stroke="white" strokeWidth="2" opacity="0.3"/>
      <path d="M30 40 L70 40" stroke="white" strokeWidth="2" opacity="0.4"/>
      <polygon points="50,25 60,45 40,45" opacity="0.2"/>
    </svg>
  );
}

function PriorityIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <circle cx="50" cy="50" r="25" opacity="0.2" stroke="white" strokeWidth="2"/>
      <line x1="50" y1="25" x2="50" y2="75" stroke="white" strokeWidth="2" opacity="0.5"/>
    </svg>
  );
}

function DistanceIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="25" y="35" width="50" height="30" rx="4" opacity="0.2"/>
      <line x1="35" y1="45" x2="65" y2="45" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}

function MirrorIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <circle cx="50" cy="50" r="20" opacity="0.2"/>
      <path d="M35 45 L45 55 L65 35" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function PedestrianIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <circle cx="35" cy="50" r="10" opacity="0.3"/>
      <circle cx="65" cy="50" r="10" opacity="0.3"/>
    </svg>
  );
}

function CommunicationIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <circle cx="40" cy="50" r="12" opacity="0.3"/>
      <circle cx="60" cy="50" r="12" opacity="0.3"/>
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="25" y="30" width="50" height="40" rx="3" opacity="0.2"/>
      <circle cx="35" cy="45" r="3" opacity="0.5"/>
      <circle cx="65" cy="45" r="3" opacity="0.5"/>
    </svg>
  );
}

function VigilanceIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <circle cx="50" cy="50" r="22" fill="none" stroke="white" strokeWidth="2" opacity="0.4"/>
      <circle cx="50" cy="50" r="8" opacity="0.3"/>
    </svg>
  );
}

function FatigueIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <ellipse cx="50" cy="50" rx="20" ry="25" opacity="0.2"/>
      <path d="M35 40 Q50 35 65 40" stroke="white" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function ReactionIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <polygon points="50,20 75,80 25,80" opacity="0.2" stroke="white" strokeWidth="2"/>
    </svg>
  );
}

function EcoDrivingIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <path d="M50 25 L70 35 L65 55 L35 55 L30 35 Z" opacity="0.2"/>
    </svg>
  );
}

function MaintenanceIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="25" y="25" width="50" height="50" rx="4" opacity="0.2"/>
    </svg>
  );
}

function InsuranceIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="30" y="35" width="40" height="30" rx="2" opacity="0.2" stroke="white" strokeWidth="2"/>
    </svg>
  );
}

function TransportIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="white">
      <rect x="20" y="35" width="60" height="30" rx="3" opacity="0.2"/>
    </svg>
  );
}

// CompetenceTile Component with 3D Tilt
function CompetenceTile({
  competence,
  axe,
  index,
}: {
  competence: Competence;
  axe: Axe;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const reduce = useReducedMotion();
  const side = index % 2 === 0 ? -1 : 1;

  const blur = useTransform(p, [0, 0.5, 1], [8, 0, 8], { ease: focusEase });
  const bright = useTransform(p, [0, 0.5, 1], [0, 1, 0], { ease: focusEase });
  const contrast = useTransform(p, [0, 0.5, 1], [4, 1, 4], { ease: focusEase });
  const ty = useTransform(p, [0, 0.5, 1], ["100%", "0%", "-100%"], { ease: focusEase });
  const tz = useTransform(p, [0, 0.5, 1], [300, 0, 300], { ease: focusEase });
  const rx = useTransform(p, [0, 0.5, 1], [70, 0, -70], { ease: focusEase });
  const tx = useTransform(p, [0, 0.5, 1], [`${side * 40}%`, "0%", `${side * 40}%`], { ease: focusEase });
  const rot = useTransform(p, [0, 0.5, 1], [-side * 5, 0, side * 5], { ease: focusEase });
  const sk = useTransform(p, [0, 0.5, 1], [side * 20, 0, -side * 20], { ease: focusEase });

  const filter = useMotionTemplate`blur(${blur}px) brightness(${bright}) contrast(${contrast})`;

  if (reduce) {
    return (
      <div ref={ref} className="relative z-10">
        <div
          className={`relative w-full p-6 rounded-2xl bg-gradient-to-br ${axe.colorGradient} border-4 border-white shadow-lg overflow-hidden`}
        >
          <div className="flex items-center justify-center h-32 mb-3">
            {competence.icon}
          </div>
          <h3 className="font-bold text-white text-sm">{competence.name}</h3>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className="relative z-10"
      style={{ perspective: 900, willChange: "transform" }}
    >
      <motion.div
        className="relative w-full overflow-hidden will-change-[filter,transform]"
        style={{
          borderRadius: "16px",
          filter,
          x: tx,
          y: ty,
          z: tz,
          rotate: rot,
          rotateX: rx,
          skewX: sk,
        }}
      >
        <motion.div
          className={`relative w-full p-6 bg-gradient-to-br ${axe.colorGradient} border-4 border-white shadow-lg overflow-hidden`}
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-white opacity-0 mix-blend-overlay" />

          {/* Content */}
          <div className="relative">
            <div className="text-xs font-bold text-white opacity-70 mb-2 tracking-widest">
              {competence.axeName}
            </div>
            <div className="flex items-center justify-center h-32 mb-4">
              {competence.icon}
            </div>
            <h3 className="font-bold text-white text-sm leading-tight mb-1">
              {competence.name}
            </h3>
            <p className="text-xs text-white opacity-80">{competence.desc}</p>

            {/* Badge */}
            {competence.unlocked && (
              <motion.div
                className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                <span className="text-white font-bold">✓</span>
              </motion.div>
            )}

            {!competence.unlocked && (
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-lg">🔒</span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Main Component
export function PermiGoEleveScrollTilt() {
  const unlockedCount = COMPETENCES.filter(c => c.unlocked).length;

  return (
    <main className="relative w-full min-h-screen bg-gradient-to-b from-yellow-50 via-blue-50 to-white overflow-x-hidden">
      {/* Header */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-red-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent">
            PermiGo
          </h1>
          <p className="mt-3 text-gray-600 text-lg">
            Votre route vers la maîtrise du permis
          </p>
          <div className="mt-6 inline-block px-4 py-2 bg-gradient-to-r from-red-100 to-cyan-100 rounded-full border border-red-300">
            <span className="text-2xl font-bold text-red-500">{unlockedCount}</span>
            <span className="text-gray-700 ml-2">/23 compétences débloquées</span>
          </div>
        </motion.div>

        <motion.p
          className="mt-8 text-gray-600 max-w-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Montez l'écran et regardez vos compétences se transformer en 3D
        </motion.p>
      </section>

      {/* Grid avec ScrollTilt */}
      <section className="relative w-full mx-auto px-6 py-20 max-w-5xl">
        <div className="grid grid-cols-2 gap-8 md:gap-12">
          {COMPETENCES.map((competence, index) => {
            const axe = AXES.find(a => a.id === competence.axeId)!;
            return (
              <div key={competence.id} className={index % 2 === 1 ? "mt-12" : ""}>
                <CompetenceTile
                  competence={competence}
                  axe={axe}
                  index={index}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] px-6 text-center pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Continuez votre progression
          </h2>
          <p className="mt-4 text-gray-600 max-w-md mx-auto">
            Chaque compétence débloquée est une étape vers l'excellence
          </p>
          <motion.button
            className="mt-8 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Voir mon progrès
          </motion.button>
        </motion.div>
      </section>
    </main>
  );
}

export default PermiGoEleveScrollTilt;
