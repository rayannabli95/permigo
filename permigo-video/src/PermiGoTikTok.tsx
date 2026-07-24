import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { C } from "./theme";
import "./fonts";
import { SceneShell } from "./components/SceneShell";
import { AudioTrack } from "./components/AudioTrack";

import { S0Intro } from "./scenes/S0Intro";
import { S1Hook } from "./scenes/S1Hook";
import { S1bStory } from "./scenes/S1bStory";
import { S2Loterie } from "./scenes/S2Loterie";
import { S3Prepare } from "./scenes/S3Prepare";
import { S3bReviser } from "./scenes/S3bReviser";
import { S4Parcours } from "./scenes/S4Parcours";
import { S4bCentre } from "./scenes/S4bCentre";
import { SClassement } from "./scenes/SClassement";
import { S5Situation } from "./scenes/S5Situation";
import { S6Standard } from "./scenes/S6Standard";
import { S7Debrief } from "./scenes/S7Debrief";
import { S8Cta } from "./scenes/S8Cta";

const OVERLAP = 9; // chevauchement pour le fondu enchaîné

// timeline (30 fps) — from = début du contenu ; la séquence dure `dur + OVERLAP`
// pour rester sous la scène suivante pendant son fondu d'entrée.
const SCENES: {
  comp: React.FC;
  from: number;
  dur: number;
  kind: "zoom" | "up" | "down";
  shell?: boolean;
}[] = [
  { comp: S0Intro, from: 0, dur: 34, kind: "zoom", shell: false },
  { comp: S1Hook, from: 34, dur: 120, kind: "zoom" },
  { comp: S1bStory, from: 154, dur: 135, kind: "zoom" },
  { comp: S2Loterie, from: 289, dur: 105, kind: "up" },
  { comp: S3Prepare, from: 394, dur: 150, kind: "zoom" },
  { comp: S3bReviser, from: 544, dur: 135, kind: "up" },
  { comp: S4Parcours, from: 679, dur: 150, kind: "zoom" },
  { comp: S4bCentre, from: 829, dur: 105, kind: "down" },
  { comp: SClassement, from: 934, dur: 105, kind: "zoom" },
  { comp: S5Situation, from: 1039, dur: 180, kind: "zoom" },
  { comp: S6Standard, from: 1219, dur: 150, kind: "up" },
  { comp: S7Debrief, from: 1369, dur: 120, kind: "down" },
  { comp: S8Cta, from: 1489, dur: 165, kind: "zoom" },
];

// Voix off continue (Harry) — le montage est recalé dessus.
export const TOTAL_FRAMES = 1654;
const VO_START = 24;

const StoryBar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, TOTAL_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        background: "rgba(255,255,255,.08)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: `${p * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${C.a}, ${C.aLt})`,
          boxShadow: `0 0 14px ${C.a}`,
        }}
      />
    </div>
  );
};

export const PermiGoTikTok: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.night }}>
      {SCENES.map(({ comp: Comp, from, dur, kind, shell = true }, i) => (
        <Sequence key={i} from={from} durationInFrames={dur + OVERLAP}>
          {shell ? (
            <SceneShell kind={kind} enter={12}>
              <Comp />
            </SceneShell>
          ) : (
            <Comp />
          )}
        </Sequence>
      ))}
      <StoryBar />
      <AudioTrack />
      <Sequence from={VO_START}>
        <Audio src={staticFile("vo/eleve.mp3")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
