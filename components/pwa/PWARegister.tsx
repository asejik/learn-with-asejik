"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { WifiOff, Wifi } from "lucide-react";

// Online status read straight from the browser, so it is right on first render
function subscribeToNetwork(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function PWARegister() {
  const isOffline = useSyncExternalStore(
    subscribeToNetwork,
    () => !navigator.onLine,
    () => false // Server render: assume online
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const pathname = usePathname();

  // Ask the service worker to save each page the learner opens. In-app
  // navigation never makes a page request, so the worker cannot see it
  // otherwise. Build files loaded before the worker took control are sent too.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((registration) => {
        const worker = navigator.serviceWorker.controller ?? registration.active;
        if (cancelled || !worker) return;
        const buildFilePrefix = `${window.location.origin}/_next/static/`;
        const assets = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => name.startsWith(buildFilePrefix));
        worker.postMessage({ type: "SAVE_PAGE", page: pathname, assets });
      })
      .catch((err) => {
        console.warn("[PWA] Could not save this page for offline use:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    // 1. Register Service Worker in production/client
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // SW registered successfully
          if (process.env.NODE_ENV === "development") {
            console.log("[PWA] Service Worker active with scope:", reg.scope);
          }
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Briefly show "Back Online" after a reconnect
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOnline = () => {
      setShowReconnected(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      clearTimeout(hideTimer);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(hideTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline subtle banner */}
      {isOffline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs border border-slate-700 animate-fadeIn">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Offline Mode &bull; Progress saved locally</span>
        </div>
      )}

      {/* Reconnected indicator */}
      {showReconnected && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-xs border border-emerald-700 animate-fadeIn">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Back Online</span>
        </div>
      )}
    </>
  );
}
