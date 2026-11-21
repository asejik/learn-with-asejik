import React from "react";
import { siteConfig } from "@/lib/config";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";

export function CatalogHeader() {
  return (
    <header className="border-b border-slate-200 pb-8 mb-8">
      {/* Brand & Micro Badge */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>{siteConfig.name}</span>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>Low-Data &bull; &lt;200 KB / lesson</span>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Offline Ready</span>
        </div>
      </div>

      {/* Main Title & Editorial Description */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
        Interactive Technical Tutorials
      </h1>
      <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
        Master modern web architecture, systems, and protocols through focused active recall checks. Designed for fast mobile learning without heavy video downloads.
      </p>
    </header>
  );
}
