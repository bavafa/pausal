import { assetUrl } from "./clips.ts";
import type { ProductListView } from "./product-list.ts";

const THUMB = "shrink-0 rounded-md border border-border bg-white object-contain p-1";

/** Top product larger, the rest in one row (laptop) or a sideways strip (phone and in-between). */
export function ProductList({ view }: { view: ProductListView }) {
  const { top, rest } = view;
  return (
    <section aria-label="Sponsored products" className="py-3">
      <div className="flex items-center gap-3 lg:gap-4">
        <img src={assetUrl(top.product.imagePath)} alt={top.product.name} className={`${THUMB} size-24 lg:size-[150px]`} />
        <div className="min-w-0">
          <p className="text-eyebrow uppercase tracking-[0.08em] text-muted-foreground">Sponsored</p>
          <h2 className="mt-0.5 font-serif text-title-sm lg:text-title">{top.product.name}</h2>
          <p className="mt-1">{top.reason}</p>
          <p className="mt-1 text-label text-muted-foreground">Relevance {top.relevance}</p>
        </div>
      </div>
      {rest.length > 0 && (
        <ul
          aria-label="More products"
          tabIndex={0}
          className="mt-3 flex gap-2.5 overflow-x-auto pb-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:grid lg:grid-cols-9 lg:overflow-visible lg:pb-0"
        >
          {rest.map((p) => (
            <li key={p.id} className="flex min-h-11 w-[84px] shrink-0 flex-col gap-1 lg:w-auto">
              <img src={assetUrl(p.imagePath)} alt={p.name} className={`${THUMB} aspect-square w-full`} />
              <span className="text-label">{p.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
