import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { FONT } from "../theme";

// Entrée fondu + montée douce
export const FadeUp: React.FC<{
  delay?: number;
  y?: number;
  dur?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 40, dur = 18, children, style }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        opacity: t,
        transform: `translateY(${(1 - t) * y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Pop élastique (ressort) — pour badges, jalons, mascotte
export const PopIn: React.FC<{
  delay?: number;
  from?: number;
  damping?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, from = 0.6, damping = 12, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping, mass: 0.8, stiffness: 140 },
  });
  const scale = interpolate(s, [0, 1], [from, 1]);
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity: Math.min(1, s * 1.4),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Révélation mot par mot (typo cinétique)
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = 3, style, wordStyle }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0 0.28em",
        justifyContent: "center",
        ...style,
      }}
    >
      {words.map((w, i) => {
        const d = delay + i * stagger;
        const t = interpolate(frame - d, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: t,
              transform: `translateY(${(1 - t) * 26}px)`,
              ...wordStyle,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Texte à dégradé + reflet lumineux qui balaie + glow
export const GradientText: React.FC<{
  children: React.ReactNode;
  colors?: [string, string];
  glow?: string;
  sheen?: boolean;
  sheenDelay?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  colors = ["#8e87ff", "#6c63ff"],
  glow,
  sheen = true,
  sheenDelay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const pos = sheen
    ? interpolate((frame - sheenDelay) % 90, [0, 90], [140, -40])
    : 50;
  const [c1, c2] = colors;
  return (
    <span
      style={{
        display: "inline-block",
        backgroundImage: `linear-gradient(100deg, ${c1} 0%, ${c1} 38%, #ffffff 50%, ${c2} 62%, ${c2} 100%)`,
        backgroundSize: "250% 100%",
        backgroundPositionX: `${pos}%`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        filter: glow ? `drop-shadow(0 0 26px ${glow})` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

// Révélation lettre par lettre (montée + flou) — pour mots-clés héros
export const LetterReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = 1.5, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span style={{ display: "inline-flex" }}>
      {text.split("").map((ch, i) => {
        const s = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: { damping: 13, mass: 0.6, stiffness: 180 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: s,
              transform: `translateY(${(1 - s) * 40}px)`,
              filter: `blur(${(1 - s) * 8}px)`,
              whiteSpace: "pre",
              ...style,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

// Soulignement qui se trace sous une phrase
export const UnderlineDraw: React.FC<{
  delay?: number;
  color?: string;
  height?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, color = "#8e87ff", height = 8, children, style }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      {children}
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -height - 4,
          height,
          borderRadius: height,
          background: color,
          transform: `scaleX(${t})`,
          transformOrigin: "left",
          boxShadow: `0 0 16px ${color}`,
        }}
      />
    </span>
  );
};

// Titre cinétique : chaque MOT animé séparément — courbe cubique ease-out
// (démarre vite puis ralentit) + fondu d'entrée/sortie + léger flou = mouvement
// fluide, organique, naturel. Police SF Pro.
export const KineticText: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  size?: number;
  weight?: number;
  color?: string;
  accentWords?: string[]; // mots à colorer (accent)
  accentColor?: string;
  accentGlow?: string;
  exitAt?: number; // frame (relative à la scène) où démarre le fondu de sortie
  glow?: string;
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  stagger = 2.5,
  size = 82,
  weight = 800,
  color = "#fff",
  accentWords,
  accentColor,
  accentGlow,
  exitAt,
  glow,
  style,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const norm = (s: string) => s.replace(/[.,!?;:·"'…]/g, "").toLowerCase();
  const accentSet = new Set((accentWords ?? []).map(norm));
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 0.26em",
        fontFamily: FONT.sf,
        fontWeight: weight,
        fontSize: Math.round(size * 1.16),
        lineHeight: 1.1,
        letterSpacing: "-.02em",
        color,
        textShadow: glow ? `0 0 34px ${glow}` : undefined,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const d = delay + i * stagger;
        // entrée : cubique ease-out (rapide → lent)
        const inT = interpolate(frame - d, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        // sortie : cubique ease-in, décalée mot par mot
        const outT =
          exitAt != null
            ? interpolate(frame - (exitAt + i * 1.2), [0, 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.in(Easing.cubic),
              })
            : 0;
        const opacity = inT * (1 - outT);
        const y = (1 - inT) * 30 - outT * 16;
        const acc = accentSet.has(norm(w));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${y}px)`,
              color: acc ? accentColor : undefined,
              textShadow:
                acc && accentGlow ? `0 0 34px ${accentGlow}` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Progression 0→1 via ressort (barres, compteurs)
export const useSpringProgress = (delay = 0, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: { damping, mass: 0.9, stiffness: 90 },
  });
};
