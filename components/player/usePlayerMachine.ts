"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Lesson, Screen } from "@/lib/schema";
import { saveCourseProgress, saveLessonState, getLessonState } from "@/lib/db";
import { isRetryAttempt, planRetry, restorePlayerPosition } from "./lessonProgress";

const STORAGE_KEY_PROGRESS = "asejik_course_progress_v1";

export interface FeedbackState {
  status: "correct" | "incorrect" | "info" | null;
  explanation?: string;
  bonusFact?: string;
  /** Screens before the queued retry (0 = next); null when none is queued */
  retryAfterScreens?: number | null;
}

export function usePlayerMachine(courseSlug: string, lesson: Lesson) {
  // Screen sequence array of screen IDs, starts with initial lesson screens
  const [sequence, setSequence] = useState<string[]>(() =>
    lesson.screens.map((s) => s.id)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    status: null,
  });
  const [isGated, setIsGated] = useState(true);
  const [retryQueue, setRetryQueue] = useState<string[]>([]);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  // True until saved progress has been read back, so screen 1 never flashes
  // before the learner's saved screen appears
  const [isRestoring, setIsRestoring] = useState(true);

  // Map of screen ID to Screen object for fast lookup
  const screenMap = useMemo(() => {
    const map = new Map<string, Screen>();
    lesson.screens.forEach((s) => map.set(s.id, s));
    return map;
  }, [lesson.screens]);

  // Resume where the learner left off (US-04). Saved state that no longer
  // matches the lesson content starts the lesson fresh.
  useEffect(() => {
    let cancelled = false;
    const lessonScreenIds = lesson.screens.map((s) => s.id);

    getLessonState(courseSlug, lesson.slug)
      .then((saved) => {
        if (cancelled) return;
        const restored = restorePlayerPosition(lessonScreenIds, saved);
        if (restored) {
          setSequence(restored.sequence);
          setCurrentIndex(restored.currentIndex);
          setRetryQueue(restored.retryQueue);
          const resumedScreen = lesson.screens.find(
            (s) => s.id === restored.sequence[restored.currentIndex]
          );
          setIsGated(resumedScreen?.widgetType !== "reading");
        }
      })
      .catch((err: unknown) => {
        const reason = err instanceof Error ? err.name : "UnknownError";
        console.warn(`[Player] Could not read saved lesson progress (${reason}); starting fresh`);
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseSlug, lesson.slug, lesson.screens]);

  // Save the position after every step so a reload, or going offline,
  // resumes on the same screen with any queued retries kept
  useEffect(() => {
    if (isRestoring || isLessonComplete) return;
    saveLessonState(courseSlug, lesson.slug, {
      currentScreenIndex: currentIndex,
      sequence,
      retryQueue,
      positionSavedAt: Date.now(),
    })
      .then((saved) => {
        if (!saved) console.warn("[Player] Lesson progress was not saved");
      })
      .catch((err: unknown) => {
        const reason = err instanceof Error ? err.name : "UnknownError";
        console.warn(`[Player] Could not save lesson progress (${reason})`);
      });
  }, [isRestoring, isLessonComplete, courseSlug, lesson.slug, currentIndex, sequence, retryQueue]);

  // Current screen object
  const currentScreenId = sequence[currentIndex] || sequence[0];
  const currentScreen = screenMap.get(currentScreenId) || lesson.screens[0];

  // Dynamic AI Tutor label based on context
  const aiTutorLabel = useMemo<"Recap" | "Explain" | "Review">(() => {
    if (currentScreen.aiTutor?.recap) return "Recap";
    if (currentScreen.aiTutor?.explain) return "Explain";
    if (currentScreen.aiTutor?.review) return "Review";
    if (currentScreen.widgetType === "reading") return "Recap";
    return "Explain";
  }, [currentScreen]);

  // Ungate continue button (e.g. for reading widgets or satisfied inputs)
  const ungate = useCallback(() => {
    setIsGated(false);
  }, []);

  // Submit active recall answer
  const submitAnswer = useCallback(
    ({
      isCorrect,
      explanation,
      bonusFact,
    }: {
      isCorrect: boolean;
      explanation?: string;
      bonusFact?: string;
    }) => {
      // Ungate continue button upon answer submission
      setIsGated(false);

      if (isCorrect) {
        setFeedbackState({
          status: "correct",
          explanation,
          bonusFact,
          retryAfterScreens: null,
        });
      } else {
        // Active recall: the question comes back once (see planRetry)
        const screenToRetry = currentScreen.id;
        const retry = planRetry(sequence, currentIndex, screenToRetry);
        if (retry) {
          setSequence(retry.sequence);
          setRetryQueue((prev) => [...prev, screenToRetry]);
        }

        setFeedbackState({
          status: "incorrect",
          explanation:
            explanation ||
            (retry
              ? "This question will come back for one more try."
              : "Take a moment to review this concept, then continue."),
          bonusFact,
          retryAfterScreens: retry ? retry.screensBefore : null,
        });
      }
    },
    [currentIndex, currentScreen.id, sequence]
  );

  // Exploration finished (no right or wrong): blue Info feedback
  const showInfo = useCallback(
    ({ explanation, bonusFact }: { explanation: string; bonusFact?: string }) => {
      setIsGated(false);
      setFeedbackState({ status: "info", explanation, bonusFact, retryAfterScreens: null });
    },
    []
  );

  // Advance to next screen
  const nextScreen = useCallback(() => {
    const nextIdx = currentIndex + 1;

    if (nextIdx < sequence.length) {
      setCurrentIndex(nextIdx);
      setFeedbackState({ status: null });

      // Automatically ungate reading screens; gate interactive checks
      const nextScreenObj = screenMap.get(sequence[nextIdx]);
      setIsGated(nextScreenObj?.widgetType !== "reading");
    } else {
      // Completed all screens in sequence (including retries)
      setIsLessonComplete(true);
      setFeedbackState({ status: null });

      // Safely record completion in IndexedDB and localStorage (Question 9 resilience)
      saveCourseProgress(courseSlug, lesson.slug, 100);
      saveLessonState(courseSlug, lesson.slug, {
        currentScreenIndex: nextIdx,
        completedScreenIds: sequence,
        retryQueue,
        completedAt: Date.now(),
      });

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const raw = window.localStorage.getItem(STORAGE_KEY_PROGRESS);
          const existing = raw ? JSON.parse(raw) : {};
          existing[courseSlug] = 100;
          window.localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(existing));
        }
      } catch {
        // Storage failure fallback
      }
    }
  }, [currentIndex, sequence, screenMap, courseSlug, lesson.slug, retryQueue]);

  return {
    currentIndex,
    totalScreens: sequence.length,
    currentScreen,
    aiTutorLabel,
    isGated,
    feedbackState,
    retryQueue,
    /** The current screen is a retry of an earlier wrong answer */
    isRetry: isRetryAttempt(sequence, currentIndex),
    isLessonComplete,
    isRestoring,
    ungate,
    submitAnswer,
    showInfo,
    nextScreen,
  };
}
