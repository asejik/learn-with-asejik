"use client";

import { useState, useMemo, useCallback } from "react";
import { Lesson, Screen } from "@/lib/schema";
import { saveCourseProgress, saveLessonState } from "@/lib/db";

const STORAGE_KEY_PROGRESS = "asejik_course_progress_v1";

export interface FeedbackState {
  status: "correct" | "incorrect" | "info" | null;
  explanation?: string;
  bonusFact?: string;
  isRetryQueued?: boolean;
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

  // Map of screen ID to Screen object for fast lookup
  const screenMap = useMemo(() => {
    const map = new Map<string, Screen>();
    lesson.screens.forEach((s) => map.set(s.id, s));
    return map;
  }, [lesson.screens]);

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
          isRetryQueued: false,
        });
      } else {
        // Active recall: queue this screen ID to reappear 3 screens later
        const screenToRetry = currentScreen.id;
        setRetryQueue((prev) => [...prev, screenToRetry]);

        setSequence((prevSeq) => {
          // Re-insert 3 screens later (or at the end if fewer remain)
          const insertIdx = Math.min(currentIndex + 4, prevSeq.length);
          const nextSeq = [...prevSeq];
          nextSeq.splice(insertIdx, 0, screenToRetry);
          return nextSeq;
        });

        setFeedbackState({
          status: "incorrect",
          explanation:
            explanation ||
            "Not quite right. We've queued this concept to reappear in 3 screens to lock it into memory!",
          bonusFact,
          isRetryQueued: true,
        });
      }
    },
    [currentIndex, currentScreen.id]
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
    isLessonComplete,
    ungate,
    submitAnswer,
    nextScreen,
  };
}
