"use client";

import { Sparkles, BookOpen, Lightbulb, CheckCircle2 } from "lucide-react";
import { SlideOverDrawer } from "./SlideOverDrawer";

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
  if (!isOpen) return null;

  const hasRecap = Boolean(aiTutor?.recap);
  const hasExplain = Boolean(aiTutor?.explain);
  const hasReview = Boolean(aiTutor?.review);

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      titleId="ai-tutor-title"
      closeLabel="Close AI Tutor Drawer"
      footerLabel="Got it, back to lesson"
      bodyClassName="space-y-5"
      header={
        <>
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
        </>
      }
    >
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
    </SlideOverDrawer>
  );
}
