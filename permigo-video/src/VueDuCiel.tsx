import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { C } from "./theme";

/**
 * Les 6 gestes qu'aucune photo vue du siège ne montre : la distance, la place
 * dans la voie, l'écart au cycliste, la trajectoire, l'insertion, le créneau.
 *
 * Le fond est une image générée SANS aucune lueur. Tout ce qui est violet et
 * lumineux ici est tracé par Remotion, et se dessine dans le temps. C'est le
 * geste qui s'anime, jamais le décor.
 */

// Le format des fiches est vertical 2:3, pas le 9:16 des pubs.
export const CIEL = { width: 1000, height: 1500, fps: 30 } as const;
export const CIEL_FRAMES = 90; // 3 s

type Trace =
  | { type: "bande"; x: number; y1: number; y2: number; w: number }
  | { type: "bandeH"; y: number; x1: number; x2: number; h: number }
  | {
      type: "duo";
      y: number;
      h: number;
      g: [number, number];
      d: [number, number];
    }
  | {
      type: "duoV";
      x: number;
      w: number;
      h: [number, number];
      b: [number, number];
    }
  | { type: "chemin"; d: string; w: number };

export type SceneCiel = {
  id: string;
  fond: string;
  titre: string;
  trace: Trace;
};

// Coordonnées exprimées en % du cadre, donc indépendantes de la résolution
// du fond : si on regénère une image plus grande, rien ne bouge.
export const SCENES_CIEL: SceneCiel[] = [
  {
    id: "distance",
    fond: "ciel/distance.jpg",
    titre: "La distance de sécurité",
    // Les deux voitures sont sur le même axe vertical : la bande remplit
    // exactement le vide entre le pare-chocs arrière du gris et le nez du violet.
    trace: { type: "bande", x: 50, y1: 29, y2: 70, w: 16 },
  },
  {
    id: "position",
    fond: "ciel/position.jpg",
    titre: "Ta place dans la voie",
    // Deux bras de MÊME longueur : c'est l'égalité qui porte le message.
    trace: { type: "duo", y: 52, h: 2.6, g: [34, 42], d: [58, 71] },
  },
  {
    id: "cycliste",
    fond: "ciel/cycliste.jpg",
    titre: "L'écart au cycliste",
    trace: { type: "bandeH", y: 64, x1: 45, x2: 65, h: 6.5 },
  },
  {
    id: "virage",
    fond: "ciel/virage.jpg",
    titre: "La trajectoire d'un virage",
    // La trace part du CAPOT et monte : la voiture entre dans le virage, elle
    // n'en sort pas. Elle reste entre la ligne du milieu et le bord droit.
    trace: {
      type: "chemin",
      // Milieu de voie relevé sur le fond, tous les ~150 px de hauteur :
      // (52.6,83.3) (62.2,73.3) (70,63.3) (74,53.3) (73.8,43.3) (68.7,33.3)
      // (61.5,25.3) (48.5,17.3) (34.8,12) (21,8) (14,6).
      d: "M 57 78 C 61 74, 67 68, 70 63 C 73 57, 74 48, 74 43 C 73.5 39, 71 36, 69 33 C 66.5 29.5, 64 27, 61 25 C 57 21.5, 52.5 19, 48 17 C 43.5 15, 39 13.3, 35 12 C 30 11, 25 10, 15 8.4",
      w: 3.4,
    },
  },
  {
    id: "insertion",
    fond: "ciel/insertion.jpg",
    titre: "L'espace pour t'insérer",
    trace: { type: "bande", x: 58, y1: 41, y2: 61, w: 13 },
  },
  {
    id: "creneau",
    fond: "ciel/creneau.jpg",
    titre: "Le créneau",
    // Deux marges de même hauteur, devant et derrière : la voiture est centrée.
    trace: { type: "duoV", x: 76, w: 17, h: [33, 36.4], b: [63.6, 67] },
  },
];

/** Le tracé se dessine, respire, puis s'efface pour que la boucle soit lisse. */
const useAvance = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // 0 → 1 sur la première seconde, après quoi la ligne est entière et pulse.
  const tire = interpolate(frame, [6, 6 + fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const souffle = 0.82 + 0.18 * Math.sin((frame / fps) * Math.PI * 1.1);
  // ⚠️ La vidéo tourne en boucle : sans ce fondu, le retour à zéro fait un
  // à-coup et le tracé « pop » d'un coup au redémarrage.
  const sortie = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames - 2],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  return { tire, souffle, sortie };
};

