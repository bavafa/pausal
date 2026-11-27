import { useEffect, useMemo, useRef, useState } from "react";
import { clickFor } from "@pausal/policy";
import { CLIPS, loadDecisions, pickerClips, PRODUCTS } from "./clips.ts";
import { AttributionPage } from "./AttributionPage.tsx";
import { ClipPicker } from "./ClipPicker.tsx";
import { mergeChunks } from "./upload.ts";
import { UploadPage, type UploadState } from "./UploadPage.tsx";
import { ProductPage } from "./ProductPage.tsx";
import { productHref, useRoute } from "./route.ts";
import { withClick, type PauseEntry } from "./session.ts";
import { WatchScreen } from "./WatchScreen.tsx";

export function App() {
  const route = useRoute();
  // Hash routes keep the old scroll position; every new page starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.hash]);
  // The session pause log: page-load state only, never sent or stored (AD-23).
  const [pauses, setPauses] = useState<PauseEntry[]>([]);
  // True once the product page was opened from the clip in this page load, so its Back can step back in history.
  const fromClip = useRef(false);
  const clipId = route.page === "clip" || route.page === "product" ? route.clipId : null;
  // The uploaded video of this page load, if any; its decisions grow as the relay answers (docs/upload-plan.md).
  const [upload, setUpload] = useState<UploadState | null>(null);
  const uploaded = upload?.clip.clipId === clipId ? upload : null;
  const clip = uploaded?.clip ?? CLIPS.find((c) => c.clipId === clipId);
  // Validated once per clip, so a re-render on each pause does not hand the watch screen a new object.
  const sampleDecisions = useMemo(() => (clip && !uploaded ? loadDecisions(clip) : null), [clip, uploaded]);
  const uploadDecisions = useMemo(() => (uploaded ? mergeChunks(uploaded.clip, uploaded.chunks) : null), [uploaded]);
  const decisions = uploaded ? uploadDecisions : sampleDecisions;
  if (route.page === "picker") return <ClipPicker clips={pickerClips(CLIPS)} />;
  if (route.page === "upload")
    return (
      <UploadPage
        onStart={(c, run) => {
          setUpload({ clip: c, chunks: [], doneMs: 0, error: null });
          const update = (f: (s: UploadState) => UploadState) => setUpload((s) => (s && s.clip.clipId === c.clipId ? f(s) : s));
          // A failure before the first part is sent would otherwise leave the progress at 0% for good.
          void run(update).catch((e: unknown) => update((s) => ({ ...s, error: s.error ?? (e instanceof Error ? e.message : "Your video could not be read.") })));
        }}
      />
    );
  if (route.page === "attribution") return <AttributionPage />;
  if (clip) {
    const onProduct = route.page === "product";
    return (
      <>
        {/* Stays mounted under the product page so the paused frame and overlay survive the round trip. */}
        <div hidden={onProduct}>
          <WatchScreen
            key={clip.clipId}
            clip={clip}
            decisions={decisions}
            {...(uploaded ? { note: uploaded.error ?? (uploaded.doneMs >= uploaded.clip.durationMs ? "Your video: fully analyzed." : "Your video: analyzing…"), analysis: { doneMs: uploaded.doneMs, totalMs: uploaded.clip.durationMs, error: uploaded.error, step: uploaded.step } } : {})}
            pauses={pauses}
            onPause={(entry) => setPauses((log) => [...log, entry])}
            onViewProduct={(productId) => {
              setPauses((log) => withClick(log, clickFor(productId)));
              fromClip.current = true;
              location.hash = productHref(clip.clipId, productId);
            }}
          />
        </div>
        {onProduct && <ProductPage clipId={clip.clipId} product={PRODUCTS.get(route.productId)} fromClip={fromClip.current} />}
      </>
    );
  }
  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-6 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mt-2 font-serif text-title">Clip not found.</h1>
    </main>
  );
}
