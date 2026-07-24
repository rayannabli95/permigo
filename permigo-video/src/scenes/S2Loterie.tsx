import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { NightBg, Vignette } from "../components/bits";
import { FadeUp, KineticText } from "../components/kinetic";
import { SlotMachine } from "../components/SlotMachine";

export const S2Loterie: React.FC = () => {
  return (
    <NightBg halo={0.14}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 300,
        }}
      >
        <KineticText text="Une heure de conduite," delay={2} size={72} />
        <KineticText
          text="ça compte."
          delay={11}
          size={72}
          color={C.goldLt}
          style={{ marginTop: 4 }}
        />
        <FadeUp delay={10} y={16} dur={10}>
          <div
            style={{
              marginTop: 16,
              fontFamily: FONT.sf,
              fontWeight: 500,
              fontSize: 40,
              color: C.muOnDark,
            }}
          >
            Prépare-toi, profite de chaque minute.
          </div>
        </FadeUp>

        <div style={{ marginTop: 90 }}>
          <SlotMachine
            labels={["PRÊT", "PRÊT", "PRÊT"]}
            mode="ready"
            title="🎰 ES-TU PRÊT ?"
            startFrame={2}
            width={820}
          />
        </div>
      </AbsoluteFill>
      <Vignette />
    </NightBg>
  );
};
