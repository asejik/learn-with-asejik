"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Course, Lesson, Screen } from "@/lib/schema";
import { PlayerNavBar } from "./PlayerNavBar";
import { FeedbackPanel } from "./FeedbackPanel";
import { AITutorDrawer } from "./AITutorDrawer";
import { GlossaryDrawer } from "./GlossaryDrawer";
import { usePlayerMachine } from "./usePlayerMachine";
import {
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Volume2,
} from "lucide-react";

interface PlayerShellProps {
  course: Course;
  lesson: Lesson;
}

export function PlayerShell({ course, lesson }: PlayerShellProps) {
  const machine = usePlayerMachine(course.slug, lesson);

  // Drawer states
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<{
    term: string;
    definition: string;
  } | null>(null);

  // Active answer selection state for interactive checks
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [selectedClozeWord, setSelectedClozeWord] = useState<string | null>(null);

  // Helper to open glossary term
  function handleOpenGlossary(term: string) {
    const found = machine.currentScreen.glossary.find(
      (g) => g.term.toLowerCase() === term.toLowerCase()
    );
    if (found) {
      setActiveGlossaryTerm(found);
    } else {
      setActiveGlossaryTerm({
        term,
        definition: `Key concept in ${lesson.title}. Explored in detail throughout this chapter.`,
      });
    }
  }

  // Handle choice submission
  function handleChoiceSubmit(screen: Screen) {
    if (!selectedChoiceId) return;
    if (screen.widgetType !== "choice") return;

    const widgetData = screen.widgetData as {
      correctOptionIds: string[];
      explanation: string;
      bonusFact?: string;
    };

    const isCorrect = widgetData.correctOptionIds.includes(selectedChoiceId);
    machine.submitAnswer({
      isCorrect,
      explanation: widgetData.explanation,
      bonusFact: widgetData.bonusFact,
    });
  }

  // Handle cloze submission
  function handleClozeSubmit(screen: Screen) {
    if (!selectedClozeWord) return;
    if (screen.widgetType !== "cloze") return;

    const widgetData = screen.widgetData as {
      correctAnswer: string;
      explanation: string;
      bonusFact?: string;
    };

    const isCorrect =
      selectedClozeWord.toLowerCase() === widgetData.correctAnswer.toLowerCase();

    machine.submitAnswer({
      isCorrect,
      explanation: widgetData.explanation,
      bonusFact: widgetData.bonusFact,
    });
  }

  // Handle continue transition
  function handleContinue() {
    setSelectedChoiceId(null);
    setSelectedClozeWord(null);
    machine.nextScreen();
  }

  // If lesson is complete, render celebration completion view
  if (machine.isLessonComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <main className="max-w-xl w-full mx-auto p-6 sm:p-10 my-auto space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Tutorial Completed &bull; 100% Progress
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {lesson.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Excellent job! You successfully reinforced all concepts and active recall checkpoints without burning unnecessary data.
            </p>
          </div>

          {/* Key terms learned */}
          {lesson.keyTerms.length > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-left space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Key Concepts Mastered
              </span>
              <div className="flex flex-wrap gap-1.5">
                {lesson.keyTerms.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Action */}
          <div className="pt-4">
            <Link
              href="/"
              className="w-full min-h-tap px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Return to Course Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const screen = machine.currentScreen;
  const isLastScreen = machine.currentIndex === machine.totalScreens - 1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* 1. Top Navigation Bar */}
      <PlayerNavBar
        totalScreens={machine.totalScreens}
        currentIndex={machine.currentIndex}
        aiTutorLabel={machine.aiTutorLabel}
        onOpenAITutor={() => setIsAITutorOpen(true)}
        courseSlug={course.slug}
      />

      {/* 2. Main Screen Interaction Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Section Breadcrumb & Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-600">
                {course.title}
              </span>
              {machine.retryQueue.includes(screen.id) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Active Recall Retry</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {screen.title}
            </h1>
          </div>

          {/* SCREEN CONTENT BY WIDGET TYPE */}

          {/* A. Reading Widget */}
          {screen.widgetType === "reading" && (
            <div className="space-y-4">
              {/* Optional SVG Illustration */}
              {(screen.widgetData as { svgIllustration?: string }).svgIllustration && (
                <div
                  className="p-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                  dangerouslySetInnerHTML={{
                    __html: (screen.widgetData as { svgIllustration?: string })
                      .svgIllustration || "",
                  }}
                />
              )}

              {/* Prose Paragraphs with Inline Dotted Glossary Terms */}
              {(screen.widgetData as { paragraphs: string[] }).paragraphs.map(
                (p, idx) => (
                  <p
                    key={idx}
                    className="text-sm sm:text-base text-slate-700 leading-relaxed"
                  >
                    {/* Render paragraph with dotted-underline glossary matches */}
                    {p.split(" ").map((word, wIdx) => {
                      const cleanWord = word.replace(/[^a-zA-Z]/g, "");
                      const isGlossaryMatch = screen.glossary.some(
                        (g) => g.term.toLowerCase() === cleanWord.toLowerCase()
                      );

                      if (isGlossaryMatch) {
                        return (
                          <React.Fragment key={wIdx}>
                            <button
                              type="button"
                              onClick={() => handleOpenGlossary(cleanWord)}
                              className="border-b-2 border-dotted border-slate-400 font-semibold text-brand-700 hover:text-brand-900 hover:border-brand-600 transition"
                            >
                              {word}
                            </button>{" "}
                          </React.Fragment>
                        );
                      }
                      return word + " ";
                    })}
                  </p>
                )
              )}

              {/* Click-to-Play Audio (Gate: Never autoplay) */}
              {(screen.widgetData as { audioClip?: { url: string; label?: string } })
                .audioClip && (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Volume2 className="w-4 h-4 text-brand-600" />
                    <span>
                      {(screen.widgetData as { audioClip?: { label?: string } })
                        .audioClip?.label || "Audio Explanation (Opus)"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      alert("Optional audio loaded on learner request only.")
                    }
                    className="min-h-tap px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50"
                  >
                    Play (48 KB)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* B. Cloze Widget (Fill-in-the-blank) */}
          {screen.widgetType === "cloze" && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {(screen.widgetData as { prompt: string }).prompt}
              </p>

              {/* Template sentence with blank */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-sm sm:text-base font-medium text-slate-800 leading-relaxed shadow-2xs">
                {(screen.widgetData as { template: string }).template
                  .split("{blank}")
                  .map((chunk, idx, arr) => (
                    <React.Fragment key={idx}>
                      <span>{chunk}</span>
                      {idx < arr.length - 1 && (
                        <span className="inline-block px-3 py-1 mx-1.5 rounded-lg font-bold border-2 border-dashed border-brand-400 bg-brand-50 text-brand-800">
                          {selectedClozeWord || "_______"}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
              </div>

              {/* Tapable Option Tiles (>=44px touch target) */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {(screen.widgetData as { options: string[] }).options.map(
                  (opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={machine.feedbackState.status !== null}
                      onClick={() => setSelectedClozeWord(opt)}
                      className={`min-h-tap p-3 rounded-xl border text-xs sm:text-sm font-bold transition flex items-center justify-center ${
                        selectedClozeWord === opt
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  )
                )}
              </div>

              {/* Submit Button */}
              {machine.feedbackState.status === null && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!selectedClozeWord}
                    onClick={() => handleClozeSubmit(screen)}
                    className={`w-full min-h-tap px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
                      selectedClozeWord
                        ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Check Blank Answer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* C. Choice Widget (Scenario check) */}
          {screen.widgetType === "choice" && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm font-bold text-slate-700">
                {(screen.widgetData as { question: string }).question}
              </p>

              {/* Choice Options */}
              <div className="space-y-2">
                {(
                  screen.widgetData as {
                    options: { id: string; text: string }[];
                  }
                ).options.map((opt) => {
                  const isSelected = selectedChoiceId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={machine.feedbackState.status !== null}
                      onClick={() => setSelectedChoiceId(opt.id)}
                      className={`w-full min-h-tap p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-brand-50 border-brand-600 text-brand-950 ring-1 ring-brand-600"
                          : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <span>{opt.text}</span>
                      <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Check Answer Button */}
              {machine.feedbackState.status === null && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!selectedChoiceId}
                    onClick={() => handleChoiceSubmit(screen)}
                    className={`w-full min-h-tap px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
                      selectedChoiceId
                        ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Check Answer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* D. SwipeDeck, Diagram, MatchPairs (Milestone 3 Core Shell Handlers) */}
          {["swipeDeck", "diagramExplorer", "matchPairs"].includes(
            screen.widgetType
          ) && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Exercise: {screen.title}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Satisfy this active recall checkpoint to unlock the continue step.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  machine.submitAnswer({
                    isCorrect: true,
                    explanation:
                      "Checkpoint completed! In Milestone 4, the full specialized tactile widget will render here.",
                  })
                }
                className="min-h-tap px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition"
              >
                Complete Checkpoint
              </button>
            </div>
          )}
        </div>

        {/* Reading screen Continue button (when not gated by a question) */}
        {screen.widgetType === "reading" && machine.feedbackState.status === null && (
          <div className="pt-8">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full min-h-tap px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm"
            >
              <span>Continue to Checkpoint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* 3. Feedback Panel (Bottom-Sheet Mobile / Right Desktop) */}
      <FeedbackPanel
        status={machine.feedbackState.status}
        explanation={machine.feedbackState.explanation}
        bonusFact={machine.feedbackState.bonusFact}
        isRetryQueued={machine.feedbackState.isRetryQueued}
        onContinue={handleContinue}
        isLastScreen={isLastScreen}
      />

      {/* 4. AI Tutor Slide-Over Drawer */}
      <AITutorDrawer
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
        aiTutor={screen.aiTutor}
        activeContext={
          machine.aiTutorLabel.toLowerCase() as "recap" | "explain" | "review"
        }
        lessonTitle={lesson.title}
      />

      {/* 5. Inline Glossary Drawer */}
      {activeGlossaryTerm && (
        <GlossaryDrawer
          isOpen={Boolean(activeGlossaryTerm)}
          onClose={() => setActiveGlossaryTerm(null)}
          term={activeGlossaryTerm.term}
          definition={activeGlossaryTerm.definition}
        />
      )}
    </div>
  );
}
