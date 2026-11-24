import { CLIPS } from "./clips.ts";
import { ClipPicker } from "./ClipPicker.tsx";
import { useRoute } from "./route.ts";

export function App() {
  const route = useRoute();
  if (route.page === "picker") return <ClipPicker clips={CLIPS} />;
  const clip = CLIPS.find((c) => c.clipId === route.clipId);
  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-6 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mt-2 font-serif text-title">{clip ? clip.title : "Clip not found."}</h1>
    </main>
  );
}
