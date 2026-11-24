import { useId } from "react";

/** The mark: a pause sign on a rounded tile. The wordmark follows it. Screen readers hear "Pausall". */
export function LogoMark({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "color-mix(in oklab, var(--accent) 80%, white)" }} />
          <stop offset="1" style={{ stopColor: "var(--accent)" }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <rect x="10" y="9" width="4.25" height="14" rx="2.125" className="fill-accent-foreground" />
      <rect x="17.75" y="9" width="4.25" height="14" rx="2.125" className="fill-accent-foreground" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span role="img" aria-label="Pausall" className={`inline-flex items-center gap-[0.35em] leading-none ${className}`}>
      <LogoMark className="h-[1.25em] w-[1.25em] shrink-0" />
      <span aria-hidden="true" className="font-semibold tracking-[-0.02em]">pausall</span>
    </span>
  );
}
