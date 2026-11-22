"use client";

import { useState, type ReactNode } from "react";
import { z } from "zod";
import {
  Course,
  Lesson,
  ReadingWidgetDataSchema,
  ClozeWidgetDataSchema,
  ChoiceWidgetDataSchema,
  SwipeDeckWidgetDataSchema,
  DiagramExplorerWidgetDataSchema,
  MatchPairsWidgetDataSchema,
} from "@/lib/schema";
import { PlayerNavBar } from "./PlayerNavBar";
import { FeedbackPanel } from "./FeedbackPanel";
import { AITutorDrawer } from "./AITutorDrawer";
import { GlossaryDrawer } from "./GlossaryDrawer";
import { LessonCompletionView } from "./LessonCompletionView";
import { usePlayerMachine } from "./usePlayerMachine";
import { RotateCcw } from "lucide-react";

// Modular Widgets from components/widgets/
import ReadingWidget from "../widgets/ReadingWidget";
import ClozeWidget from "../widgets/ClozeWidget";
import ChoiceWidget from "../widgets/ChoiceWidget";
import SwipeDeckWidget from "../widgets/SwipeDeckWidget";
import DiagramExplorerWidget from "../widgets/DiagramExplorerWidget";
import MatchPairsWidget from "../widgets/MatchPairsWidget";

interface PlayerShellProps {
  course: Course;
  lesson: Lesson;
  /** The privacy notice, rendered on the server for the completion view */
  privacyNotice: ReactNode;
}

export function PlayerShell({ course, lesson, privacyNotice }: PlayerShellProps) {
  const machine = usePlayerMachine(course.slug, lesson);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p role="status" className="text-sm font-semibold text-slate-500">
          Restoring your place…
        </p>
      </div>
    );
  }

  // If lesson is complete, render celebration completion view with value-first onboarding
  if (machine.isLessonComplete) {
    return <LessonCompletionView course={course} lesson={lesson} privacyNotice={privacyNotice} />;
  }

  const screen = machine.currentScreen;
  const isLastScreen = machine.currentIndex === machine.totalScreens - 1;
  const isAnswered = machine.feedbackState.status !== null;

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

          {/* MODULAR WIDGET DELEGATION (components/widgets/) */}

          {screen.widgetType === "reading" && (
            <ReadingWidget
              screenId={screen.id}
              data={screen.widgetData as z.infer<typeof ReadingWidgetDataSchema>}
              glossary={screen.glossary}
              onOpenGlossary={handleOpenGlossary}
              onSubmitAnswer={machine.submitAnswer}
              isAnswered={isAnswered}
              onContinue={handleContinue}
            />
          )}

          {screen.widgetType === "cloze" && (
            <ClozeWidget
              screenId={screen.id}
              data={screen.widgetData as z.infer<typeof ClozeWidgetDataSchema>}
              glossary={screen.glossary}
              onOpenGlossary={handleOpenGlossary}
              onSubmitAnswer={machine.submitAnswer}
              isAnswered={isAnswered}
            />
          )}

          {screen.widgetType === "choice" && (
            <ChoiceWidget
              screenId={screen.id}
              data={screen.widgetData as z.infer<typeof ChoiceWidgetDataSchema>}
              glossary={screen.glossary}
              onOpenGlossary={handleOpenGlossary}
              onSubmitAnswer={machine.submitAnswer}
              isAnswered={isAnswered}
            />
          )}

          {screen.widgetType === "swipeDeck" && (
            <SwipeDeckWidget
              screenId={screen.id}
              data={
                screen.widgetData as z.infer<typeof SwipeDeckWidgetDataSchema>
              }
              glossary={screen.glossary}
              onOpenGlossary={handleOpenGlossary}
              onSubmitAnswer={machine.submitAnswer}
              isAnswered={isAnswered}
            />
          )}

          {screen.widgetType === "diagramExplorer" && (
            <DiagramExplorerWidget
              screenId={screen.id}
              data={
                screen.widgetData as z.infer<
                  typeof DiagramExplorerWidgetDataSchema
                >
              }
              glossary={screen.glossary}
              onOpenGlossary={handleOpenGlossary}
              onSubmitAnswer={machine.submitAnswer}
              isAnswered={isAnswered}
            />
          )}

          {screen.widgetType === "matchPairs" && (
            <MatchPairsWidget
              screenId={screen.id}
              data={
                screen.widgetData as z.infer<typeof MatchPairsWidgetDataSchema>
              }
              glossary={screen.glossary}
              onOpenGlossary={handleOpenGlossary}
              onSubmitAnswer={machine.submitAnswer}
              isAnswered={isAnswered}
            />
          )}
        </div>
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
