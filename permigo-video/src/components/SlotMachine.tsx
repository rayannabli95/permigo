import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { C, GRAD, FONT } from "../theme";

const REEL_POOL = ["PRÊT", "GO", "🚗", "✓", "🎯", "💪", "🔥"];

const rnd = (i: number, s = 1) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Confettis courts (violet/or) autour d'un rouleau quand le badge sort
const Confetti: React.FC<{ delay: number; cx: number; cy: number }> = ({
  delay,
  cx,
  cy,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {new Array(12).fill(0).map((_, i) => {
        const t = interpolate(frame - delay, [0, 26], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (t <= 0 || t >= 1) return null;
        const ang = rnd(i, 1) * Math.PI * 2;
        const dist = 40 + rnd(i, 2) * 120;
        const x = cx + Math.cos(ang) * dist * t;
        const y = cy + Math.sin(ang) * dist * t - 30 * t;
        const gold = rnd(i, 3) > 0.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 8 + rnd(i, 4) * 8,
              height: 8 + rnd(i, 5) * 8,
              borderRadius: rnd(i, 6) > 0.5 ? "50%" : 2,
              background: gold ? C.goldLt : C.aLt,
              opacity: interpolate(t, [0, 0.2, 1], [0, 1, 0]),
              transform: `rotate(${t * 360}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

const Reel: React.FC<{
  label: string;
  stopFrame: number;
  armed: boolean;
  badgeDelay: number;
  w: number;
  h: number;
}> = ({ label, stopFrame, armed, badgeDelay, w, h }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spinning = frame < stopFrame;
  const settle = spring({
    frame: frame - stopFrame,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 220 },
  });
  const settleY = interpolate(settle, [0, 1], [-h * 0.5, 0]);
  // tremblement décroissant au verrouillage
  const sinceStop = frame - stopFrame;
  const shake =
    sinceStop >= 0
      ? Math.sin(sinceStop * 2.4) * Math.max(0, 1 - sinceStop / 7) * 5
      : 0;

  const badge = spring({
    frame: frame - badgeDelay,
    fps,
    config: { damping: 11, mass: 0.7, stiffness: 170 },
  });
  const glow = armed ? badge : 0;

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: 22,
        background: `linear-gradient(180deg, ${C.surfDark2}, #14162a)`,
        border: `2px solid ${armed ? C.a : C.boDark4}`,
        boxShadow: armed
          ? `0 0 34px ${C.a}aa, inset 0 2px 0 rgba(255,255,255,.05)`
          : "inset 0 2px 10px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.03)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${shake}px)`,
      }}
    >
      {armed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: GRAD.haloA,
            opacity: glow,
          }}
        />
      )}

      {spinning ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            transform: `translateY(${-((frame * 46) % (REEL_POOL.length * h))}px)`,
            filter: "blur(6px)",
            opacity: 0.85,
          }}
        >
          {[...REEL_POOL, ...REEL_POOL].map((t, i) => (
            <div
              key={i}
              style={{
                height: h,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.muOnDark,
                fontFamily: FONT.baloo,
                fontWeight: 700,
                fontSize: w * 0.17,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            transform: `translateY(${settleY}px)`,
            color: armed ? "rgba(255,255,255,.4)" : C.inkOnDark,
            fontFamily: FONT.baloo,
            fontWeight: 700,
            fontSize: w * 0.17,
            letterSpacing: "-.01em",
            textAlign: "center",
            padding: "0 6px",
          }}
        >
          {label}
        </div>
      )}

      {armed && (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%,-50%) scale(${badge}) rotate(-7deg)`,
              opacity: Math.min(1, badge * 1.5),
              padding: `${h * 0.09}px ${w * 0.12}px`,
              borderRadius: 16,
              background: GRAD.cta,
              color: "#fff",
              fontFamily: FONT.baloo,
              fontWeight: 800,
              fontSize: w * 0.2,
              letterSpacing: ".02em",
              boxShadow: `0 10px 26px ${C.adk}cc, inset 0 2px 0 rgba(255,255,255,.35)`,
              border: "2px solid rgba(255,255,255,.5)",
              zIndex: 4,
            }}
          >
            PRÊT
          </div>
          <Confetti delay={badgeDelay} cx={w / 2} cy={h / 2} />
        </>
      )}

      {/* reflet verre + glint mobile */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.09), transparent 30%, transparent 70%, rgba(0,0,0,.25))",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

// Ampoules le long du cadre
const Bulbs: React.FC<{ side: "l" | "r"; h: number; armed: boolean }> = ({
  side,
  h,
  armed,
}) => {
  const frame = useCurrentFrame();
  const n = 6;
  return (
    <div
      style={{
        position: "absolute",
        top: h * 0.12,
        bottom: h * 0.12,
        [side === "l" ? "left" : "right"]: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {new Array(n).fill(0).map((_, i) => {
        const on = armed
          ? 0.5 + 0.5 * Math.sin(frame / 4 - i * 0.6)
          : 0.25 + 0.25 * Math.sin(frame / 5 + i * (side === "l" ? 1 : -1));
        const col = armed ? C.aLt : C.gold;
        return (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: col,
              opacity: 0.35 + on * 0.65,
              boxShadow: `0 0 ${8 + on * 12}px ${col}`,
            }}
          />
        );
      })}
    </div>
  );
};

// Levier de machine à sous
const Lever: React.FC<{ pull: boolean; h: number }> = ({ pull, h }) => {
  const frame = useCurrentFrame();
  const p = pull
    ? interpolate(frame, [1, 6, 14], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;
  const rot = interpolate(p, [0, 1], [-16, 22]);
  return (
    <div
      style={{
        position: "absolute",
        right: -46,
        top: h * 0.28,
        transformOrigin: "bottom center",
        transform: `rotate(${rot}deg)`,
      }}
    >
      <div
        style={{
          width: 10,
          height: h * 0.4,
          background: "linear-gradient(90deg,#555,#999,#555)",
          borderRadius: 6,
          margin: "0 auto",
        }}
      />
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, #ff8a8a, ${C.red} 70%)`,
          boxShadow: `0 4px 12px rgba(0,0,0,.5)`,
          marginTop: -8,
          marginLeft: -12,
        }}
      />
    </div>
  );
};

