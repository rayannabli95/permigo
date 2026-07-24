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
import { NightBg, Vignette, FlashCut, CheckBurst } from "../components/bits";
import { FadeUp, KineticText } from "../components/kinetic";

export const S6Standard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // onde de lumière violette qui balaie
  const sweep = interpolate(frame, [8, 44], [-40, 140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mascot = spring({
    frame: frame - 14,
    fps,
    config: { damping: 13, mass: 0.8, stiffness: 130 },
  });

  return (
    <NightBg halo={0.22}>
      {/* balayage lumineux */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(115deg, transparent ${sweep - 25}%, ${C.a}44 ${sweep}%, transparent ${sweep + 25}%)`,
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 430,
        }}
      >
        <CheckBurst delay={6} size={190} style={{ marginBottom: 40 }} />

        <KineticText
          text="Tu tires le max"
          delay={2}
          size={76}
          accentWords={["le", "max"]}
          accentColor={C.aLt}
          accentGlow={`${C.a}66`}
        />
        <KineticText
          text="de chaque leçon."
          delay={12}
          size={76}
          style={{ marginTop: 4 }}
        />

        <FadeUp delay={20} y={18} dur={10}>
          <div
            style={{
              marginTop: 46,
              padding: "14px 30px",
              borderRadius: 999,
              background: "rgba(34,197,94,.14)",
              border: `1px solid ${C.green}55`,
              color: C.inkOnDark,
              fontFamily: FONT.sf,
              fontWeight: 600,
              fontSize: 38,
            }}
          >
            🤝 Et ton moniteur adore un élève préparé.
          </div>
        </FadeUp>
      </AbsoluteFill>

      {/* mascotte qui pointe */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: -10,
          transform: `translateY(${(1 - mascot) * 150}px)`,
          opacity: mascot,
          width: 330,
        }}
      >
        <Img
          src={staticFile("mascot/mascot-pointing.png")}
          style={{
            width: 330,
            filter: "drop-shadow(0 20px 34px rgba(0,0,0,.45))",
          }}
        />
      </div>

      <FlashCut at={0} dur={12} color={C.a} peak={0.45} />
      <Vignette />
    </NightBg>
  );
};
