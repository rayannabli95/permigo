import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

const rnd = (i: number, s = 1) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Particules bokeh qui flottent en parallax (déterministe)
const Bokeh: React.FC<{ count?: number }> = ({ count = 16 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const baseX = rnd(i, 1) * 1080;
        const baseY = rnd(i, 2) * 1920;
        const size = 12 + rnd(i, 3) * 80;
        const speed = 0.15 + rnd(i, 4) * 0.5;
        const phase = rnd(i, 5) * Math.PI * 2;
        const driftX = Math.sin(frame / (60 / speed) + phase) * 40;
        const driftY = -((frame * speed) % 2100) + (rnd(i, 6) - 0.2) * 200;
        const gold = rnd(i, 7) > 0.72;
        const op = 0.06 + rnd(i, 8) * 0.16;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: baseX + driftX,
              top: baseY + driftY,
              width: size,
              height: size,
              borderRadius: "50%",
              background: gold
                ? `radial-gradient(circle at 40% 35%, ${C.goldLt}, transparent 70%)`
                : `radial-gradient(circle at 40% 35%, ${C.aLt}, transparent 70%)`,
              opacity: op,
              filter: `blur(${2 + rnd(i, 9) * 6}px)`,
            }}
          />
        );
      })}
    </>
  );
};

// Halos de lumière qui dérivent lentement (profondeur)
const LightBlobs: React.FC = () => {
  const frame = useCurrentFrame();
  const a = Math.sin(frame / 90);
  const b = Math.cos(frame / 120);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 120 + a * 90,
          top: 260 + b * 70,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.a}22, transparent 65%)`,
          filter: "blur(50px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 60 - a * 70,
          bottom: 220 + b * 90,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.gold}18, transparent 65%)`,
          filter: "blur(60px)",
        }}
      />
    </>
  );
};

// Grain film (texture) — SVG feTurbulence, léger, mix overlay
const Grain: React.FC = () => (
  <svg
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity: 0.05,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }}
  >
    <filter id="permigoGrain">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.85"
        numOctaves="2"
        stitchTiles="stitch"
      />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#permigoGrain)" />
  </svg>
);

export const Atmosphere: React.FC<{ bokeh?: number }> = ({ bokeh = 16 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <LightBlobs />
    <Bokeh count={bokeh} />
    <Grain />
  </AbsoluteFill>
);
