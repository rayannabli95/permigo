import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { C, GRAD, FONT, VIDEO } from "./theme";
import "./fonts";
import { CAIRO } from "./fonts-ar";
import {
  NightBg,
  Vignette,
  FlashCut,
  BrandLogo,
  LogoDot,
} from "./components/bits";
import { SceneShell } from "./components/SceneShell";
import { PhoneFrame } from "./components/PhoneFrame";

// ---------------------------------------------------------------------------
// Vidéo promotionnelle courte ~10 s (300 f @ 30 fps), verticale 1080×1920.
// Paramétrée par langue : fr | en | ar. Réutilise la DA existante
// (NightBg / PhoneFrame / BrandLogo / vrais écrans public/real/*).
// Aucune composition existante n'est modifiée.
// ---------------------------------------------------------------------------

export type Lang = "fr" | "en" | "ar";

type Copy = {
  hook: string[]; // lignes de l'accroche
  hookAccent: string; // mot(s) mis en couleur
  s1: string[]; // légende écran « prépare »
  s2: string[]; // légende écran « entraîne-toi »
  s3: string[]; // légende écran « fiches / quiz / situations »
  cta: string[]; // accroche finale (2 lignes)
};

const COPY: Record<Lang, Copy> = {
  fr: {
    hook: ["Chaque heure de conduite", "compte."],
    hookAccent: "compte.",
    s1: ["Prépare", "ta prochaine leçon"],
    s2: ["Entraîne-toi", "comme sur la route"],
    s3: ["Fiches · Quiz", "Mises en situation"],
    cta: ["L'appli qui te prépare", "avant chaque leçon."],
  },
  en: {
    hook: ["Every driving lesson", "counts."],
    hookAccent: "counts.",
    s1: ["Prep", "your next lesson"],
    s2: ["Train like", "you're on the road"],
    s3: ["Flashcards · Quizzes", "Real-road scenarios"],
    cta: ["The app that gets you ready", "before every lesson."],
  },
  ar: {
    hook: ["كل ساعة قيادة", "تهمّ."],
    hookAccent: "تهمّ.",
    s1: ["استعدّ", "لحصتك القادمة"],
    s2: ["تدرّب", "كأنك على الطريق"],
    s3: ["بطاقات · اختبارات", "ومواقف حقيقية"],
    cta: ["التطبيق الذي يُجهّزك", "قبل كل حصة قيادة."],
  },
};

const isAr = (lang: Lang) => lang === "ar";
const fontFor = (lang: Lang) => (isAr(lang) ? CAIRO : FONT.sf);

