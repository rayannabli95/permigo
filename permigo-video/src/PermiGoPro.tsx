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

import { S0Intro } from "./scenes/S0Intro";
import { S1bStory } from "./scenes/S1bStory";
import { PHook } from "./scenes/pro/PHook";
import { PEngage } from "./scenes/pro/PEngage";
import { PSuivi } from "./scenes/pro/PSuivi";
import { PPrepare } from "./scenes/pro/PPrepare";
import { PImage } from "./scenes/pro/PImage";
import { PCta } from "./scenes/pro/PCta";

const OVERLAP = 9;
const VO_START = 20;

// Version B2B (auto-écoles) — montage recalé sur la voix off continue (Harry).
const SCENES: {
  comp: React.FC;
  from: number;
  dur: number;
  kind: "zoom" | "up" | "down";
  shell?: boolean;
}[] = [
  { comp: S0Intro, from: 0, dur: 34, kind: "zoom", shell: false },
  { comp: PHook, from: 34, dur: 180, kind: "zoom" },
  { comp: S1bStory, from: 214, dur: 180, kind: "zoom" },
  { comp: PEngage, from: 394, dur: 210, kind: "up" },
  { comp: PSuivi, from: 604, dur: 210, kind: "zoom" },
  { comp: PPrepare, from: 814, dur: 240, kind: "up" },
  { comp: PImage, from: 1054, dur: 195, kind: "down" },
  { comp: PCta, from: 1249, dur: 371, kind: "zoom" },
];

export const PRO_TOTAL_FRAMES = 1620;

type Cue = { f: number; s: string; v?: number };
// bruitages baissés (×0.55) pour passer sous la voix
const CUES: Cue[] = [
  { f: 7, s: "reveal", v: 0.4 },
  { f: 22, s: "whoosh", v: 0.5 },
  { f: 34, s: "whoosh", v: 0.4 },
  { f: 216, s: "reveal", v: 0.4 },
  { f: 394, s: "whoosh", v: 0.4 },
  { f: 604, s: "whoosh", v: 0.4 },
  { f: 814, s: "whoosh", v: 0.4 },
  { f: 1054, s: "whoosh", v: 0.4 },
  { f: 1249, s: "whoosh", v: 0.45 },
  { f: 1275, s: "success", v: 0.45 },
];

const StoryBar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, PRO_TOTAL_FRAMES], [0, 1], {
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

export const PermiGoPro: React.FC = () => {
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
      {CUES.map((c, i) => (
        <Sequence key={`a${i}`} from={c.f}>
          <Audio
            src={staticFile(`sfx/${c.s}.mp3`)}
            volume={(c.v ?? 0.5) * 0.55}
          />
        </Sequence>
      ))}
      <Sequence from={VO_START}>
        <Audio src={staticFile("vo/autoecole.mp3")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
