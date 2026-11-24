import { useSyncExternalStore } from "react";

export type Route = { page: "picker" } | { page: "clip"; clipId: string };

/** `#/clip/<id>` opens a clip; anything else is the picker. */
export function parseRoute(hash: string): Route {
  const m = /^#\/clip\/([^/]+)$/.exec(hash);
  return m ? { page: "clip", clipId: decodeURIComponent(m[1]!) } : { page: "picker" };
}

export const clipHref = (clipId: string) => `#/clip/${encodeURIComponent(clipId)}`;

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseRoute(hash);
}
