import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, GRAD, FONT } from "../../theme";
import { NightBg, Vignette, FlashCut, BrandLogo } from "../../components/bits";
import { FadeUp, KineticText } from "../../components/kinetic";

// CTA contact B2B : téléphone + site + devis. Sobre, sérieux, coordonnées lisibles.
const Row: React.FC<{
  icon: string;
  value: string;
  delay: number;
  strong?: boolean;
}> = ({ icon, value, delay, strong }) => (
  <FadeUp delay={delay} y={18} dur={10}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        padding: "20px 40px",
        borderRadius: 22,
        background: "rgba(255,255,255,.05)",
        border: `1px solid ${strong ? C.aLt + "88" : "rgba(255,255,255,.10)"}`,
        boxShadow: strong ? `0 0 34px ${C.a}33` : "none",
        minWidth: 640,
      }}
    >
      <div style={{ fontSize: 44 }}>{icon}</div>
      <div
        style={{
          fontFamily: FONT.sf,
          fontWeight: 800,
          fontSize: strong ? 62 : 46,
          color: "#fff",
          letterSpacing: strong ? ".01em" : "-.01em",
        }}
      >
        {value}
      </div>
    </div>
  </FadeUp>
);

export const PCta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = spring({
    frame: frame - 2,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 150 },
  });
  const pulse = 1 + Math.sin(frame / 9) * 0.025;

  return (
    <NightBg halo={0.22}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 210,
        }}
      >
        <div
          style={{
            transform: `scale(${logo})`,
            opacity: logo,
            filter: `drop-shadow(0 0 40px ${C.green}66)`,
          }}
        >
          <BrandLogo size={96} />
        </div>

        <KineticText
          text="Offrez cette longueur"
          delay={12}
          size={62}
          style={{ marginTop: 44 }}
        />
        <KineticText
          text="d'avance à vos élèves."
          delay={18}
          size={62}
          style={{ marginTop: 4 }}
        />

        <div
          style={{
            marginTop: 60,
            display: "flex",
            flexDirection: "column",
            gap: 22,
            alignItems: "center",
          }}
        >
          <Row icon="📞" value="06 02 12 53 87" delay={26} strong />
          <Row icon="🌐" value="permigo.fr" delay={34} />
        </div>

        <FadeUp delay={46} y={20} dur={12}>
          <div
            style={{
              marginTop: 50,
              padding: "26px 66px",
              borderRadius: 999,
              background: GRAD.cta,
              color: "#fff",
              fontFamily: FONT.sf,
              fontWeight: 800,
              fontSize: 46,
              transform: `scale(${pulse})`,
              boxShadow: `0 20px 50px ${C.adk}, inset 0 2px 0 rgba(255,255,255,.35)`,
              border: "2px solid rgba(255,255,255,.35)",
            }}
          >
            Demandez votre devis →
          </div>
        </FadeUp>
      </AbsoluteFill>

      <FlashCut at={0} dur={10} color="#ffffff" peak={0.28} />
      <Vignette />
    </NightBg>
  );
};
