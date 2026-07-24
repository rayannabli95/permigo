import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT } from "../../theme";
import { NightBg, Vignette } from "../../components/bits";
import { PhoneFrame } from "../../components/PhoneFrame";
import { FadeUp, KineticText } from "../../components/kinetic";

const PHONE_W = 470;

// Argument 1 : élèves motivés/engagés — ils bossent même hors de la voiture.
export const PEngage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = spring({
    frame: frame - 6,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 110 },
  });
  const phoneY = interpolate(phone, [0, 1], [220, 0]);

  return (
    <NightBg halo={0.16}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 150,
        }}
      >
        <KineticText
          text="Des élèves motivés."
          delay={2}
          size={68}
          accentWords={["motivés"]}
          accentColor={C.aLt}
        />
        <FadeUp delay={14} y={18} dur={12}>
          <div
            style={{
              marginTop: 18,
              width: 900,
              textAlign: "center",
              fontFamily: FONT.sf,
              fontWeight: 500,
              fontSize: 40,
              lineHeight: 1.3,
              color: C.muOnDark,
            }}
          >
            Ils travaillent leur conduite,
            <br />
            même entre deux leçons.
          </div>
        </FadeUp>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 470,
          transform: `translateX(-50%) translateY(${phoneY}px)`,
          opacity: phone,
        }}
      >
        <PhoneFrame width={PHONE_W} glow={C.a}>
          <Img
            src={staticFile("real/reviser.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </PhoneFrame>
      </div>

      <Vignette />
    </NightBg>
  );
};
