import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
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

const PHONE_W = 520;

export const S5Situation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phone = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 110 },
  });
  const phoneY = interpolate(phone, [0, 1], [200, 0]);
  const floaty = Math.sin(frame / 24) * 5;

  return (
    <NightBg halo={0.14}>
      {/* titre */}
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
              fontSize: 66,
              lineHeight: 1.1,
              color: "#fff",
              letterSpacing: "-.02em",
            }}
          >
            Tu t'entraînes à <span style={{ color: C.aLt }}>décider</span>.
          </div>
        </FadeUp>
        <FadeUp delay={10} y={16} dur={10}>
          <div
            style={{
              marginTop: 14,
              fontFamily: FONT.sf,
              fontWeight: 500,
              fontSize: 38,
              color: C.muOnDark,
            }}
          >
            De vraies situations. Pas juste réciter le code.
          </div>
        </FadeUp>
      </AbsoluteFill>

      {/* téléphone + VRAIE vidéo « En situation » (la voiture avance quand tu réponds) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 360,
          transform: `translateX(-50%) translateY(${phoneY + floaty}px)`,
          opacity: phone,
        }}
      >
        <PhoneFrame width={PHONE_W} glow={C.gold}>
          <AbsoluteFill>
            <OffthreadVideo
              src={staticFile("real/ensit-feux.mp4")}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              muted
            />
          </AbsoluteFill>
        </PhoneFrame>
      </div>

      <FlashCut at={0} dur={10} color="#ffffff" peak={0.3} />
      <Vignette />
    </NightBg>
  );
};
