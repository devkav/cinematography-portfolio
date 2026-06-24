import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { sendPageView } from "./track";

export function AnalyticsTracker() {
  const { pathname } = useLocation();
  const enteredAtMs = useRef(Date.now());
  const enteredAtIso = useRef(new Date().toISOString());
  const viewId = useRef(crypto.randomUUID());

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    enteredAtMs.current = Date.now();
    enteredAtIso.current = new Date().toISOString();
    viewId.current = crypto.randomUUID();

    const flush = () =>
      sendPageView({
        page: pathname,
        viewId: viewId.current,
        enteredAt: enteredAtIso.current,
        durationSeconds: Math.round((Date.now() - enteredAtMs.current) / 1000)
      });

    flush();

    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };

    document.addEventListener("visibilitychange", onHidden);

    return () => {
      flush();
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [pathname]);

  return null;
}
