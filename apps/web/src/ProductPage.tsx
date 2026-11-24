import { useEffect, useRef } from "react";
import type { Product } from "@pausall/bundle-schema";
import { assetUrl } from "./clips.ts";
import { clipHref } from "./route.ts";

/**
 * The advertised product on its own screen (FR-14). `fromClip` is true when it was opened from the clip in this page load:
 * Back then steps back in history so the paused watch screen returns as it was; otherwise Back navigates to the clip.
 */
export function ProductPage({ clipId, product, fromClip }: { clipId: string; product: Product | undefined; fromClip: boolean }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), [product]);
  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-4 md:px-gutter-laptop">
      <a
        href={clipHref(clipId)}
        onClick={(e) => {
          if (!fromClip) return;
          e.preventDefault();
          history.back();
        }}
        className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline"
      >
        Back to the clip
      </a>
      {product ? (
        <article className="mt-2 grid gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-[minmax(0,2fr)_3fr] md:gap-6 md:p-6">
          <img src={assetUrl(product.imagePath)} alt={product.name} className="aspect-square w-full max-w-64 rounded-md border border-border bg-white object-contain p-1" />
          <div className="min-w-0">
            <p className="text-eyebrow uppercase tracking-[0.08em] text-muted-foreground">
              Sponsored <span aria-hidden="true">·</span> Simulated ad
            </p>
            <h1 ref={title} tabIndex={-1} className="mt-1 font-serif text-title focus:outline-none">
              {product.name}
            </h1>
            <p className="mt-2">{product.description}</p>
            <h2 className="mt-4 font-semibold">Key features</h2>
            <ul className="mt-1 list-disc pl-5">
              {product.keyFeatures.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            {/* Only View product records a click; a reload or shared link does not. */}
            {fromClip && <p className="mt-4 text-label text-muted-foreground">Simulated click recorded.</p>}
            <p className="mt-4 text-label text-muted-foreground">{product.attribution}</p>
          </div>
        </article>
      ) : (
        <h1 ref={title} tabIndex={-1} className="mt-2 font-serif text-title focus:outline-none">
          Product not found.
        </h1>
      )}
    </main>
  );
}
