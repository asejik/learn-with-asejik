"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function PWARegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

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

    // 2. Initial online/offline status
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => {
        setIsOffline(false);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      };

      const handleOffline = () => {
        setIsOffline(true);
        setShowReconnected(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
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
          <span>Back Online &bull; Ready to sync</span>
        </div>
      )}
    </>
  );
}
