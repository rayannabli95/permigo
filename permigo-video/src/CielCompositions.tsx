import { Composition } from "remotion";
import { VueDuCiel, SCENES_CIEL, CIEL, CIEL_FRAMES } from "./VueDuCiel";

/** Une composition par geste. Ajouter une 7e scène = une ligne dans SCENES_CIEL. */
export const CielCompositions: React.FC = () => (
  <>
    {SCENES_CIEL.map((scene) => (
      <Composition
        key={scene.id}
        id={`Ciel-${scene.id}`}
        component={VueDuCiel}
        durationInFrames={CIEL_FRAMES}
        fps={CIEL.fps}
        width={CIEL.width}
        height={CIEL.height}
        defaultProps={{ scene }}
      />
    ))}
  </>
);
