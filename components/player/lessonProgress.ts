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
