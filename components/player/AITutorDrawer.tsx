"use client";

import { useEffect } from "react";
import { Sparkles, X, BookOpen, Lightbulb, CheckCircle2 } from "lucide-react";

interface AITutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  aiTutor?: {
    recap?: string;
    explain?: string;
    review?: string;
  };
  activeContext: "recap" | "explain" | "review";
  lessonTitle: string;
}

export function AITutorDrawer({
  isOpen,
  onClose,
  aiTutor,
  activeContext,
  lessonTitle,
}: AITutorDrawerProps) {
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

  if (!isOpen) return null;

  const hasRecap = Boolean(aiTutor?.recap);
  const hasExplain = Boolean(aiTutor?.explain);
  const hasReview = Boolean(aiTutor?.review);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-tutor-title"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 id="ai-tutor-title" className="text-sm font-bold text-slate-900">
                AI Tutor Guidance
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">
                Contextual hints &bull; Zero API latency
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-tap min-w-tap flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Close AI Tutor Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Lesson: {lessonTitle}
          </div>

          {/* Active Mode Highlight Card */}
          {activeContext === "recap" && hasRecap && (
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs uppercase tracking-wide">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Concept Recap</span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed">
                {aiTutor?.recap}
              </p>
            </div>
          )}

          {activeContext === "explain" && hasExplain && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Coach Explanation</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                {aiTutor?.explain}
              </p>
            </div>
          )}

          {activeContext === "review" && hasReview && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Milestone Review</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {aiTutor?.review}
              </p>
            </div>
          )}

          {/* General Guidance notes if no specific hint */}
          {!hasRecap && !hasExplain && !hasReview && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
              <p className="font-semibold text-slate-800">
                You&apos;re doing great!
              </p>
              <p>
                Take your time to understand the core concept on this screen before answering the recall check. If you answer incorrectly, don&apos;t worry—the question will return in 3 screens to lock it into long-term memory!
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-tap px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Got it, back to lesson
          </button>
        </div>

      </div>
    </div>
  );
}
