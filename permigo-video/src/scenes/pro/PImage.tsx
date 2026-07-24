import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../../theme";
import { NightBg, Vignette, FlashCut } from "../../components/bits";
import { FadeUp, KineticText } from "../../components/kinetic";

// Argument 4 : différenciation / image moderne — psychologie du gérant.
export const PImage: React.FC = () => {
  return (
    <NightBg halo={0.2}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          paddingLeft: 70,
          paddingRight: 70,
        }}
      >
        <KineticText text="Une auto-école" delay={2} size={82} />
        <KineticText
          text="moderne."
          delay={12}
          size={82}
          color={C.aLt}
          glow={`${C.a}66`}
          style={{ marginTop: 4 }}
        />

        <FadeUp delay={20} y={18} dur={12}>
          <div
            style={{
              marginTop: 40,
              width: 900,
              textAlign: "center",
              fontFamily: FONT.sf,
              fontWeight: 500,
              fontSize: 42,
              lineHeight: 1.35,
              color: C.muOnDark,
            }}
          >
            Qui rassure, engage
            <br />
            et fidélise ses élèves.
          </div>
        </FadeUp>
      </AbsoluteFill>

      <FlashCut at={0} dur={12} color={C.a} peak={0.3} />
      <Vignette />
    </NightBg>
  );
};
