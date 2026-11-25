"use client";

import { CheckCircle2, AlertTriangle, Info, ArrowRight, RotateCcw } from "lucide-react";
import { retryLabel as describeRetry } from "./lessonProgress";

interface FeedbackPanelProps {
  status: "correct" | "incorrect" | "info" | null;
  explanation?: string;
  bonusFact?: string;
  /** Screens before the queued retry (0 = next); null or absent when none */
  retryAfterScreens?: number | null;
  onContinue: () => void;
  isLastScreen: boolean;
  /** Button text for a step inside a screen, e.g. "Next card" */
  continueLabel?: string;
}

export function FeedbackPanel({
  status,
  explanation,
  bonusFact,
  retryAfterScreens = null,
  onContinue,
  isLastScreen,
  continueLabel,
}: FeedbackPanelProps) {
  if (!status) return null;

  const isCorrect = status === "correct";
  const isIncorrect = status === "incorrect";
  const isInfo = status === "info";
  const retryLabel = retryAfterScreens === null ? null : describeRetry(retryAfterScreens);

  return (
    <div
      className={`w-full border-t p-4 sm:p-5 transition-all duration-200 animate-in slide-in-from-bottom lg:fixed lg:inset-y-0 lg:right-0 lg:z-40 lg:w-96 lg:border-t-0 lg:border-l-4 lg:flex lg:flex-col lg:justify-center lg:overflow-y-auto ${
        isCorrect
          ? "bg-emerald-50 border-emerald-500 text-emerald-950"
          : isIncorrect
          ? "bg-amber-50 border-amber-500 text-amber-950"
          : "bg-sky-50 border-sky-500 text-sky-950"
      }`}
      role="region"
      aria-live="polite"
      aria-label="Answer Feedback"
    >
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Status Header with Icon */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isCorrect && (
              <>
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-emerald-900">
                  Spot on! Correct answer.
                </h3>
              </>
            )}

            {isIncorrect && (
              <>
                <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-amber-900">
                  Not quite right
                </h3>
              </>
            )}

            {isInfo && (
              <>
                <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-sky-900">
                  All parts explored
                </h3>
              </>
            )}
          </div>

          {/* Retry Badge */}
          {retryLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              <RotateCcw className="w-3 h-3" />
              <span>{retryLabel}</span>
            </span>
          )}
        </div>

        {/* Explanation Text */}
        {explanation && (
          <p className="text-xs sm:text-sm leading-relaxed">
            {explanation}
          </p>
        )}

        {/* Bonus Fact Callout */}
        {bonusFact && (
          <div
            className={`p-2.5 rounded-xl border text-xs leading-normal ${
              isCorrect
                ? "bg-emerald-100/70 border-emerald-200 text-emerald-900"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <span className="font-bold">Bonus Insight: </span>
            <span>{bonusFact}</span>
          </div>
        )}

        {/* Continue Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onContinue}
            className={`w-full min-h-tap px-4 py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm ${
              isCorrect
                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                : isIncorrect
                ? "bg-amber-700 hover:bg-amber-800 text-white"
                : "bg-brand-600 hover:bg-brand-700 text-white"
            }`}
          >
            <span>{continueLabel ?? (isLastScreen ? "Complete Lesson" : "Continue")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
