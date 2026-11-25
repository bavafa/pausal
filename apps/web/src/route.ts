import { useSyncExternalStore } from "react";

export type Route = { page: "picker" } | { page: "attribution" } | { page: "upload" } | { page: "clip"; clipId: string } | { page: "product"; clipId: string; productId: string };

/** `#/attribution` is the credits page, `#/upload` the upload page, `#/clip/<id>` opens a clip, `#/clip/<id>/product/<id>` its product page; anything else is the picker. */
export function parseRoute(hash: string): Route {
  if (hash === "#/attribution") return { page: "attribution" };
  if (hash === "#/upload") return { page: "upload" };
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
