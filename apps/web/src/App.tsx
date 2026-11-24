import { CLIPS, loadDecisions } from "./clips.ts";
import { ClipPicker } from "./ClipPicker.tsx";
import { useRoute } from "./route.ts";
import { WatchScreen } from "./WatchScreen.tsx";

export function App() {
  const route = useRoute();
  if (route.page === "picker") return <ClipPicker clips={CLIPS} />;
  const clip = CLIPS.find((c) => c.clipId === route.clipId);
  if (clip) return <WatchScreen key={clip.clipId} clip={clip} decisions={loadDecisions(clip)} />;
  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-6 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mt-2 font-serif text-title">Clip not found.</h1>
    </main>
  );
}
