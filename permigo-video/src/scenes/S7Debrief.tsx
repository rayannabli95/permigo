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
import { NightBg, Vignette, FlashCut } from "../components/bits";
import { Tracker } from "../components/Tracker";
import { FadeUp } from "../components/kinetic";

export const S7Debrief: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const card = spring({
    frame: frame - 8,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 120 },
  });
  const cardY = interpolate(card, [0, 1], [80, 0]);
  const breath = 1 + Math.sin(frame / 26) * 0.008;

  const swipe = interpolate(frame - 34, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const press = spring({
    frame: frame - 62,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });
  const pressScale = interpolate(press, [0, 1], [0.94, 1]);

  return (
    <NightBg halo={0.16}>
      {/* tracker qui se remplit (payoff Zeigarnik) */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 118,
        }}
      >
        <Tracker baseLit={0} cascade={{ start: 18, stagger: 12 }} width={760} />
      </AbsoluteFill>

      {/* titre */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 236,
        }}
      >
        <FadeUp delay={2} y={22} dur={12}>
          <div
            style={{
              width: 920,
              textAlign: "center",
              fontFamily: FONT.sf,
              fontWeight: 800,
              fontSize: 56,
              lineHeight: 1.12,
              color: "#fff",
              letterSpacing: "-.02em",
            }}
          >
            Après la leçon, tu débriefes.
            <br />
            <span style={{ color: C.aLt }}>Sans culpabiliser.</span>
          </div>
        </FadeUp>
      </AbsoluteFill>

      {/* carte débrief claire */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          transform: `translateX(-50%) translateY(${cardY}px) scale(${breath})`,
          opacity: card,
          width: 760,
          padding: "44px 44px 40px",
          borderRadius: 40,
          background: "linear-gradient(180deg, #ffffff, #f8f9fd)",
          boxShadow: "0 40px 90px rgba(8,10,26,.55)",
          border: `1px solid ${C.bo}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 24,
          }}
        >
          <Img
            src={staticFile("mascot/mascot-hello-remastered.png")}
            style={{ width: 150 }}
          />
          <div
            style={{
              fontFamily: FONT.fredoka,
              fontWeight: 600,
              fontSize: 40,
              color: C.a,
            }}
          >
            Revenons sur ta leçon
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT.sf,
            fontWeight: 700,
            fontSize: 46,
            lineHeight: 1.22,
            color: C.ink,
            letterSpacing: "-.01em",
            marginBottom: 40,
          }}
        >
          2-3 leçons sur un giratoire,{" "}
          <span
            style={{
              position: "relative",
              padding: "0 12px",
              color: swipe > 0.5 ? "#fff" : C.ink,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 2,
                bottom: 2,
                width: `${swipe * 100}%`,
                background: C.green,
                borderRadius: 10,
                boxShadow: `0 6px 16px ${C.green}55`,
              }}
            />
            <span style={{ position: "relative" }}>c'est NORMAL.</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: "24px 0",
              borderRadius: 22,
              border: `2.5px solid ${C.a}`,
              color: C.a,
              fontFamily: FONT.sf,
              fontWeight: 700,
              fontSize: 40,
              background: "#fff",
            }}
          >
            Consolide encore
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: "24px 0",
              borderRadius: 22,
              background: GRAD.cta,
              color: "#fff",
              fontFamily: FONT.sf,
              fontWeight: 800,
              fontSize: 40,
              transform: `scale(${pressScale})`,
              boxShadow:
                press > 0.1
                  ? `0 0 0 6px ${C.a}33, 0 14px 30px ${C.adk}88`
                  : "0 14px 30px rgba(74,63,201,.4)",
            }}
          >
            Prépare la suite
          </div>
        </div>
      </div>

      <FlashCut at={0} dur={10} color="#ffffff" peak={0.28} />
      <Vignette />
    </NightBg>
  );
};
