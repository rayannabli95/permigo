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
import { NightBg, Vignette, TapRipple, FlashCut } from "../components/bits";
import { PhoneFrame } from "../components/PhoneFrame";
import { Tracker } from "../components/Tracker";
import { FadeUp } from "../components/kinetic";

const PHONE_W = 500;

export const S3Prepare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phone = spring({
    frame: frame - 6,
    fps,
    config: { damping: 14, mass: 1, stiffness: 110 },
  });
  const phoneY = interpolate(phone, [0, 1], [240, 0]);
  const kb = interpolate(frame, [0, 135], [1, 1.05]);
  const mascot = spring({
    frame: frame - 20,
    fps,
    config: { damping: 13, mass: 0.8, stiffness: 130 },
  });

  return (
    <NightBg halo={0.2}>
      {/* tracker persistant (la boucle produit) */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 118,
        }}
      >
        <FadeUp delay={4} y={-20} dur={12}>
          <Tracker baseLit={1} width={760} />
        </FadeUp>
      </AbsoluteFill>

      {/* titre */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 232,
        }}
      >
        <FadeUp delay={6} y={26} dur={12}>
          <div
            style={{
              width: 900,
              textAlign: "center",
              fontFamily: FONT.sf,
              fontWeight: 800,
              fontSize: 60,
              lineHeight: 1.1,
              color: "#fff",
              letterSpacing: "-.02em",
            }}
          >
            Avant de monter en voiture,
            <br />
            <span style={{ color: C.aLt }}>tu prépares ta leçon.</span>
          </div>
        </FadeUp>
      </AbsoluteFill>

      {/* téléphone + VRAI écran accueil (hero « Prépare ta leçon ») */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 430,
          transform: `translateX(-50%) translateY(${phoneY}px)`,
          opacity: phone,
        }}
      >
        <PhoneFrame width={PHONE_W} glow={C.a}>
          <Img
            src={staticFile("real/accueil.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              transform: `scale(${kb})`,
            }}
          />
          {/* CLIC sur le vrai bouton « Je me prépare » : surbrillance + doigt */}
          <div
            style={{
              position: "absolute",
              left: "8%",
              right: "26%",
              top: PHONE_W * 0.88,
              height: PHONE_W * 0.16,
              borderRadius: 20,
              boxShadow: `0 0 0 4px ${C.aLt}, 0 0 34px ${C.a}`,
              background: "rgba(255,255,255,.16)",
              opacity: interpolate(frame, [30, 36, 52], [0, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              zIndex: 14,
            }}
          />
          <TapRipple
            x={PHONE_W * 0.42}
            y={PHONE_W * 0.96}
            delay={30}
            size={210}
          />
          <div
            style={{
              position: "absolute",
              left: PHONE_W * 0.42,
              top:
                PHONE_W * 0.96 +
                interpolate(frame, [18, 28], [90, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }) +
                interpolate(frame, [30, 34, 40], [0, 16, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              fontSize: 96,
              transform: `scale(${interpolate(frame, [30, 34, 40], [1, 0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
              filter: "drop-shadow(0 8px 10px rgba(0,0,0,.5))",
              opacity: interpolate(frame, [16, 24], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              zIndex: 16,
            }}
          >
            👆
          </div>
        </PhoneFrame>
      </div>

      {/* mascotte coach qui pointe l'écran */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 10,
          transform: `translateY(${(1 - mascot) * 150}px)`,
          opacity: mascot,
          width: 320,
        }}
      >
        <Img
          src={staticFile("mascot/mascot-coach.png")}
          style={{
            width: 320,
            filter: "drop-shadow(0 20px 34px rgba(0,0,0,.4))",
          }}
        />
      </div>

      <FlashCut at={0} dur={16} color={C.aLt} peak={0.5} />
      <Vignette />
    </NightBg>
  );
};
