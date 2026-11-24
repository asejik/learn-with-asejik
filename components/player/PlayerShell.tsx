"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { Course, Lesson, Screen } from "@/lib/schema";
import { PlayerNavBar } from "./PlayerNavBar";
import { FeedbackPanel } from "./FeedbackPanel";
import { AITutorDrawer } from "./AITutorDrawer";
import { GlossaryDrawer } from "./GlossaryDrawer";
import { LessonCompletionView } from "./LessonCompletionView";
import { StorageWarning } from "./StorageWarning";
import { usePlayerMachine } from "./usePlayerMachine";
import { courseLessons, nextLesson } from "@/lib/courseProgress";
import { RotateCcw } from "lucide-react";

// Modular widgets live in components/widgets/ and are found through the registry
import { WIDGETS } from "../widgets/registry";
import type { WidgetProps } from "../widgets/types";

interface PlayerShellProps {
  course: Course;
  lesson: Lesson;
  /** The privacy notice, rendered on the server for the completion view */
  privacyNotice: ReactNode;
}

export function PlayerShell({ course, lesson, privacyNotice }: PlayerShellProps) {
  const machine = usePlayerMachine(course.slug, lesson, courseLessons(course).length);

  // Drawer states
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<{
    term: string;
    definition: string;
  } | null>(null);

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

  // Handle continue transition to advance to next screen
  function handleContinue() {
    machine.nextScreen();
  }

  // Wait for saved progress before showing a screen, so screen 1 doesn't flash
  if (machine.isRestoring) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <p role="status" className="text-sm font-semibold text-slate-500">
          Restoring your place…
        </p>
        {/* Only appears if this screen is still up after 8 seconds (see globals.css) */}
        <div className="reveal-late text-xs text-slate-600">
          <p>Taking longer than usual. Check your connection, then reload.</p>
          <a
            href=""
            className="mt-2 inline-flex items-center justify-center min-h-tap px-5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition"
          >
            Reload
          </a>
        </div>
      </div>
    );
  }

  // If lesson is complete, render celebration completion view with value-first onboarding
  if (machine.isLessonComplete) {
    return (
      <LessonCompletionView
        course={course}
        lesson={lesson}
        nextLesson={nextLesson(course, lesson.slug)}
        storageFailed={machine.storageFailed}
        privacyNotice={privacyNotice}
      />
    );
  }

  const screen = machine.currentScreen;
  const isLastScreen = machine.currentIndex === machine.totalScreens - 1;
  const isAnswered = machine.feedbackState.status !== null;
  // The registry pairs each type with its own data; TypeScript cannot follow that pairing through a lookup
  const Widget = WIDGETS[screen.widgetType] as ComponentType<WidgetProps<Screen["widgetData"]>>;

  return (
    <div
      className={`min-h-screen bg-slate-50 flex flex-col justify-between ${
        isAnswered ? "lg:pr-96" : ""
      }`}
    >
      {/* 1. Top Navigation Bar */}
      <PlayerNavBar
        totalScreens={machine.totalScreens}
        currentIndex={machine.currentIndex}
        aiTutorLabel={machine.aiTutorLabel}
        onOpenAITutor={() => setIsAITutorOpen(true)}
        courseSlug={course.slug}
      />

      {machine.storageFailed && (
        <div className="max-w-2xl w-full mx-auto px-4 pt-3">
          <StorageWarning />
        </div>
      )}

      {/* 2. Main Screen Interaction Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-between">
        {/* Keyed by position, so a retry of the same question starts fresh
            instead of showing the previous attempt's answer */}
        <div key={`${machine.currentIndex}-${screen.id}`} className="space-y-5">
          {/* Section Breadcrumb & Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-600">
                {course.title}
              </span>
              {machine.isRetry && (
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

          {/* MODULAR WIDGET DELEGATION (components/widgets/registry.ts) */}
          <Widget
            screenId={screen.id}
            data={screen.widgetData}
            glossary={screen.glossary}
            onOpenGlossary={handleOpenGlossary}
            onSubmitAnswer={machine.submitAnswer}
            onExplored={machine.showInfo}
            isAnswered={isAnswered}
            onContinue={handleContinue}
          />
        </div>
      </main>

      {/* 3. Feedback Panel (Bottom-Sheet Mobile / Right Desktop) */}
      <FeedbackPanel
        status={machine.feedbackState.status}
        explanation={machine.feedbackState.explanation}
        bonusFact={machine.feedbackState.bonusFact}
        retryAfterScreens={machine.feedbackState.retryAfterScreens}
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
