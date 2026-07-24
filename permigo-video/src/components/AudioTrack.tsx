import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

// Bruitages calés sur la timeline (vrais sons de marque PermiGo).
// Pensés pour passer SOUS une musique tendance ajoutée dans TikTok → volumes modérés.
type Cue = { f: number; s: string; v?: number };

const CUES: Cue[] = [
  // intro feu vert → zoom
  { f: 7, s: "reveal", v: 0.45 },
  { f: 22, s: "whoosh", v: 0.6 },
  // S1b storytelling (154)
  { f: 154, s: "reveal", v: 0.4 },
  // S2 « chaque heure compte » — slot → PRÊT (289)
  { f: 289, s: "whoosh", v: 0.5 },
  { f: 305, s: "click", v: 0.6 },
  { f: 313, s: "click", v: 0.6 },
  { f: 321, s: "click", v: 0.6 },
  { f: 325, s: "success", v: 0.5 },
  // S3 prépare — clic « Je me prépare » (394)
  { f: 394, s: "launch", v: 0.55 },
  { f: 424, s: "click", v: 0.6 },
  // S3b réviser (544)
  { f: 544, s: "whoosh", v: 0.5 },
  { f: 562, s: "pop", v: 0.4 },
  // S4 parcours (679)
  { f: 679, s: "whoosh", v: 0.5 },
  // S4b centre d'examen (829)
  { f: 829, s: "whoosh", v: 0.45 },
  // classement (934)
  { f: 934, s: "whoosh", v: 0.45 },
  { f: 954, s: "success", v: 0.45 },
  // S5 mise en situation (1039)
  { f: 1039, s: "whoosh", v: 0.45 },
  { f: 1084, s: "success", v: 0.5 },
  { f: 1088, s: "coin", v: 0.45 },
  // S6 payoff (1219)
  { f: 1219, s: "whoosh", v: 0.45 },
  { f: 1239, s: "success", v: 0.45 },
  // S7 débrief (1369)
  { f: 1369, s: "whoosh", v: 0.4 },
  { f: 1403, s: "pop", v: 0.4 },
  // S8 CTA (1489)
  { f: 1489, s: "whoosh", v: 0.5 },
  { f: 1513, s: "success", v: 0.5 },
];

export const AudioTrack: React.FC = () => (
  <>
    {CUES.map((c, i) => (
      <Sequence key={i} from={c.f}>
        <Audio
          src={staticFile(`sfx/${c.s}.mp3`)}
          volume={(c.v ?? 0.5) * 0.55}
        />
      </Sequence>
    ))}
  </>
);
