import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../../theme";
import { NightBg, Vignette, BrandLogo } from "../../components/bits";
import { FadeUp, KineticText } from "../../components/kinetic";

// Accroche B2B sérieuse (auto-écoles / gérants) — ton « vous », zéro slang.
export const PHook: React.FC = () => {
  return (
    <NightBg halo={0.18}>
      <BrandLogo
        size={48}
        style={{ position: "absolute", top: 58, left: 56 }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          paddingLeft: 70,
          paddingRight: 70,
        }}
      >
        <FadeUp delay={2} y={16} dur={10}>
          <div
            style={{
              fontFamily: FONT.sf,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: ".22em",
              color: C.aLt,
              marginBottom: 46,
            }}
          >
            POUR LES AUTO-ÉCOLES
          </div>
        </FadeUp>

        <KineticText text="Et si vos élèves" delay={10} size={82} />
        <KineticText
          text="arrivaient préparés"
          delay={22}
          size={82}
          color={C.aLt}
          glow={`${C.a}66`}
          style={{ marginTop: 8 }}
        />
        <KineticText
          text="à chaque leçon ?"
          delay={34}
          size={82}
          style={{ marginTop: 22 }}
        />
      </AbsoluteFill>

      <Vignette />
    </NightBg>
  );
};