// --- Texte localisé : lignes empilées, mots en fondu/monté décalé -----------
// (découpe par MOTS uniquement → le façonnage arabe intra-mot reste intact ;
//  jamais de découpe par lettre pour l'arabe.)
const LocalizedText: React.FC<{
  lines: string[];
  lang: Lang;
  delay?: number;
  size: number;
  weight?: number;
  color?: string;
  accent?: string;
  accentColor?: string;
  accentGlow?: string;
  lineGap?: number;
  glow?: string;
}> = ({
  lines,
  lang,
  delay = 0,
  size,
  weight = 800,
  color = "#fff",
  accent,
  accentColor,
  accentGlow,
  lineGap = 0.14,
  glow,
}) => {
  const frame = useCurrentFrame();
  const ar = isAr(lang);
  let wordIndex = 0;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: `${size * lineGap}px`,
        fontFamily: fontFor(lang),
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: ar ? "0" : "-.02em",
        color,
        textAlign: "center",
        direction: ar ? "rtl" : "ltr",
        textShadow: glow ? `0 0 40px ${glow}` : undefined,
      }}
    >
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0 0.28em",
            direction: ar ? "rtl" : "ltr",
          }}
        >
          {line.split(" ").map((w, wi) => {
            const d = delay + wordIndex * 3;
            wordIndex += 1;
            const t = interpolate(frame - d, [0, 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const isAccent = accent != null && w === accent;
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  opacity: t,
                  transform: `translateY(${(1 - t) * 26}px)`,
                  color: isAccent ? accentColor : undefined,
                  textShadow:
                    isAccent && accentGlow
                      ? `0 0 34px ${accentGlow}`
                      : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// --- Scène 0 : accroche -----------------------------------------------------
const Hook: React.FC<{ lang: Lang }> = ({ lang }) => {
  const c = COPY[lang];
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 10) * 0.02;
  return (
    <NightBg halo={0.24} bokeh={14}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
        }}
      >
        <div style={{ transform: `scale(${pulse})` }}>
          <LocalizedText
            lines={c.hook}
            lang={lang}
            delay={6}
            size={96}
            accent={c.hookAccent}
            accentColor={C.goldLt}
            accentGlow={`${C.gold}aa`}
            glow="rgba(108,99,255,.35)"
          />
        </div>
      </AbsoluteFill>
      <FlashCut at={0} dur={12} color="#ffffff" peak={0.35} />
      <Vignette />
    </NightBg>
  );
};

// --- Scène produit : téléphone + vrai écran + légende -----------------------
const PhoneFlash: React.FC<{
  lang: Lang;
  img: string;
  lines: string[];
  glow: string;
  accentColor: string;
}> = ({ lang, img, lines, glow, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = spring({
    frame: frame - 4,
    fps,
    config: { damping: 15, mass: 1, stiffness: 110 },
  });
  const phoneY = interpolate(phone, [0, 1], [200, 0]);
  const kb = interpolate(frame, [0, 60], [1.06, 1.0], {
    extrapolateRight: "clamp",
  });

  return (
    <NightBg halo={0.2} bokeh={12}>
      {/* légende */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 150,
        }}
      >
        <LocalizedText
          lines={lines}
          lang={lang}
          delay={4}
          size={62}
          accent={lines[0].split(" ")[0]}
          accentColor={accentColor}
          accentGlow={`${accentColor}88`}
        />
      </AbsoluteFill>

      {/* téléphone + vrai écran */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 420,
          transform: `translateX(-50%) translateY(${phoneY}px)`,
          opacity: phone,
        }}
      >
        <PhoneFrame width={500} glow={glow} glossAt={8}>
          <Img
            src={staticFile(img)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              transform: `scale(${kb})`,
            }}
          />
        </PhoneFrame>
      </div>

      <FlashCut at={0} dur={12} color={glow} peak={0.4} />
      <Vignette />
    </NightBg>
  );
};

// --- Scène finale : marque + accroche + permigo.fr --------------------------
const Cta: React.FC<{ lang: Lang }> = ({ lang }) => {
  const c = COPY[lang];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = spring({
    frame: frame - 6,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 150 },
  });
  const mascot = spring({
    frame: frame - 16,
    fps,
    config: { damping: 9, mass: 0.7, stiffness: 170 },
  });
  const mascotJump =
    Math.sin(Math.max(0, frame - 16) / 6) *
    12 *
    Math.max(0, 1 - (frame - 16) / 60);
  const url = spring({
    frame: frame - 40,
    fps,
    config: { damping: 11, mass: 0.7, stiffness: 160 },
  });
  const pulse = 1 + Math.sin(frame / 9) * 0.03;

  return (
    <NightBg halo={0.22} bokeh={16}>
      {/* marque + mascotte */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 300,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            width: 900,
            height: 220,
          }}
        >
          <div
            style={{
              transform: `translateX(-60px) scale(${logo})`,
              opacity: logo,
              filter: `drop-shadow(0 0 40px ${C.green}66)`,
            }}
          >
            <BrandLogo size={112} />
          </div>
          <Img
            src={staticFile("mascot/mascot-celebrate.png")}
            style={{
              position: "absolute",
              right: 30,
              bottom: -30,
              width: 210,
              transform: `translateY(${(1 - mascot) * 120 + mascotJump}px)`,
              opacity: mascot,
              filter: "drop-shadow(0 18px 30px rgba(0,0,0,.4))",
            }}
          />
        </div>
      </AbsoluteFill>

      {/* accroche + URL */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 360,
        }}
      >
        <LocalizedText
          lines={c.cta}
          lang={lang}
          delay={20}
          size={58}
          weight={800}
          glow="rgba(108,99,255,.3)"
        />

        {/* pilule permigo.fr — toujours LTR (URL latine) */}
        <div
          style={{
            marginTop: 46,
            transform: `scale(${interpolate(url, [0, 1], [0.8, 1]) * pulse})`,
            opacity: url,
            padding: "28px 64px",
            borderRadius: 999,
            background: GRAD.cta,
            display: "flex",
            alignItems: "center",
            gap: 20,
            direction: "ltr",
            boxShadow: `0 20px 50px ${C.adk}, inset 0 2px 0 rgba(255,255,255,.35)`,
            border: "2px solid rgba(255,255,255,.35)",
          }}
        >
          <LogoDot size={54} />
          <span
            style={{
              fontFamily: FONT.sf,
              fontWeight: 800,
              fontSize: 56,
              color: "#fff",
              letterSpacing: ".01em",
            }}
          >
            permigo.fr
          </span>
        </div>
      </AbsoluteFill>

      <FlashCut at={0} dur={12} color={C.gold} peak={0.3} />
      <FlashCut at={40} dur={12} color="#ffffff" peak={0.22} />
      <Vignette />
    </NightBg>
  );
};

