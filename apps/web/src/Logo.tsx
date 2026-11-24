const BAR = "w-[0.2em] rounded-[0.05em] bg-accent";

/**
 * Wordmark "PA||SAL": the U of Pausal is a pause sign, two accent bars as tall as the capitals.
 * Screen readers hear "Pausal".
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span role="img" aria-label="Pausal" className={`inline-flex items-baseline font-semibold uppercase leading-none tracking-[0.14em] ${className}`}>
      <span aria-hidden="true">PA</span>
      <span aria-hidden="true" className="mr-[0.16em] ml-[0.02em] inline-flex h-[0.71em] gap-[0.11em]">
        <span className={BAR} />
        <span className={BAR} />
      </span>
      <span aria-hidden="true">SAL</span>
    </span>
  );
}
