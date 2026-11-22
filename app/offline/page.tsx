import Link from "next/link";
import { WifiOff, ArrowLeft } from "lucide-react";

// Served by the service worker for pages not yet saved on this device.
export const metadata = {
  title: "You're Offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
        <WifiOff className="w-6 h-6 text-amber-600" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">You&apos;re offline</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        This page isn&apos;t saved on this device yet. Lessons you have opened before still work
        without a connection.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-1.5 px-5 min-h-tap rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to Catalog</span>
      </Link>
    </main>
  );
}
