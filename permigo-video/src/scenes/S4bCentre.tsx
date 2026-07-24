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
const CHIPS = ["Cergy", "Argenteuil", "Bobigny", "+ ton centre"];

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
    config: { damping: 13, mass: 0.6, stiffness: 160 },
  });
  return (
    <div
      style={{
        transform: `scale(${s})`,
        opacity: Math.min(1, s * 1.4),
        padding: "12px 24px",
        borderRadius: 999,
        background: "rgba(245,158,11,.16)",
        border: `1.5px solid ${C.gold}88`,
        color: "#fff",
        fontFamily: FONT.fredoka,
        fontWeight: 600,
        fontSize: 30,
      }}
    >
      📍 {label}
    </div>
  );
};

export const S4bCentre: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 115 },
  });

  return (
    <NightBg halo={0.16}>
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
              fontSize: 60,
              lineHeight: 1.1,
              color: "#fff",
              letterSpacing: "-.02em",
            }}
          >
            Connais ton <span style={{ color: C.gold }}>centre d'examen</span>.
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
            Le terrain, les pièges, l'accès — avant le jour J.
          </div>
        </FadeUp>

        {/* chips centres */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
            width: 820,
          }}
        >
          {CHIPS.map((c, i) => (
            <Chip key={i} label={c} i={i} delay={16 + i * 6} />
          ))}
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 500,
          transform: `translateX(-50%) translateY(${interpolate(enter, [0, 1], [200, 0])}px)`,
          opacity: enter,
        }}
      >
        <PhoneFrame width={PHONE_W} glow={C.gold}>
          <Img
            src={staticFile("real/centre-examen.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </PhoneFrame>
      </div>

      <FlashCut at={0} dur={10} color="#ffffff" peak={0.3} />
      <Vignette />
    </NightBg>
  );
};
