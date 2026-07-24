import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { C, GRAD, FONT } from "../theme";
import { Atmosphere } from "./Atmosphere";

// pseudo-aléatoire déterministe (Math.random est interdit dans Remotion)
export const rand = (i: number, s = 1) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Fond nuit-violet + halo accent + atmosphère animée (bokeh / halos / grain)
export const NightBg: React.FC<{
  children?: React.ReactNode;
  halo?: number;
  atmo?: boolean;
  bokeh?: number;
}> = ({ children, halo = 0.18, atmo = true, bokeh = 16 }) => (
  <AbsoluteFill style={{ background: GRAD.night }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(62% 42% at 50% 26%, rgba(108,99,255,${halo}), transparent 72%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 100% at 50% 100%, rgba(0,0,0,.35), transparent 55%)",
      }}
    />
    {atmo && <Atmosphere bokeh={bokeh} />}
    {children}
  </AbsoluteFill>
);

// Vignette douce
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      boxShadow: "inset 0 0 320px rgba(6,7,18,.65)",
      pointerEvents: "none",
    }}
  />
);

// Pluie de volants dorés (particules) — "cling" de bonne réponse
export const VolantRain: React.FC<{
  delay?: number;
  count?: number;
  area?: { x: number; y: number; w: number; h: number };
}> = ({ delay = 0, count = 18, area = { x: 0, y: 0, w: 1080, h: 1920 } }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const t = interpolate(frame - delay - i * 0.8, [0, 45], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.quad),
        });
        const startX = area.x + rand(i, 1) * area.w;
        const drift = (rand(i, 2) - 0.5) * 120;
        const size = 22 + rand(i, 3) * 26;
        const rot = (rand(i, 4) - 0.5) * 720 * t;
        const y = area.y - 40 + t * (area.h * 0.7);
        const op = interpolate(t, [0, 0.1, 0.8, 1], [0, 1, 1, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: startX + drift * t,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${C.goldLt}, ${C.gold} 55%, ${C.goldDk} 100%)`,
              boxShadow: `0 0 12px ${C.gold}88`,
              opacity: op,
              transform: `rotateY(${rot}deg)`,
              border: `2px solid ${C.goldPale}`,
            }}
          />
        );
      })}
    </>
  );
};

// Onde tactile violette (tap)
export const TapRipple: React.FC<{
  x: number;
  y: number;
  delay?: number;
  size?: number;
}> = ({ x, y, delay = 0, size = 240 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const op = interpolate(t, [0, 0.15, 1], [0, 0.85, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `4px solid ${C.a}`,
        boxShadow: `0 0 40px ${C.a}`,
        transform: `scale(${0.2 + t})`,
        opacity: op,
      }}
    />
  );
};

// Coche verte élastique + anneau
export const CheckBurst: React.FC<{
  delay?: number;
  size?: number;
  style?: React.CSSProperties;
}> = ({ delay = 0, size = 180, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 11, mass: 0.7, stiffness: 160 },
  });
  const ring = interpolate(frame - delay, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `${size * 0.05}px solid ${C.green}`,
          transform: `scale(${0.6 + ring * 0.9})`,
          opacity: interpolate(ring, [0, 0.4, 1], [0, 0.7, 0]),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 40% 35%, ${C.green}, ${C.greenDk} 90%)`,
          boxShadow: `0 12px 40px ${C.green}66`,
          transform: `scale(${s})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: FONT.baloo,
          fontWeight: 800,
          fontSize: size * 0.55,
        }}
      >
        ✓
      </div>
    </div>
  );
};

// Flash de transition (blanc/violet) — sur les coupes fortes
export const FlashCut: React.FC<{
  at: number;
  dur?: number;
  color?: string;
  peak?: number;
}> = ({ at, dur = 14, color = "#ffffff", peak = 0.9 }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [at, at + dur * 0.25, at + dur], [0, peak, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return (
    <AbsoluteFill
      style={{ background: color, opacity: op, pointerEvents: "none" }}
    />
  );
};

// Badge logo PermiGo (VRAIE icône : hexagone vert + P blanc)
export const LogoDot: React.FC<{
  size?: number;
  glow?: number;
  style?: React.CSSProperties;
}> = ({ size = 64, glow = 1, style }) => (
  <Img
    src={staticFile("permigo-badge-icon.png")}
    style={{
      width: size,
      height: size,
      filter: `drop-shadow(0 6px 16px ${C.green}66) drop-shadow(0 0 ${20 * glow}px ${C.green}${Math.round(
        glow * 90,
      )
        .toString(16)
        .padStart(2, "0")})`,
      ...style,
    }}
  />
);

// Lockup de marque : badge + wordmark "PermiGo"
export const BrandLogo: React.FC<{
  size?: number;
  style?: React.CSSProperties;
}> = ({ size = 56, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: size * 0.28,
      ...style,
    }}
  >
    <LogoDot size={size} />
    <span
      style={{
        fontFamily: FONT.jakarta,
        fontWeight: 800,
        fontSize: size * 0.82,
        color: "#fff",
        letterSpacing: "-.03em",
      }}
    >
      PermiGo
    </span>
  </div>
);
