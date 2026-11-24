import { useSyncExternalStore } from "react";

export type Route = { page: "picker" } | { page: "clip"; clipId: string } | { page: "product"; clipId: string; productId: string };

/** `#/clip/<id>` opens a clip, `#/clip/<id>/product/<id>` its product page; anything else is the picker. */
export function parseRoute(hash: string): Route {
  const m = /^#\/clip\/([^/]+)(?:\/product\/([^/]+))?$/.exec(hash);
  if (!m) return { page: "picker" };
  const clipId = decodeURIComponent(m[1]!);
  return m[2] ? { page: "product", clipId, productId: decodeURIComponent(m[2]) } : { page: "clip", clipId };
}

export const clipHref = (clipId: string) => `#/clip/${encodeURIComponent(clipId)}`;
export const productHref = (clipId: string, productId: string) => `${clipHref(clipId)}/product/${encodeURIComponent(productId)}`;

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseRoute(hash);
}
