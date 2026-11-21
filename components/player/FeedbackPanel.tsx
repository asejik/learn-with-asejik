"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Info, ArrowRight, RotateCcw } from "lucide-react";

interface FeedbackPanelProps {
  status: "correct" | "incorrect" | "info" | null;
  explanation?: string;
  bonusFact?: string;
  isRetryQueued?: boolean;
  onContinue: () => void;
  isLastScreen: boolean;
}

export function FeedbackPanel({
  status,
  explanation,
  bonusFact,
  isRetryQueued = false,
  onContinue,
  isLastScreen,
}: FeedbackPanelProps) {
  if (!status) return null;

  const isCorrect = status === "correct";
  const isIncorrect = status === "incorrect";
  const isInfo = status === "info";

  return (
    <div
      className={`w-full border-t p-4 sm:p-5 transition-all duration-200 animate-in slide-in-from-bottom ${
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
                  Concept Discovered
                </h3>
              </>
            )}
          </div>

          {/* Retry Badge */}
          {isRetryQueued && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              <RotateCcw className="w-3 h-3" />
              <span>Retry in 3 screens</span>
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
          <div className="p-2.5 bg-emerald-100/70 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-normal">
            <span className="font-bold">Bonus Insight: </span>
            <span>{bonusFact}</span>
          </div>
        )}

        {/* Continue Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onContinue}
            className={`w-full min-h-tap px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm ${
              isCorrect
                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                : isIncorrect
                ? "bg-amber-700 hover:bg-amber-800 text-white"
                : "bg-brand-600 hover:bg-brand-700 text-white"
            }`}
          >
            <span>{isLastScreen ? "Complete Lesson" : "Continue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
