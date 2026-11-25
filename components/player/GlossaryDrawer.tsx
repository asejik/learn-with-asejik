"use client";

import { BookMarked } from "lucide-react";
import { SlideOverDrawer } from "./SlideOverDrawer";

interface GlossaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  term: string;
  definition: string;
  example?: string;
}

export function GlossaryDrawer({
  isOpen,
  onClose,
  term,
  definition,
  example,
}: GlossaryDrawerProps) {
  if (!term) return null;

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      titleId="glossary-term-title"
      closeLabel="Close Glossary Drawer"
      footerLabel="Continue Learning"
      bodyClassName="space-y-4"
      header={
        <>
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
        </>
      }
    >
      <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-2">
        <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
          Definition
        </h3>
        <p className="text-xs sm:text-sm text-sky-950 leading-relaxed">
          {definition}
        </p>
      </div>

      {example && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Example</h3>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{example}</p>
        </div>
      )}

      <p className="text-xs text-slate-500 leading-normal">
        Terms are defined inline to ensure you never have to leave the lesson or open distracting external tabs.
      </p>
    </SlideOverDrawer>
  );
}
