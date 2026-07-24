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
import { C, FONT } from "../theme";
import { NightBg, Vignette, FlashCut } from "../components/bits";
import { PhoneFrame } from "../components/PhoneFrame";
import { FadeUp } from "../components/kinetic";

const PHONE_W = 500;

export const SClassement: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phone = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 115 },
  });
  const phoneY = interpolate(phone, [0, 1], [200, 0]);
  // léger travelling vers le podium
  const pos = interpolate(frame, [0, 100], [0, 12]);

  return (
    <NightBg halo={0.18}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 150,
        }}
      >
        <FadeUp delay={2} y={24} dur={12}>
          <div
            style={{
              width: 940,
              textAlign: "center",
              fontFamily: FONT.sf,
              fontWeight: 800,
              fontSize: 64,
              lineHeight: 1.1,
              color: "#fff",
              letterSpacing: "-.02em",
            }}
          >
            Un <span style={{ color: C.aLt }}>classement</span>,
            <br />
            entre élèves.
          </div>
        </FadeUp>
        <FadeUp delay={10} y={16} dur={10}>
          <div
            style={{
              marginTop: 12,
              fontFamily: FONT.sf,
              fontWeight: 500,
              fontSize: 38,
              color: C.muOnDark,
            }}
          >
            Tu montes en révisant. Skins & récompenses à la clé.
          </div>
        </FadeUp>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 430,
          transform: `translateX(-50%) translateY(${phoneY}px)`,
          opacity: phone,
        }}
      >
        <PhoneFrame width={PHONE_W} glow={C.gold}>
          <Img
            src={staticFile("real/classement-podium.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `center ${pos}%`,
            }}
          />
        </PhoneFrame>
      </div>

      <FlashCut at={0} dur={10} color="#ffffff" peak={0.3} />
      <Vignette />
    </NightBg>
  );
};
