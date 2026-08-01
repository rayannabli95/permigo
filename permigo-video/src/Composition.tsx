import { Composition } from "remotion";
import { PermiGoTikTok, TOTAL_FRAMES } from "./PermiGoTikTok";
import { PermiGoPro, PRO_TOTAL_FRAMES } from "./PermiGoPro";
import { TenCompositions } from "./PermiGo10s";
import { LaSituation, LASITU_TOTAL } from "./LaSituation";
import { MatchCutTest, MATCHCUT_TOTAL } from "./MatchCutTest";
import { CarteUnlock, CARTE_UNLOCK_TOTAL } from "./CarteUnlock";
import { VIDEO } from "./theme";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="MatchCutTest"
        component={MatchCutTest}
        durationInFrames={MATCHCUT_TOTAL}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="LaSituation"
        component={LaSituation}
        durationInFrames={LASITU_TOTAL}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="PermiGoTikTok"
        component={PermiGoTikTok}
        durationInFrames={TOTAL_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="PermiGoPro"
        component={PermiGoPro}
        durationInFrames={PRO_TOTAL_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="CarteUnlock"
        component={CarteUnlock}
        durationInFrames={CARTE_UNLOCK_TOTAL}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{
          img: "cartes/c4c.webp",
          name: "Conduite éco-responsable",
          world: "As du Volant",
          tint: "#eab308",
          idx: 27,
        }}
      />
      <TenCompositions />
    </>
  );
};
