"use client";

import { useEffect } from "react";

/// Registers the service worker (production only, to avoid interfering with
/// dev hot-reload).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore registration errors */
      });
    }
  }, []);
  return null;
}
