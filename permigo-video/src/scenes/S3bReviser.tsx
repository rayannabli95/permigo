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
import { C, GRAD, FONT } from "../theme";
import { NightBg, Vignette, FlashCut } from "../components/bits";
import { PhoneFrame } from "../components/PhoneFrame";
import { FadeUp } from "../components/kinetic";

const PHONE_W = 500;
const CHIPS = [
  "🕹️ Mise en situation",
  "🎯 Examen blanc",
  "📇 Fiches de révision",
  "🔎 Trouve la faute",
];

const Chip: React.FC<{ label: string; i: number; delay: number }> = ({
  label,
  i,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 13, mass: 0.6, stiffness: 150 },
  });
  return (
    <div
      style={{
        transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`,
        opacity: Math.min(1, s * 1.4),
        alignSelf: i % 2 === 0 ? "flex-start" : "flex-end",
        padding: "16px 26px",
        borderRadius: 999,
        background: i % 2 === 0 ? GRAD.cta : "rgba(31,34,56,.9)",
        border: `1px solid ${i % 2 === 0 ? "rgba(255,255,255,.3)" : C.boDark}`,
        color: "#fff",
        fontFamily: FONT.sf,
        fontWeight: 700,
        fontSize: 40,
        boxShadow:
          i % 2 === 0
            ? `0 12px 28px ${C.adk}aa`
            : "0 8px 20px rgba(8,10,26,.4)",
      }}
    >
      {label}
    </div>
  );
};

export const S3bReviser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 115 },
  });

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
            Tout pour <span style={{ color: C.aLt }}>t'entraîner</span>.
          </div>
        </FadeUp>
      </AbsoluteFill>

      {/* phone : vrai hub Réviser (entre depuis la gauche) */}
      <div
        style={{
          position: "absolute",
          left: interpolate(enter, [0, 1], [-260, 90]),
          top: 360,
          opacity: enter,
        }}
      >
        <PhoneFrame width={PHONE_W} glow={C.a}>
          <Img
            src={staticFile("real/reviser.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </PhoneFrame>
      </div>

      {/* chips des outils (droite) */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 470,
          width: 420,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {CHIPS.map((c, i) => (
          <Chip key={i} label={c} i={i} delay={16 + i * 8} />
        ))}
      </div>

      <FlashCut at={0} dur={10} color="#ffffff" peak={0.3} />
      <Vignette />
    </NightBg>
  );
};
