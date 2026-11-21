"use client";

import React, { useEffect } from "react";
import { BookMarked, X } from "lucide-react";

interface GlossaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  term: string;
  definition: string;
}

export function GlossaryDrawer({
  isOpen,
  onClose,
  term,
  definition,
}: GlossaryDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !term) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-term-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <BookMarked className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Glossary Term
              </h2>
              <span id="glossary-term-title" className="text-base font-extrabold text-slate-900">
                {term}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-tap min-w-tap flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Close Glossary Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-2">
            <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
              Definition
            </h3>
            <p className="text-xs sm:text-sm text-sky-950 leading-relaxed">
              {definition}
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-normal">
            Terms are defined inline to ensure you never have to leave the lesson or open distracting external tabs.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-tap px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Continue Learning
          </button>
        </div>

      </div>
    </div>
  );
}
