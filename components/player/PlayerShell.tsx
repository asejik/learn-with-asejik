"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { Course, Lesson, Screen } from "@/lib/schema";
import { PlayerNavBar } from "./PlayerNavBar";
import { FeedbackPanel } from "./FeedbackPanel";
import { AITutorDrawer } from "./AITutorDrawer";
import { GlossaryDrawer } from "./GlossaryDrawer";
import { LessonCompletionView } from "./LessonCompletionView";
import { LessonsDrawer } from "./LessonsDrawer";
import { CourseFinishCard, LessonIntroCard, LessonRecapCard, type RelatedCourse } from "./BookendCards";
import { StorageWarning } from "./StorageWarning";
import { usePlayerMachine } from "./usePlayerMachine";
import { courseLessons, nextLesson } from "@/lib/courseProgress";
import { Info, RotateCcw } from "lucide-react";

// Modular widgets live in components/widgets/ and are found through the registry
import { WIDGETS } from "../widgets/registry";
import type { WidgetProps } from "../widgets/types";

interface PlayerShellProps {
  course: Course;
  lesson: Lesson;
  /** The privacy notice, rendered on the server for the completion view */
  privacyNotice: ReactNode;
  /** Course suggested on the last lesson, if the course names one */
  relatedCourse: RelatedCourse | null;
}

export function PlayerShell({ course, lesson, privacyNotice, relatedCourse }: PlayerShellProps) {
  const machine = usePlayerMachine(course.slug, lesson, courseLessons(course).length);

  // Opening and closing cards sit around the screens; they are not screens,
  // so the saved place, the retry queue and the progress rail do not change
  const [introSeen, setIntroSeen] = useState(false);
  const [recapSeen, setRecapSeen] = useState(false);
  const [finishSeen, setFinishSeen] = useState(false);

  // Drawer states
  const [isLessonsOpen, setIsLessonsOpen] = useState(false);
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<{
    term: string;
    definition: string;
    example?: string;
  } | null>(null);

  // Helper to open glossary term
  function handleOpenGlossary(term: string) {
    const found = machine.currentScreen.glossary.find(
      (g) => g.term.toLowerCase() === term.toLowerCase()
    );
    // A term with no authored definition opens nothing: no invented text
    if (found) setActiveGlossaryTerm(found);
  }

  // Handle continue transition to advance to next screen
  function handleContinue() {
    // One step inside a screen (a card in a deck): run its own handler
    const stepContinue = machine.feedbackState.onContinue;
    if (stepContinue) {
      machine.clearFeedback();
      stepContinue();
      return;
    }
    machine.nextScreen();
  }

  // The list of lessons, for a course with more than one lesson
  const hasSeveralLessons = courseLessons(course).length > 1;
  const openLessons = hasSeveralLessons ? () => setIsLessonsOpen(true) : undefined;
  const lessonsDrawer = hasSeveralLessons ? (
    <LessonsDrawer
      isOpen={isLessonsOpen}
      onClose={() => setIsLessonsOpen(false)}
      course={course}
      currentSlug={lesson.slug}
    />
  ) : null;

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
            className="mt-2 inline-flex items-center justify-center min-h-tap px-5 rounded-full bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition"
          >
            Reload
          </a>
        </div>
      </div>
    );
  }

  if (machine.isLessonComplete && !recapSeen) {
    return (
      <>
        <LessonRecapCard lesson={lesson} onContinue={() => setRecapSeen(true)} onOpenLessons={openLessons} />
        {lessonsDrawer}
      </>
    );
  }

  const isLastLesson = nextLesson(course, lesson.slug) === null;
  if (machine.isLessonComplete && isLastLesson && !finishSeen) {
    return (
      <>
        <CourseFinishCard
          course={course}
          related={relatedCourse}
          onContinue={() => setFinishSeen(true)}
          onOpenLessons={openLessons}
        />
        {lessonsDrawer}
      </>
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

  // The first lesson of a course also opens with the course overview
  if (!introSeen && machine.currentIndex === 0 && !machine.isReviewing) {
    return (
      <>
        <LessonIntroCard
          course={course}
          lesson={lesson}
          isFirstLesson={courseLessons(course)[0]?.slug === lesson.slug}
          onStart={() => setIntroSeen(true)}
          onOpenLessons={openLessons}
        />
        {lessonsDrawer}
      </>
    );
  }

  const screen = machine.currentScreen;
  const isLastScreen = !machine.isReviewing && machine.currentIndex === machine.totalScreens - 1;
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
        currentIndex={machine.viewIndex}
        onBack={machine.viewIndex > 0 ? machine.previousScreen : undefined}
        aiTutorLabel={machine.aiTutorLabel}
        onOpenAITutor={() => setIsAITutorOpen(true)}
        onOpenLessons={openLessons}
        courseSlug={course.slug}
      />

      {machine.storageFailed && (
        <div className="max-w-2xl w-full mx-auto px-4 pt-3">
          <StorageWarning />
        </div>
      )}

      {machine.isReviewing && (
        <div className="max-w-2xl w-full mx-auto px-4 pt-3">
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-sm text-sky-800"
          >
            <span className="inline-flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-sky-600" aria-hidden="true" />
              Looking back. Answers here are practice and are not scored.
            </span>
            <button
              type="button"
              onClick={machine.backToCurrent}
              className="min-h-tap px-3 font-semibold underline underline-offset-2 hover:text-sky-900"
            >
              Back to where you were
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Screen Interaction Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-between">
        {/* Keyed by position, so a retry of the same question starts fresh
            instead of showing the previous attempt's answer */}
        <div key={`${machine.viewIndex}-${screen.id}`} className="space-y-5">
          {/* Section Breadcrumb & Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                {course.title}
              </span>
              {machine.isRetry && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Active Recall Retry</span>
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-slate-900 tracking-tight leading-tight">
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
            onCardFeedback={machine.showCardFeedback}
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
        continueLabel={machine.feedbackState.continueLabel}
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

      {lessonsDrawer}

      {/* 5. Inline Glossary Drawer */}
      {activeGlossaryTerm && (
        <GlossaryDrawer
          isOpen={Boolean(activeGlossaryTerm)}
          onClose={() => setActiveGlossaryTerm(null)}
          term={activeGlossaryTerm.term}
          definition={activeGlossaryTerm.definition}
          example={activeGlossaryTerm.example}
        />
      )}
    </div>
  );
}
