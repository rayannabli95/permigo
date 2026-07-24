import { Composition } from "remotion";
import { PermiGoTikTok, TOTAL_FRAMES } from "./PermiGoTikTok";
import { PermiGoPro, PRO_TOTAL_FRAMES } from "./PermiGoPro";
import { TenCompositions } from "./PermiGo10s";
import { VIDEO } from "./theme";

export const MyComposition = () => {
  return (
    <>
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
      <TenCompositions />
    </>
  );
};
