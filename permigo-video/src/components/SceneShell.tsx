import React from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from "remotion";

// Enveloppe de scène : entrée en fondu + léger zoom + flou (cross-dissolve cinéma).
// Pas de sortie : les Sequences se chevauchent, l'entrante se fond PAR-DESSUS la sortante.
export const SceneShell: React.FC<{
  children: React.ReactNode;
  enter?: number;
  kind?: "zoom" | "up" | "down";
}> = ({ children, enter = 12, kind = "zoom" }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, enter], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const scale = kind === "zoom" ? interpolate(t, [0, 1], [1.07, 1]) : 1;
  const ty = kind === "up" ? (1 - t) * 70 : kind === "down" ? (1 - t) * -70 : 0;
  const blur = (1 - t) * 10;
  return (
    <AbsoluteFill
      style={{
        opacity: t,
        transform: `scale(${scale}) translateY(${ty}px)`,
        filter: `blur(${blur}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
