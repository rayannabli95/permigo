import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";

// Mockup téléphone réaliste (bezel sombre + encoche) pour incruster les vrais écrans PermiGo.
export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  width?: number;
  glow?: string; // couleur du halo derrière
  glossAt?: number; // frame de balayage du reflet
  style?: React.CSSProperties;
}> = ({ children, width = 560, glow = C.a, glossAt = 10, style }) => {
  const frame = useCurrentFrame();
  const height = Math.round(width * 2.04);
  const radius = Math.round(width * 0.135);
  const pad = Math.round(width * 0.03);
  const gloss = interpolate(frame - glossAt, [0, 34], [-40, 150], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "relative", width, height, ...style }}>
      {/* halo */}
      <div
        style={{
          position: "absolute",
          inset: -width * 0.35,
          background: `radial-gradient(50% 45% at 50% 45%, ${glow}55 0%, transparent 70%)`,
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width,
          height,
          borderRadius: radius,
          background:
            "linear-gradient(155deg, #33375a 0%, #16182c 55%, #0b0d1a 100%)",
          padding: pad,
          boxShadow:
            "0 50px 120px rgba(8,10,26,.6), 0 8px 24px rgba(8,10,26,.5), inset 0 0 0 2px rgba(255,255,255,.07)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: radius - pad,
            overflow: "hidden",
            background: C.night,
          }}
        >
          {children}
          {/* reflet qui balaie la vitre */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(118deg, transparent ${gloss - 14}%, rgba(255,255,255,.16) ${gloss}%, transparent ${gloss + 14}%)`,
              pointerEvents: "none",
              zIndex: 15,
            }}
          />
          {/* encoche */}
          <div
            style={{
              position: "absolute",
              top: pad * 0.7,
              left: "50%",
              transform: "translateX(-50%)",
              width: width * 0.32,
              height: width * 0.05,
              background: "#000",
              borderRadius: 40,
              zIndex: 20,
            }}
          />
        </div>
      </div>
    </div>
  );
};
