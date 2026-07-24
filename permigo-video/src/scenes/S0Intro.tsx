import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { C } from "../theme";

const lerpHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const p = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${p[0]},${p[1]},${p[2]})`;
};

// Anneaux qui foncent vers nous (warp) — bord fin, glow léger (pas de scale rasterisé)
const Tunnel: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const N = 10;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {new Array(N).fill(0).map((_, i) => {
        if (frame < from) return null;
        const prog = ((((frame - from) * 0.028 + i / N) % 1) + 1) % 1;
        const size = interpolate(prog, [0, 1], [40, 2600]);
        const op = interpolate(prog, [0, 0.15, 0.8, 1], [0, 0.42, 0.36, 0]);
        const col = lerpHex(C.green, C.a, Math.min(1, prog * 1.3));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: `${interpolate(prog, [0, 1], [3, 22])}px solid ${col}`,
              opacity: op,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Bulb: React.FC<{ color: string; on: number; size: number }> = ({
  color,
  on,
  size,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background:
        on > 0.5
          ? `radial-gradient(circle at 38% 32%, #fff, ${color} 62%)`
          : "#0c0e18",
      boxShadow:
        on > 0.5
          ? `0 0 ${size * 0.4}px ${color}`
          : "inset 0 0 20px rgba(0,0,0,.8)",
      opacity: on > 0.5 ? 1 : 0.32,
    }}
  />
);

export const S0Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const red = frame >= 0 && frame < 4 ? 1 : 0.2;
  const amber = frame >= 4 && frame < 7 ? 1 : 0.2;
  const green = frame >= 7 ? 1 : 0.2;

  const feuIn = spring({
    frame,
    fps,
    config: { damping: 13, mass: 0.6, stiffness: 170 },
  });

  // push-in modéré sur le feu (pas de x16 → plus de pixels)
  const feuZoom = interpolate(frame, [8, 28], [1, 3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const feuFade = interpolate(frame, [18, 26], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // flood vert NET (radial plein écran qui grandit) — remplace le disque scalé
  const flood = interpolate(frame, [9, 27], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const r = interpolate(flood, [0, 1], [5, 165]);
  const floodOp = interpolate(frame, [8, 13], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flash = interpolate(frame, [27, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = 1 + (green > 0.5 ? Math.sin((frame - 7) / 2.5) * 0.05 : 0);

  return (
    <AbsoluteFill
      style={{
        background: "#07080f",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Tunnel from={8} />

      {/* feu tricolore, push-in modéré */}
      <div
        style={{
          transform: `scale(${feuZoom * interpolate(feuIn, [0, 1], [0.8, 1])})`,
          transformOrigin: "50% 62%",
          opacity: feuIn * feuFade,
          padding: 30,
          borderRadius: 54,
          background: "linear-gradient(180deg,#1b1e30,#0c0e18)",
          border: "4px solid #2a2e48",
          boxShadow:
            "0 30px 80px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.06)",
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <Bulb color={C.red} on={red} size={150} />
        <Bulb color={C.gold} on={amber} size={150} />
        <div style={{ transform: `scale(${pulse})` }}>
          <Bulb color={C.green} on={green} size={150} />
        </div>
      </div>

      {/* FLOOD vert net (aucun scale → aucun pixel) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 62%, #c9ffdc 0%, #4bff85 ${r * 0.32}%, ${C.green} ${r * 0.58}%, ${C.greenDk} ${r * 0.82}%, transparent ${r}%)`,
          opacity: floodOp,
          pointerEvents: "none",
        }}
      />

      {/* flash de sortie → direct le POV */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 62%, #eafff2 0%, ${C.green} 45%, transparent 82%)`,
          opacity: flash,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
