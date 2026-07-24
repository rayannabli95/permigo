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
import { C, FONT } from "../theme";
import { NightBg, Vignette, FlashCut } from "../components/bits";
import { PhoneFrame } from "../components/PhoneFrame";
import { Tracker } from "../components/Tracker";
import { FadeUp } from "../components/kinetic";

const PHONE_W = 500;
const IMG_RATIO = 5727 / 1170; // parcours road très haut

export const S4Parcours: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 120 },
  });

  // scroll du parcours : du HAUT vers le BAS (la route avance) + léger zoom
  const screenW = PHONE_W - 30;
  const imgH = screenW * IMG_RATIO;
  const screenH = Math.round(PHONE_W * 2.04) - 30;
  const maxScroll = imgH - screenH;
  const scroll = interpolate(frame, [8, 132], [0, maxScroll], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const zoom = interpolate(frame, [0, 132], [1.0, 1.06]);

  return (
    <NightBg halo={0.16}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 118,
        }}
      >
        <Tracker baseLit={1} width={760} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 236,
        }}
      >
        <FadeUp delay={4} y={24} dur={12}>
          <div
            style={{
              width: 900,
              textAlign: "center",
              fontFamily: FONT.sf,
              fontWeight: 800,
              fontSize: 62,
              lineHeight: 1.1,
              color: "#fff",
              letterSpacing: "-.02em",
            }}
          >
            Tu sais <span style={{ color: C.aLt }}>exactement</span>
            <br />
            où tu en es.
          </div>
        </FadeUp>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 430,
          transform: `translateX(-50%) translateY(${interpolate(enter, [0, 1], [200, 0])}px)`,
          opacity: enter,
        }}
      >
        <PhoneFrame width={PHONE_W} glow={C.a}>
          <AbsoluteFill style={{ overflow: "hidden" }}>
            <Img
              src={staticFile("real/parcours-road.png")}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${-scroll}px) scale(${zoom})`,
                transformOrigin: "top center",
              }}
            />
          </AbsoluteFill>
        </PhoneFrame>
      </div>

      <FlashCut at={0} dur={10} color="#ffffff" peak={0.32} />
      <Vignette />
    </NightBg>
  );
};
