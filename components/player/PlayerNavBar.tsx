"use client";

import Link from "next/link";
import { X, Sparkles, ArrowLeft } from "lucide-react";

interface PlayerNavBarProps {
  totalScreens: number;
  currentIndex: number;
  aiTutorLabel: "Recap" | "Explain" | "Review";
  onOpenAITutor: () => void;
  /** Show the previous screen; omitted on the first screen */
  onBack?: () => void;
  courseSlug: string;
}

export function PlayerNavBar({
  totalScreens,
  currentIndex,
  aiTutorLabel,
  onOpenAITutor,
  onBack,
}: PlayerNavBarProps) {
  return (
    <nav
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 max-w-4xl w-full mx-auto"
      aria-label="Lesson Progress and Tools"
    >
      {/* Back to Catalog / Exit Button */}
      <Link
        href="/"
        className="min-h-tap min-w-tap flex items-center justify-center text-slate-500 hover:text-slate-900 transition rounded-xl hover:bg-slate-100"
        aria-label="Return to Course Catalog"
      >
        <X className="w-5 h-5" />
      </Link>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="min-h-tap min-w-tap -ml-2 flex items-center justify-center text-slate-500 hover:text-slate-900 transition rounded-xl hover:bg-slate-100"
          aria-label="Go back to the previous screen"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Segmented Progress Rail */}
      <div className="flex-1 flex items-center gap-1.5 px-1" role="progressbar" aria-label="Lesson progress" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={totalScreens}>
        {Array.from({ length: totalScreens }).map((_, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={idx}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                isCompleted
                  ? "bg-brand-600"
                  : isCurrent
                  ? "bg-brand-600 ring-2 ring-brand-200"
                  : "bg-slate-200"
              }`}
            />
          );
        })}
      </div>

      {/* Screen Readout & AI Tutor Trigger */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono font-bold text-slate-600 hidden sm:inline">
          {currentIndex + 1}/{totalScreens}
        </span>

        {/* Dynamic Contextual AI Tutor Button */}
        <button
          type="button"
          onClick={onOpenAITutor}
          className="min-h-tap px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          aria-label={`Open AI Tutor ${aiTutorLabel}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>{aiTutorLabel}</span>
        </button>
      </div>
    </nav>
  );
}
