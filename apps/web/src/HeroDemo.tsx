import { assetUrl } from "./clips.ts";

/** The pointer that folds the ad away and brings it back in the demo. */
function Cursor() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
      <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Chevron({ left }: { left?: boolean }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background/70">
      <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={left ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </span>
  );
}

/**
 * A looping sketch of the idea, drawn rather than filmed so it never pretends to be a real clip: someone cooks, the
 * viewer pauses, a small ad arrives in the corner, gets folded to the edge and brought back, and the video plays on.
 * With reduced motion it shows the paused frame with the ad.
 */
export function HeroDemo() {
  return (
    <figure className="relative">
      <div aria-hidden="true" className="relative aspect-video w-full overflow-hidden rounded-md bg-black shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-border">
        <svg viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="hd-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F6E3C6" />
              <stop offset="1" stopColor="#EBCBA0" />
            </linearGradient>
            <linearGradient id="hd-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9FD3E6" />
              <stop offset="1" stopColor="#E9F5F1" />
            </linearGradient>
            <radialGradient id="hd-glow" cx="0.5" cy="0.2" r="0.6">
              <stop offset="0" stopColor="#FFE7A8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#FFE7A8" stopOpacity="0" />
            </radialGradient>
            <pattern id="hd-tile" width="12" height="8" patternUnits="userSpaceOnUse">
              <rect width="12" height="8" fill="#F3F1EA" />
              <path d="M0 7.5h12M6 0v4M0 3.5h12M11.5 4v4" stroke="#D9D3C4" strokeWidth="0.8" />
            </pattern>
            <linearGradient id="hd-counter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C99668" />
              <stop offset="1" stopColor="#A8774B" />
            </linearGradient>
          </defs>

          {/* Room */}
          <rect width="320" height="180" fill="url(#hd-wall)" />
          <rect y="62" width="320" height="50" fill="url(#hd-tile)" />
          <rect x="0" y="0" width="150" height="44" fill="#7FA38A" />
          <path d="M50 0v44M100 0v44" stroke="#6B8E76" strokeWidth="2" />
          <path d="M44 34h-6M56 34h6M94 34h-6M106 34h6" stroke="#E9D9B8" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="0" y="44" width="150" height="4" fill="#6B8E76" />

          {/* Window with a hill, a tree and the sun */}
          <rect x="206" y="12" width="96" height="64" rx="3" fill="url(#hd-sky)" />
          <circle cx="282" cy="26" r="7" fill="#FFF3C4" />
          <path d="M206 64c20-12 40-14 60-6s28 4 36-2v20h-96z" fill="#9CC59A" />
          <path d="M226 60c-6-14 10-20 10-6" fill="#6FA172" />
          <rect x="229" y="58" width="3" height="10" fill="#7A5A3A" />
          <rect x="203" y="9" width="102" height="70" rx="4" fill="none" stroke="#FBF6EC" strokeWidth="5" />
          <path d="M254 12v64M206 44h96" stroke="#FBF6EC" strokeWidth="3" />
          <rect x="198" y="78" width="112" height="5" rx="1.5" fill="#FBF6EC" />
          <rect x="282" y="66" width="12" height="12" rx="2" fill="#D9774F" />
          <path d="M288 66c-6-8-2-14 0-18M288 66c6-6 6-12 2-16M288 66c-2-6-8-8-10-6" stroke="#4F8A57" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Pendant lamp */}
          <path d="M176 0v22" stroke="#3A3F44" strokeWidth="1.2" />
          <ellipse cx="176" cy="70" rx="58" ry="58" fill="url(#hd-glow)" />
          <path d="M164 32c0-8 24-8 24 0l4 6h-32z" fill="#2F6F73" />
          <ellipse cx="176" cy="38" rx="16" ry="2.5" fill="#FFE7A8" />

          {/* Cook */}
          <path d="M98 112c0-30 10-44 26-44s26 14 26 44z" fill="#3F6C9B" />
          <path d="M110 112c0-22 6-32 14-32s14 10 14 32z" fill="#F4EFE6" />
          <path d="M116 84l8 6 8-6" stroke="#E2D8C6" strokeWidth="2" fill="none" />
          <rect x="120" y="58" width="8" height="10" rx="3" fill="#C98B62" />
          <circle cx="124" cy="50" r="11" fill="#D9A07A" />
          {/* Hair swept back, face turned toward the pan */}
          <path d="M135 50c2-12-8-17-15-15-6 1-10 6-8 13 4-4 10-6 14-3 4 2 6 4 9 5z" fill="#3B2A22" />
          <circle cx="136" cy="45" r="4.5" fill="#3B2A22" />
          <circle cx="119" cy="51" r="1.2" fill="#3B2A22" />
          <path d="M116 56q3 2 5 0" stroke="#8A4B36" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M104 86c-8 8-14 14-22 20" stroke="#3F6C9B" strokeWidth="8" strokeLinecap="round" />
          <circle cx="82" cy="106" r="4" fill="#D9A07A" />

          {/* Counter and cabinets */}
          <rect y="110" width="320" height="9" fill="url(#hd-counter)" />
          <rect y="119" width="320" height="61" fill="#E8DCC8" />
          <path d="M80 119v61M160 119v61M240 119v61" stroke="#D3C4AA" strokeWidth="2" />
          <path d="M72 134v14M88 134v14M152 134v14M168 134v14M232 134v14M248 134v14" stroke="#9C8A6A" strokeWidth="2.5" strokeLinecap="round" />

          {/* Stove, flame and pan */}
          <rect x="28" y="106" width="86" height="6" rx="2" fill="#2C3136" />
          <g className="origin-[56px_106px] motion-safe:animate-demo-flame">
            <path d="M48 106c2-5 4-5 5-9 2 4 4 5 5 9zM56 106c2-4 4-5 5-8 2 3 4 5 4 8z" fill="#5AA9E6" />
          </g>
          <ellipse cx="56" cy="102" rx="26" ry="5.5" fill="#24292E" />
          <path d="M80 101l22 3" stroke="#24292E" strokeWidth="5" strokeLinecap="round" />
          <g className="motion-safe:animate-demo-flip">
            <ellipse cx="56" cy="99" rx="11" ry="3.5" fill="#FFF8EC" />
            <circle cx="56" cy="98.5" r="3" fill="#F5B83A" />
            <circle cx="44" cy="99" r="2.3" fill="#6BAA4F" />
            <circle cx="68" cy="99.5" r="2.1" fill="#D9573B" />
          </g>
          {[48, 58, 68].map((x, i) => (
            <path
              key={x}
              d={`M${x} 90c-4-6 4-10 0-16`}
              stroke="#FFFFFF"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.55"
              className="motion-safe:animate-demo-steam"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}

          {/* Cutting board */}
          <rect x="196" y="105" width="52" height="6" rx="3" fill="#D8A86E" />
          <circle cx="210" cy="101" r="5" fill="#D9573B" />
          <path d="M210 96l1.5-2" stroke="#4F8A57" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M222 104l18-5" stroke="#F08A35" strokeWidth="4" strokeLinecap="round" />
          <circle cx="232" cy="104.5" r="1.4" fill="#F08A35" />
          <circle cx="238" cy="104.5" r="1.4" fill="#F08A35" />
        </svg>

        {/* Player chrome: progress bar and the pause badge */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/25">
          <div className="h-full w-[38%] bg-accent motion-safe:animate-demo-progress" />
        </div>
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full bg-black/55 opacity-0 motion-safe:animate-demo-pause">
            <svg viewBox="0 0 24 24" className="size-5 fill-white">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          </span>
        </div>

        {/* The ad: a corner card that folds to the edge, the same shape as the real one */}
        <div className="absolute right-[3%] bottom-[9%] w-[62%] sm:w-[56%]">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card/95 p-1.5 pl-1 text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.35)] motion-safe:animate-demo-card">
            <Chevron />
            <img src={assetUrl("products/fixture-pan.svg")} alt="" className="size-11 shrink-0 rounded-sm border border-border bg-white object-contain p-0.5 sm:size-14" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">Sponsored · Simulated ad</span>
              <span className="block truncate font-serif text-[15px] leading-tight sm:text-title-sm">Everyday Skillet</span>
              <span className="mt-1 inline-block rounded-sm bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">View product</span>
            </span>
            <img src={assetUrl("demo-qr.svg")} alt="" className="hidden size-12 shrink-0 rounded-sm sm:block" />
          </div>
          <span className="absolute top-1/2 right-[-2%] flex -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-card/95 py-0.5 pr-0.5 pl-1 text-foreground opacity-0 shadow-lg motion-safe:animate-demo-tab">
            <Chevron left />
            <img src={assetUrl("products/fixture-pan.svg")} alt="" className="size-7 rounded-full bg-white object-contain p-0.5" />
          </span>
          <span className="absolute top-1/2 left-[2%] opacity-0 motion-safe:animate-demo-cursor">
            <Cursor />
          </span>
        </div>
      </div>
      <figcaption className="mt-2 text-label text-muted-foreground">Pause on a kitchen, get a frying pan. One tap folds it away.</figcaption>
    </figure>
  );
}
