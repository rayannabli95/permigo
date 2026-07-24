import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT } from "../theme";
import { NightBg, Vignette, BrandLogo } from "../components/bits";
import { KineticText } from "../components/kinetic";

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mascot = spring({
    frame: frame - 52,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 130 },
  });
  const qWobble = Math.sin(frame / 8) * 6;

  return (
    <NightBg halo={0.16}>
      {/* marque toujours présente — badge vert */}
      <BrandLogo
        size={52}
        style={{ position: "absolute", top: 60, left: 56 }}
      />

      {/* accroche (question) */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "column",
          paddingTop: 500,
        }}
      >
        <KineticText text="Et si chaque heure" delay={4} size={82} />
        <KineticText
          text="de conduite"
          delay={16}
          size={82}
          color={C.aLt}
          glow={`${C.a}88`}
          style={{ marginTop: 6 }}
        />
        <KineticText
          text="comptait vraiment ?"
          delay={28}
          size={82}
          style={{ marginTop: 6 }}
        />
      </AbsoluteFill>

      {/* mascotte pensive + ? */}
      <div
        style={{
          position: "absolute",
          bottom: 150,
          left: "50%",
          transform: `translateX(-50%) translateY(${(1 - mascot) * 120}px)`,
          opacity: mascot,
          width: 460,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT.fredoka,
            fontWeight: 700,
            fontSize: 120,
            color: C.a,
            transform: `rotate(${qWobble}deg)`,
            textShadow: `0 0 34px ${C.a}77`,
            marginBottom: -10,
          }}
        >
          ?
        </div>
        <Img
          src={staticFile("mascot/mascot-think.png")}
          style={{
            width: 460,
            filter: "drop-shadow(0 24px 40px rgba(108,99,255,.35))",
          }}
        />
      </div>

      <Vignette />
    </NightBg>
  );
};
