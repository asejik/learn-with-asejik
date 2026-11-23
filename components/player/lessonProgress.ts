/**
 * Resume rules for the lesson player (US-04).
 *
 * Takes the saved lesson state (read back from IndexedDB, so treated as
 * untrusted) and decides where the learner should resume. Returns null when
 * the lesson should start from the first screen instead.
 */

export interface RestoredPosition {
  sequence: string[];
  currentIndex: number;
  retryQueue: string[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function restorePlayerPosition(
  lessonScreenIds: string[],
  saved: unknown
): RestoredPosition | null {
  if (typeof saved !== "object" || saved === null || Array.isArray(saved)) {
    return null;
  }
  const record = saved as Record<string, unknown>;
  const { sequence, retryQueue, currentScreenIndex, completedAt, positionSavedAt } = record;

  // Finished lessons start again from the top, unless a retake has been
  // saved since the finish.
  if (typeof completedAt === "number") {
    if (typeof positionSavedAt !== "number" || positionSavedAt <= completedAt) {
      return null;
    }
  }

  if (!isStringArray(sequence) || !isStringArray(retryQueue)) {
    return null;
  }

  // The saved order must still match the lesson: every saved screen exists,
  // and every lesson screen is in the saved order. Extra entries can only be
  // retry repeats. Anything else means the content changed after a redeploy.
  const known = new Set(lessonScreenIds);
  if (!sequence.every((id) => known.has(id)) || !retryQueue.every((id) => known.has(id))) {
    return null;
  }
  const savedIds = new Set(sequence);
  if (!lessonScreenIds.every((id) => savedIds.has(id))) {
    return null;
  }

  if (
    typeof currentScreenIndex !== "number" ||
    !Number.isInteger(currentScreenIndex) ||
    currentScreenIndex < 0 ||
    currentScreenIndex >= sequence.length
  ) {
    return null;
  }

  return { sequence, currentIndex: currentScreenIndex, retryQueue };
}

/**
 * Active-recall retry rules. A wrongly answered question comes back once,
 * three screens later (or at the end if fewer remain). A question that was
 * already retried is not queued again, so every lesson can be finished.
 */
export const RETRY_GAP_SCREENS = 3;
export const MAX_ATTEMPTS_PER_SCREEN = 2;

export interface RetryPlan {
  /** The screen order with the retry inserted */
  sequence: string[];
  /** How many screens come before the retry (0 means it is next) */
  screensBefore: number;
}

export function planRetry(
  sequence: string[],
  currentIndex: number,
  screenId: string
): RetryPlan | null {
  const timesScheduled = sequence.filter((id) => id === screenId).length;
  if (timesScheduled >= MAX_ATTEMPTS_PER_SCREEN) return null;

  const insertIndex = Math.min(currentIndex + RETRY_GAP_SCREENS + 1, sequence.length);
  const next = [...sequence];
  next.splice(insertIndex, 0, screenId);
  return { sequence: next, screensBefore: insertIndex - currentIndex - 1 };
}

/** Badge text for a queued retry, e.g. "Retry next" or "Retry after 3 screens". */
export function retryLabel(screensBefore: number): string {
  if (screensBefore === 0) return "Retry next";
  return `Retry after ${screensBefore} screen${screensBefore === 1 ? "" : "s"}`;
}

/** True when the screen at this position is a retry, not the first attempt. */
export function isRetryAttempt(sequence: string[], index: number): boolean {
  return index > sequence.indexOf(sequence[index]);
}

/** How long to wait for saved progress before starting the lesson fresh. */
export const RESTORE_TIMEOUT_MS = 3000;

export type TimedRead<T> = { timedOut: false; value: T } | { timedOut: true };

/** Resolves with the read's value, or `{ timedOut: true }` if it takes too long. */
export function readWithTimeout<T>(read: Promise<T>, ms: number): Promise<TimedRead<T>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ timedOut: true }), ms);
    read.then(
      (value) => {
        clearTimeout(timer);
        resolve({ timedOut: false, value });
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
