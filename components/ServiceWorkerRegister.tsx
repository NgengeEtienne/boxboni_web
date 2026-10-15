"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In dev the SW's caching would fight HMR; drop any leftover registration instead.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // This page loaded before the SW controlled it; hand over what it
        // fetched so the shell works offline from the very first visit.
        const assets = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((url) => url.startsWith(`${location.origin}/_next/static/`));
        const pages = Array.from(new Set(["/", location.pathname])); // "/" is the manifest start_url
        registration.active?.postMessage({ type: "CACHE_URLS", pages, assets });
      })
      .catch(() => {
        // Installability is a nice-to-have, not load-bearing -- ignore failures silently.
      });
  }, []);

  return null;
}