// --- Barre de progression (repère de story) ---------------------------------
const StoryBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, total], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        background: "rgba(255,255,255,.08)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: `${p * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${C.a}, ${C.aLt})`,
          boxShadow: `0 0 14px ${C.a}`,
        }}
      />
    </div>
  );
};

// --- Timeline (30 fps, 300 frames) ------------------------------------------
export const TEN_TOTAL_FRAMES = 300;
const OVERLAP = 8;

export const PermiGo10s: React.FC<{ lang: Lang }> = ({ lang }) => {
  const scenes: {
    node: React.ReactNode;
    from: number;
    dur: number;
    kind: "zoom" | "up" | "down";
  }[] = [
    { node: <Hook lang={lang} />, from: 0, dur: 50, kind: "zoom" },
    {
      node: (
        <PhoneFlash
          lang={lang}
          img="real/accueil.png"
          lines={COPY[lang].s1}
          glow={C.a}
          accentColor={C.aLt}
        />
      ),
      from: 50,
      dur: 56,
      kind: "up",
    },
    {
      node: (
        <PhoneFlash
          lang={lang}
          img="real/ensit-q.png"
          lines={COPY[lang].s2}
          glow={C.gold}
          accentColor={C.goldLt}
        />
      ),
      from: 106,
      dur: 54,
      kind: "zoom",
    },
    {
      node: (
        <PhoneFlash
          lang={lang}
          img="real/reviser.png"
          lines={COPY[lang].s3}
          glow={C.green}
          accentColor={C.green}
        />
      ),
      from: 160,
      dur: 52,
      kind: "down",
    },
    { node: <Cta lang={lang} />, from: 212, dur: 88, kind: "zoom" },
  ];

  return (
    <AbsoluteFill style={{ background: C.night }}>
      {scenes.map(({ node, from, dur, kind }, i) => (
        <Sequence key={i} from={from} durationInFrames={dur + OVERLAP}>
          <SceneShell kind={kind} enter={12}>
            {node}
          </SceneShell>
        </Sequence>
      ))}
      <StoryBar total={TEN_TOTAL_FRAMES} />

      {/* SFX déterministes sur les coupes */}
      <Sequence from={0} durationInFrames={20}>
        <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={50} durationInFrames={20}>
        <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={106} durationInFrames={20}>
        <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={160} durationInFrames={20}>
        <Audio src={staticFile("sfx/whoosh.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={212} durationInFrames={45}>
        <Audio src={staticFile("sfx/reward.mp3")} volume={0.7} />
      </Sequence>
    </AbsoluteFill>
  );
};

// --- Enregistrement des compositions (une par langue) -----------------------
export const TenCompositions: React.FC = () => (
  <>
    {(["fr", "en", "ar"] as Lang[]).map((lang) => (
      <Composition
        key={lang}
        id={`PermiGo10s-${lang}`}
        component={PermiGo10s}
        durationInFrames={TEN_TOTAL_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{ lang }}
      />
    ))}
  </>
);
