/** Wordmark: "Pausa" plus the closing "ll" drawn as a pause sign in the accent color. Screen readers hear "Pausall". */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span role="img" aria-label="Pausall" className={`inline-flex items-baseline font-serif leading-none ${className}`}>
      <span aria-hidden="true">Pausa</span>
      <span aria-hidden="true" className="ml-[0.08em] inline-flex h-[0.72em] gap-[0.12em]">
        <span className="w-[0.16em] rounded-[0.04em] bg-accent" />
        <span className="w-[0.16em] rounded-[0.04em] bg-accent" />
      </span>
    </span>
  );
}
