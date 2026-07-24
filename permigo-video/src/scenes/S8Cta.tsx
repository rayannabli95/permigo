import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { C, GRAD, FONT } from "../theme";
import { NightBg, Vignette, FlashCut, BrandLogo } from "../components/bits";
import { FadeUp, GradientText } from "../components/kinetic";

export const S8Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gold = spring({
    frame: frame - 24,
    fps,
    config: { damping: 10, mass: 0.8, stiffness: 150 },
  });
  const goldScale = interpolate(gold, [0, 1], [0.7, 1]);

  const logo = spring({
    frame: frame - 56,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 150 },
  });
  const mascot = spring({
    frame: frame - 62,
    fps,
    config: { damping: 9, mass: 0.7, stiffness: 170 },
  });
  const mascotJump =
    Math.sin(Math.max(0, frame - 62) / 6) *
    14 *
    Math.max(0, 1 - (frame - 62) / 60);

  const pulse = 1 + Math.sin(frame / 9) * 0.03;

  return (
    <NightBg halo={0.2}>
      {/* énoncé bookend */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 360,
        }}
      >
        <div
          style={{
            transform: `scale(${goldScale})`,
            opacity: Math.min(1, gold * 1.4),
            fontFamily: FONT.sf,
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: "-.02em",
            textAlign: "center",
            lineHeight: 1.14,
          }}
        >
          <GradientText
            colors={[C.goldLt, C.gold]}
            glow={`${C.gold}88`}
            sheenDelay={24}
          >
            Ta conduite commence
            <br />
            avant de monter
            <br />
            dans la voiture.
          </GradientText>
        </div>
      </AbsoluteFill>

      {/* logo + mascotte + CTA */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 330,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            width: 900,
            height: 260,
          }}
        >
          <div
            style={{
              transform: `translateX(-70px) scale(${logo})`,
              opacity: logo,
              filter: `drop-shadow(0 0 40px ${C.green}66)`,
            }}
          >
            <BrandLogo size={104} />
          </div>
          <Img
            src={staticFile("mascot/mascot-celebrate.png")}
            style={{
              position: "absolute",
              right: 0,
              bottom: -46,
              width: 240,
              transform: `translateY(${(1 - mascot) * 120 + mascotJump}px)`,
              opacity: mascot,
              filter: "drop-shadow(0 18px 30px rgba(0,0,0,.4))",
            }}
          />
        </div>

        <FadeUp delay={64} y={26} dur={12}>
          <div
            style={{
              marginTop: 30,
              padding: "30px 70px",
              borderRadius: 999,
              background: GRAD.cta,
              color: "#fff",
              fontFamily: FONT.sf,
              fontWeight: 800,
              fontSize: 48,
              transform: `scale(${pulse})`,
              boxShadow: `0 20px 50px ${C.adk}, inset 0 2px 0 rgba(255,255,255,.35)`,
              border: "2px solid rgba(255,255,255,.35)",
            }}
          >
            Prépare ta prochaine leçon →
          </div>
        </FadeUp>
        <FadeUp delay={72} y={16} dur={10}>
          <div
            style={{
              marginTop: 22,
              fontFamily: FONT.sf,
              fontWeight: 700,
              fontSize: 40,
              color: "#fff",
              letterSpacing: ".02em",
            }}
          >
            permigo.fr
          </div>
        </FadeUp>
      </AbsoluteFill>

      <FlashCut at={0} dur={10} color="#ffffff" peak={0.3} />
      <FlashCut at={56} dur={14} color={C.gold} peak={0.28} />
      <Vignette />
    </NightBg>
  );
};
