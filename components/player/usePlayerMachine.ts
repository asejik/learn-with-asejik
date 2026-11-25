"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Lesson, Screen } from "@/lib/schema";
import { saveCourseProgress, saveLessonState, getLessonState } from "@/lib/db";
import {
  RESTORE_TIMEOUT_MS,
  isRetryAttempt,
  planRetry,
  readWithTimeout,
  restorePlayerPosition,
} from "./lessonProgress";

const STORAGE_KEY_PROGRESS = "asejik_course_progress_v1";

export interface FeedbackState {
  status: "correct" | "incorrect" | "info" | null;
  explanation?: string;
  bonusFact?: string;
  /** Screens before the queued retry (0 = next); null when none is queued */
  retryAfterScreens?: number | null;
  /** Set for one step inside a screen: the panel button runs this, not the next screen */
  onContinue?: () => void;
  continueLabel?: string;
}

export function usePlayerMachine(courseSlug: string, lesson: Lesson, totalLessons: number) {
  // Screen sequence array of screen IDs, starts with initial lesson screens
  const [sequence, setSequence] = useState<string[]>(() =>
    lesson.screens.map((s) => s.id)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  // Set while the learner looks back at an earlier screen. The saved place and
  // the retry queue always follow currentIndex, never this.
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const isReviewing = reviewIndex !== null;
  const viewIndex = reviewIndex ?? currentIndex;
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    status: null,
  });
  const [isGated, setIsGated] = useState(true);
  const [retryQueue, setRetryQueue] = useState<string[]>([]);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  // True until saved progress has been read back, so screen 1 never flashes
  // before the learner's saved screen appears
  const [isRestoring, setIsRestoring] = useState(true);
  // Set when saved progress did not load in time. Storage may only be slow, so
  // this visit must not overwrite the learner's saved position.
  const restoreTimedOut = useRef(false);
  // Set when a save did not reach the phone's storage (full, blocked, private
  // browsing), so the learner is told progress may be lost
  const [storageFailed, setStorageFailed] = useState(false);

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

    readWithTimeout(getLessonState(courseSlug, lesson.slug), RESTORE_TIMEOUT_MS)
      .then((read) => {
        if (cancelled) return;
        if (read.timedOut) {
          restoreTimedOut.current = true;
          console.warn("[Player] Saved lesson progress did not load in time; starting fresh");
          return;
        }
        const restored = restorePlayerPosition(lessonScreenIds, read.value);
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
    if (isRestoring || isLessonComplete || restoreTimedOut.current) return;
    saveLessonState(courseSlug, lesson.slug, {
      currentScreenIndex: currentIndex,
      sequence,
      retryQueue,
      positionSavedAt: Date.now(),
    })
      .then((saved) => {
        if (!saved) {
          console.warn("[Player] Lesson progress was not saved");
          setStorageFailed(true);
        }
      })
      .catch((err: unknown) => {
        const reason = err instanceof Error ? err.name : "UnknownError";
        console.warn(`[Player] Could not save lesson progress (${reason})`);
        setStorageFailed(true);
      });
  }, [isRestoring, isLessonComplete, courseSlug, lesson.slug, currentIndex, sequence, retryQueue]);

  // Current screen object
  const currentScreenId = sequence[viewIndex] || sequence[0];
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

      // Looking back is practice: show the feedback, but queue no retry
      if (isReviewing) {
        setFeedbackState({
          status: isCorrect ? "correct" : "incorrect",
          explanation:
            explanation || (isCorrect ? undefined : "Take a moment to review this concept, then continue."),
          bonusFact,
          retryAfterScreens: null,
        });
        return;
      }

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
    [currentIndex, currentScreen.id, sequence, isReviewing]
  );

  // Feedback for one card of a deck. The screen is not finished, so there is
  // no retry and nothing is saved; the panel button moves to the next card.
  const showCardFeedback = useCallback(
    ({
      isCorrect,
      explanation,
      bonusFact,
      continueLabel,
      onContinue,
    }: {
      isCorrect: boolean;
      explanation: string;
      bonusFact?: string;
      continueLabel: string;
      onContinue: () => void;
    }) => {
      setFeedbackState({
        status: isCorrect ? "correct" : "incorrect",
        explanation,
        bonusFact: isCorrect ? bonusFact : undefined,
        retryAfterScreens: null,
        continueLabel,
        onContinue,
      });
    },
    []
  );

  const clearFeedback = useCallback(() => setFeedbackState({ status: null }), []);

  // Exploration finished (no right or wrong): blue Info feedback
  const showInfo = useCallback(
    ({ explanation, bonusFact }: { explanation: string; bonusFact?: string }) => {
      setIsGated(false);
      setFeedbackState({ status: "info", explanation, bonusFact, retryAfterScreens: null });
    },
    []
  );

  // Move the view to a screen and reset its feedback and gate
  const showScreenAt = useCallback(
    (index: number) => {
      setFeedbackState({ status: null });
      setIsGated(screenMap.get(sequence[index])?.widgetType !== "reading");
    },
    [screenMap, sequence]
  );

  // Look at the screen before the one on show (practice only, nothing is scored)
  const previousScreen = useCallback(() => {
    if (viewIndex <= 0) return;
    setReviewIndex(viewIndex - 1);
    showScreenAt(viewIndex - 1);
  }, [viewIndex, showScreenAt]);

  // Leave review and return to the screen the learner had reached
  const backToCurrent = useCallback(() => {
    setReviewIndex(null);
    showScreenAt(currentIndex);
  }, [currentIndex, showScreenAt]);

  // Advance to next screen
  const nextScreen = useCallback(() => {
    if (reviewIndex !== null) {
      const next = reviewIndex + 1;
      setReviewIndex(next >= currentIndex ? null : next);
      showScreenAt(Math.min(next, currentIndex));
      return;
    }
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
      const courseSaved = saveCourseProgress(courseSlug, lesson.slug, totalLessons);
      saveLessonState(courseSlug, lesson.slug, {
        currentScreenIndex: nextIdx,
        completedScreenIds: sequence,
        retryQueue,
        completedAt: Date.now(),
      })
        .then((saved) => {
          if (!saved) setStorageFailed(true);
        })
        .catch(() => setStorageFailed(true));

      // The catalog's fallback copy holds the course percentage, not the lesson's
      courseSaved
        .then(({ percentage, persisted }) => {
          if (!persisted) setStorageFailed(true);
          if (typeof window !== "undefined" && window.localStorage) {
            const raw = window.localStorage.getItem(STORAGE_KEY_PROGRESS);
            const existing = raw ? JSON.parse(raw) : {};
            existing[courseSlug] = percentage;
            window.localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(existing));
          }
        })
        .catch((error) => {
          console.warn("Could not save the course progress copy", error);
        });
    }
  }, [
    reviewIndex,
    showScreenAt,
    currentIndex,
    sequence,
    screenMap,
    courseSlug,
    lesson.slug,
    retryQueue,
    totalLessons,
  ]);

  return {
    currentIndex,
    /** The screen on show: the learner's place, or an earlier one in review */
    viewIndex,
    isReviewing,
    totalScreens: sequence.length,
    currentScreen,
    aiTutorLabel,
    isGated,
    feedbackState,
    retryQueue,
    /** The current screen is a retry of an earlier wrong answer */
    isRetry: isRetryAttempt(sequence, viewIndex),
    isLessonComplete,
    storageFailed,
    isRestoring,
    ungate,
    submitAnswer,
    showInfo,
    showCardFeedback,
    clearFeedback,
    nextScreen,
    previousScreen,
    backToCurrent,
  };
}
