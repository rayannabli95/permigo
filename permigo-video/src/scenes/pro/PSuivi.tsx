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

// Argument 3 (le plus B2B) : suivre l'engagement de chaque élève (vue moniteur réelle).
const Tag: React.FC<{ label: string; color: string; delay: number }> = ({
  label,
  color,
  delay,
}) => (
  <FadeUp delay={delay} y={14} dur={10}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 22px",
        borderRadius: 999,
        background: `${color}1f`,
        border: `1px solid ${color}66`,
        fontFamily: FONT.sf,
        fontWeight: 700,
        fontSize: 28,
        color: "#fff",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
      {label}
    </div>
  </FadeUp>
);

export const PSuivi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = spring({
    frame: frame - 6,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 110 },
  });
  const phoneY = interpolate(phone, [0, 1], [220, 0]);

  return (
    <NightBg halo={0.18}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 130,
        }}
      >
        <KineticText
          text="Vous suivez leur engagement."
          delay={2}
          size={66}
          accentWords={["engagement"]}
          accentColor={C.aLt}
        />

        <div
          style={{
            marginTop: 26,
            display: "flex",
            gap: 16,
            justifyContent: "center",
          }}
        >
          <Tag label="Déterminé" color={C.aLt} delay={12} />
          <Tag label="Régulier" color="#2dd4bf" delay={16} />
          <Tag label="Décroche" color={C.orange} delay={20} />
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 480,
          transform: `translateX(-50%) translateY(${phoneY}px)`,
          opacity: phone,
        }}
      >
        <PhoneFrame width={PHONE_W} glow={C.a}>
          <Img
            src={staticFile("real/moniteur-engagement.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </PhoneFrame>
      </div>

      <Vignette />
    </NightBg>
  );
};
