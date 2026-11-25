import { assetUrl } from "./clips.ts";
import { dollars } from "./earnings.ts";
import type { ListItem, ProductListView } from "./product-list.ts";

const THUMB = "shrink-0 rounded-md border border-border bg-white object-contain p-1";

/** Relevance always; the simulated bid, or "Bid: none" when the product has no active campaign. */
function Figures({ item, className = "" }: { item: ListItem; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-1.5 text-label ${className}`}>
      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-foreground">Relevance: {item.relevance}</span>
      <span className={`rounded-sm px-1.5 py-0.5 ${item.bid ? "bg-accent/15 text-accent" : "border border-dashed border-border text-muted-foreground"}`}>
        {item.bid ? `Bid: ${dollars(item.bid)}` : "Bid: none"}
      </span>
    </span>
  );
}

/** Top product larger, the rest in one row (laptop) or a sideways strip (phone and in-between). Bids are simulated. */
export function ProductList({ view }: { view: ProductListView }) {
  const { top, rest } = view;
  return (
    <section aria-label="Sponsored products" className="py-3">
      <div className="flex items-center gap-3 lg:gap-4">
        <img src={assetUrl(top.product.imagePath)} alt={top.product.name} className={`${THUMB} size-24 lg:size-[150px]`} />
        <div className="min-w-0">
          <p className="text-eyebrow uppercase tracking-[0.08em] text-muted-foreground">Sponsored · simulated bids</p>
          <h2 className="mt-0.5 font-serif text-title-sm lg:text-title">{top.label}</h2>
          {top.label !== top.product.name && <p className="truncate text-label text-muted-foreground" title={top.product.name}>{top.product.name}</p>}
          <p className="mt-1">{top.reason}</p>
          <Figures item={top} className="mt-2" />
        </div>
      </div>
      {rest.length > 0 && (
        <ul
          aria-label="More products"
          tabIndex={0}
          className="mt-3 flex gap-2.5 overflow-x-auto pb-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:grid lg:grid-cols-9 lg:overflow-visible lg:pb-0"
        >
          {rest.map((i) => (
            <li key={i.product.id} className="flex min-h-11 w-[96px] shrink-0 flex-col gap-1 lg:w-auto">
              <img src={assetUrl(i.product.imagePath)} alt={i.product.name} className={`${THUMB} aspect-square w-full`} />
              <span className="text-label font-semibold leading-snug" title={i.product.name}>{i.label}</span>
              <span className="flex flex-col text-[11px] leading-snug text-muted-foreground">
                <span>Relevance: {i.relevance}</span>
                <span>{i.bid ? `Bid: ${dollars(i.bid)}` : "Bid: none"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
