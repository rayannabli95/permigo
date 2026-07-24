import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";

const STEPS = ["Préparer", "Conduire", "Débriefer", "Consolider"];

// Tracker persistant de la boucle produit.
// baseLit = nb d'étapes allumées d'office ; cascade = allumage progressif (payoff s7).
export const Tracker: React.FC<{
  baseLit?: number;
  cascade?: { start: number; stagger: number };
  width?: number;
  style?: React.CSSProperties;
}> = ({ baseLit = 1, cascade, width = 720, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        width,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "16px 24px",
        borderRadius: 999,
        background: "rgba(31,34,56,.82)",
        border: `1px solid ${C.boDark}`,
        backdropFilter: "blur(6px)",
        boxShadow: "0 10px 30px rgba(8,10,26,.4)",
        ...style,
      }}
    >
      {STEPS.map((s, i) => {
        const litByCascade = cascade
          ? frame >= cascade.start + i * cascade.stagger
          : false;
        const lit = i < baseLit || litByCascade;
        const pop = spring({
          frame: frame - (cascade ? cascade.start + i * cascade.stagger : 0),
          fps,
          config: { damping: 12, mass: 0.6, stiffness: 200 },
        });
        const scale = cascade && litByCascade ? pop : 1;
        return (
          <React.Fragment key={s}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  transform: `scale(${lit ? 0.9 + scale * 0.2 : 1})`,
                  background: lit
                    ? `radial-gradient(circle at 35% 30%, ${C.aLt}, ${C.a} 70%)`
                    : "transparent",
                  border: lit ? "none" : `2px solid ${C.boDark4}`,
                  boxShadow: lit ? `0 0 16px ${C.a}aa` : "none",
                }}
              />
              <div
                style={{
                  fontFamily: FONT.fredoka,
                  fontWeight: 600,
                  fontSize: 22,
                  color: lit ? "#fff" : C.muOnDark,
                  letterSpacing: "-.01em",
                }}
              >
                {s}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 26,
                  height: 3,
                  borderRadius: 2,
                  background:
                    i < baseLit - 1 ||
                    (cascade && frame >= cascade.start + i * cascade.stagger)
                      ? C.a
                      : C.boDark4,
                  marginBottom: 26,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