export const SlotMachine: React.FC<{
  labels: [string, string, string];
  mode: "lottery" | "ready";
  startFrame?: number;
  width?: number;
  title?: string;
}> = ({
  labels,
  mode,
  startFrame = 0,
  width = 760,
  title = "🎰 TON MONITEUR",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 13, mass: 0.9, stiffness: 120 },
  });
  const y = interpolate(rise, [0, 1], [260, 0]);

  const reelW = width * 0.27;
  const reelH = reelW * 1.15;
  const armed = mode === "ready";

  // les rouleaux tournent puis se verrouillent ; en mode "ready" le badge PRÊT
  // surgit juste après chaque verrouillage (spin → PRÊT, effet jackpot).
  const stops = [16, 24, 32];
  const badges = armed ? [22, 30, 38] : [9999, 9999, 9999];

  // reflet qui balaie le cadre à l'entrée
  const glint = interpolate(frame - startFrame, [6, 30], [-30, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        transform: `translateY(${y}px)`,
        opacity: Math.min(1, rise * 1.4),
        width,
        padding: `${width * 0.05}px ${width * 0.06}px ${width * 0.06}px`,
        borderRadius: 34,
        background: `linear-gradient(180deg, ${C.surfDark}, #101226)`,
        border: `3px solid ${armed ? C.a : C.boDark4}`,
        boxShadow: armed
          ? `0 30px 80px rgba(8,10,26,.6), 0 0 70px ${C.a}66, inset 0 2px 0 rgba(255,255,255,.06)`
          : "0 30px 80px rgba(8,10,26,.6), inset 0 2px 0 rgba(255,255,255,.05)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* glint mobile */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(115deg, transparent ${glint - 12}%, rgba(255,255,255,.14) ${glint}%, transparent ${glint + 12}%)`,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
      <Bulbs side="l" h={width * 0.62} armed={armed} />
      <Bulbs side="r" h={width * 0.62} armed={armed} />
      <Lever pull h={reelH * 1.4} />

      <div
        style={{
          textAlign: "center",
          marginBottom: width * 0.045,
          color: armed ? C.aLt : C.muOnDark,
          fontFamily: FONT.fredoka,
          fontWeight: 700,
          fontSize: width * 0.05,
          letterSpacing: ".18em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          gap: width * 0.03,
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {labels.map((l, i) => (
          <Reel
            key={i}
            label={l}
            stopFrame={stops[i]}
            armed={armed}
            badgeDelay={badges[i]}
            w={reelW}
            h={reelH}
          />
        ))}
      </div>
    </div>
  );
};
