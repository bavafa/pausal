import { assetUrl } from "./clips.ts";

/**
 * A looping sketch of the idea: a kitchen scene plays, the viewer pauses, one product slides in.
 * Drawn, not filmed, so it never pretends to be a real clip. With reduced motion it shows the paused state.
 */
export function HeroDemo() {
  return (
    <figure className="relative">
      <div aria-hidden="true" className="relative aspect-video w-full overflow-hidden rounded-md bg-black shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-border">
        <svg viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="hd-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F3D9B1" />
              <stop offset="1" stopColor="#E7BE8A" />
            </linearGradient>
            <linearGradient id="hd-sun" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFF6DD" />
              <stop offset="1" stopColor="#BFE3EA" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#hd-wall)" />
          <rect x="196" y="18" width="92" height="66" rx="4" fill="url(#hd-sun)" stroke="#C99A63" strokeWidth="4" />
          <path d="M242 18v66M196 51h92" stroke="#C99A63" strokeWidth="3" />
          <circle cx="62" cy="40" r="15" fill="#FBF3E6" stroke="#9C6B3C" strokeWidth="3" />
          <path d="M62 31v9l6 4" stroke="#9C6B3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect y="116" width="320" height="64" fill="#7A5232" />
          <rect y="110" width="320" height="10" fill="#A8774B" />
          <rect x="70" y="100" width="96" height="12" rx="3" fill="#3A3F44" />
          <ellipse cx="112" cy="98" rx="34" ry="7" fill="#2C3136" />
          <rect x="144" y="94" width="40" height="5" rx="2.5" fill="#2C3136" />
          <ellipse cx="112" cy="96" rx="27" ry="4.5" fill="#E9A23B" />
          <circle cx="102" cy="95" r="3.5" fill="#6BAA4F" />
          <circle cx="118" cy="96" r="3" fill="#D9573B" />
          {[96, 110, 124].map((x, i) => (
            <path key={x} d={`M${x} 86c-4-6 4-10 0-16`} stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" className="motion-safe:animate-demo-steam" style={{ animationDelay: `${i * 0.6}s` }} />
          ))}
          <rect x="230" y="92" width="14" height="20" rx="3" fill="#5E8C6A" />
          <path d="M237 92c-6-10 4-16 0-24M237 92c8-8 2-14 6-20" stroke="#4F7A58" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>

        <div className="absolute inset-0 bg-black/35 opacity-100 motion-safe:animate-demo-scrim" />

        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/25">
          <div className="h-full w-[41%] bg-accent motion-safe:animate-demo-progress" />
        </div>

        <div className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-full bg-black/55 opacity-0 motion-safe:animate-demo-pause">
            <svg viewBox="0 0 24 24" className="size-6 fill-white">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          </span>
        </div>

        <div className="absolute right-[4%] bottom-[10%] left-[30%] flex items-center gap-3 rounded-md border border-border bg-card p-2.5 text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.35)] motion-safe:animate-demo-card sm:left-auto sm:w-[60%]">
          <img src={assetUrl("products/fixture-pan.svg")} alt="" className="size-14 shrink-0 rounded-sm border border-border bg-white object-contain p-0.5 sm:size-16" />
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Sponsored · Simulated ad</span>
            <span className="block truncate font-serif text-title-sm">Everyday Skillet</span>
            <span className="hidden text-label text-muted-foreground sm:block">Shown because this scene matches: kitchen</span>
          </span>
        </div>
      </div>
      <figcaption className="mt-2 text-label text-muted-foreground">A sketch of a pause: the scene is a kitchen, so one pan that fits is shown.</figcaption>
    </figure>
  );
}
