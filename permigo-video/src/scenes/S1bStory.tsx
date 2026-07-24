import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { NightBg, Vignette, LogoDot } from "../components/bits";
import { FadeUp, PopIn, KineticText } from "../components/kinetic";

// Positionnement / storytelling : « PermiGo, pensé et créé par des enseignants ».
// Sceau de crédibilité posé juste après le hook — respecte les moniteurs par principe.
export const S1bStory: React.FC = () => {
  const frame = useCurrentFrame();
  // anneau de crédibilité qui se dessine derrière le badge
  const ring = interpolate(frame, [4, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NightBg halo={0.24}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: -70,
              borderRadius: "50%",
              border: `2px solid ${C.green}55`,
              transform: `scale(${0.7 + ring * 0.6})`,
              opacity: interpolate(ring, [0, 0.5, 1], [0, 0.6, 0]),
            }}
          />
          <PopIn delay={2} from={0.45} damping={11}>
            <LogoDot size={220} glow={1.25} />
          </PopIn>
        </div>

        <KineticText
          text="PermiGo"
          delay={14}
          size={100}
          style={{ marginTop: 46, letterSpacing: "-.03em" }}
        />

        <FadeUp delay={24} y={20} dur={12}>
          <div
            style={{
              marginTop: 28,
              width: 900,
              textAlign: "center",
              fontFamily: FONT.sf,
              fontWeight: 700,
              fontSize: 52,
              lineHeight: 1.22,
              color: C.muOnDark,
              letterSpacing: "-.01em",
            }}
          >
            pensé et créé par
            <br />
            <span style={{ color: C.aLt }}>des enseignants du permis.</span>
          </div>
        </FadeUp>
      </AbsoluteFill>
      <Vignette />
    </NightBg>
  );
};