const Bande: React.FC<{
  trace: Trace;
  tire: number;
  souffle: number;
  sortie: number;
}> = ({ trace, tire, souffle, sortie }) => {
  // 🔴 Tant que rien n'est tiré, on ne dessine RIEN. Sinon le bout arrondi du
  // tracé laisse un point violet isolé posé sur la route, qui ressemble à un bug.
  if (tire <= 0.004 || sortie <= 0.004) return null;
  // ⚠️ Une SEULE ombre portée. Deux drop-shadow empilés sur un cadre de cette
  // taille faisaient crasher le navigateur de rendu autour de la frame 73.
  const halo = `drop-shadow(0 0 ${22 * souffle}px ${C.aLt})`;

  if (trace.type === "bande") {
    // Une bande verticale qui se remplit du bas vers le haut.
    const h = (trace.y2 - trace.y1) * tire;
    return (
      <rect
        x={trace.x - trace.w / 2}
        y={trace.y2 - h}
        width={trace.w}
        height={h}
        rx={trace.w / 2}
        fill={C.aLt}
        fillOpacity={(0.42 * souffle + 0.28) * sortie}
        stroke={C.aLt}
        strokeWidth={0.5}
        style={{ filter: halo }}
      />
    );
  }

  if (trace.type === "bandeH") {
    // Une bande horizontale qui se remplit de la voiture vers le cycliste.
    const w = (trace.x2 - trace.x1) * tire;
    return (
      <rect
        x={trace.x1}
        y={trace.y - trace.h / 2}
        width={w}
        height={trace.h}
        rx={trace.h / 2}
        fill={C.aLt}
        fillOpacity={(0.42 * souffle + 0.28) * sortie}
        style={{ filter: halo }}
      />
    );
  }

  if (trace.type === "duo") {
    // Deux traits de la même longueur, qui partent ensemble : c'est l'égalité
    // des deux écarts qui porte le message, pas leur valeur.
    const bras = ([a, b]: [number, number], sens: 1 | -1) => {
      const l = (b - a) * tire;
      const x = sens === 1 ? a : b - l;
      return (
        <rect
          x={x}
          y={trace.y - trace.h / 2}
          width={l}
          height={trace.h}
          rx={trace.h / 2}
          fill={C.aLt}
          fillOpacity={(0.42 * souffle + 0.3) * sortie}
          style={{ filter: halo }}
        />
      );
    };
    return (
      <>
        {bras(trace.g, -1)}
        {bras(trace.d, 1)}
      </>
    );
  }

  if (trace.type === "duoV") {
    // Deux marges verticales de même hauteur, devant et derrière la voiture.
    const bras = ([a, b]: [number, number], sens: 1 | -1) => {
      const l = (b - a) * tire;
      const y = sens === 1 ? b - l : a;
      return (
        <rect
          x={trace.x - trace.w / 2}
          y={y}
          width={trace.w}
          height={l}
          rx={Math.min(trace.w, l) / 2}
          fill={C.aLt}
          fillOpacity={(0.42 * souffle + 0.3) * sortie}
          style={{ filter: halo }}
        />
      );
    };
    return (
      <>
        {bras(trace.h, 1)}
        {bras(trace.b, -1)}
      </>
    );
  }

  // chemin : un tracé qui se dessine grâce à stroke-dasharray
  return (
    <path
      d={trace.d}
      fill="none"
      stroke={C.aLt}
      strokeWidth={trace.w}
      strokeLinecap="round"
      strokeOpacity={(0.55 * souffle + 0.4) * sortie}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - tire}
      style={{ filter: halo }}
    />
  );
};

export const VueDuCiel: React.FC<{ scene: SceneCiel }> = ({ scene }) => {
  const { tire, souffle, sortie } = useAvance();
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <Img
        src={staticFile(scene.fond)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
        >
          <Bande
            trace={scene.trace}
            tire={tire}
            souffle={souffle}
            sortie={sortie}
          />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
