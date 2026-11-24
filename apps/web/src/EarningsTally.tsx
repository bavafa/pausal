import { useId, useState } from "react";
import { CLIPS } from "./clips.ts";
import { earningsRows, tallyLine } from "./earnings.ts";
import type { PauseEntry } from "./session.ts";

const titleOf = (clipId: string) => CLIPS.find((c) => c.clipId === clipId)?.title ?? clipId;

/** One line below the player; tapping it expands the per-pause breakdown in place (UX-DR13). */
export function EarningsTally({ log, clipId }: { log: readonly PauseEntry[]; clipId: string }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rows = earningsRows(log, clipId, titleOf);
  return (
    <section aria-label="Session earnings" className="border-b border-border py-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        disabled={rows.length === 0}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent enabled:cursor-pointer"
      >
        <span>{tallyLine(log)}</span>
        {rows.length > 0 && (
          <span aria-hidden="true" className="shrink-0 text-label text-accent">
            {open ? "Hide" : "Details"}
          </span>
        )}
      </button>
      {open && rows.length > 0 && (
        <ol id={listId} className="mb-2 divide-y divide-border text-label">
          {rows.map((r, i) => (
            <li key={i} className="grid gap-x-3 py-1.5 sm:grid-cols-[3.5rem_1fr_auto]">
              <span className="text-muted-foreground">
                {r.time}
                {r.clip && ` · ${r.clip}`}
              </span>
              <span>{r.what}</span>
              <span className="text-muted-foreground">{r.figures}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
