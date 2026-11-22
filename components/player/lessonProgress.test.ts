import { describe, it, expect } from "vitest";
import { isRetryAttempt, planRetry, restorePlayerPosition, retryLabel } from "./lessonProgress";

const SCREEN_IDS = ["s1", "s2", "s3", "s4", "s5"];

function record(overrides: Record<string, unknown> = {}) {
  return {
    key: "course_lesson",
    courseSlug: "course",
    lessonSlug: "lesson",
    currentScreenIndex: 2,
    completedScreenIds: [],
    retryQueue: [],
    sequence: [...SCREEN_IDS],
    positionSavedAt: 2000,
    ...overrides,
  };
}

describe("restorePlayerPosition", () => {
  it("resumes at the saved screen", () => {
    expect(restorePlayerPosition(SCREEN_IDS, record())).toEqual({
      sequence: SCREEN_IDS,
      currentIndex: 2,
      retryQueue: [],
    });
  });

  it("keeps retry screens queued after a wrong answer", () => {
    const sequence = ["s1", "s2", "s3", "s4", "s5", "s2"];
    expect(
      restorePlayerPosition(
        SCREEN_IDS,
        record({ sequence, currentScreenIndex: 3, retryQueue: ["s2"] })
      )
    ).toEqual({ sequence, currentIndex: 3, retryQueue: ["s2"] });
  });

  it("starts fresh when there is no saved state", () => {
    expect(restorePlayerPosition(SCREEN_IDS, null)).toBeNull();
    expect(restorePlayerPosition(SCREEN_IDS, undefined)).toBeNull();
  });

  it("starts fresh for records saved before positions were stored", () => {
    expect(restorePlayerPosition(SCREEN_IDS, record({ sequence: undefined }))).toBeNull();
  });

  it("starts fresh when a saved screen was removed from the lesson", () => {
    expect(
      restorePlayerPosition(SCREEN_IDS, record({ sequence: ["s1", "s2", "gone", "s4", "s5"] }))
    ).toBeNull();
    expect(
      restorePlayerPosition(SCREEN_IDS, record({ retryQueue: ["gone"] }))
    ).toBeNull();
  });

  it("starts fresh when a screen was added to the lesson", () => {
    expect(
      restorePlayerPosition([...SCREEN_IDS, "s6"], record())
    ).toBeNull();
  });

  it("starts fresh when the saved index is out of bounds or not an integer", () => {
    for (const bad of [-1, 5, 99, 1.5, Number.NaN, "2", null]) {
      expect(restorePlayerPosition(SCREEN_IDS, record({ currentScreenIndex: bad }))).toBeNull();
    }
  });

  it("starts fresh after the lesson was finished", () => {
    expect(
      restorePlayerPosition(SCREEN_IDS, record({ completedAt: 3000, positionSavedAt: 2000 }))
    ).toBeNull();
    expect(
      restorePlayerPosition(SCREEN_IDS, record({ completedAt: 3000, positionSavedAt: undefined }))
    ).toBeNull();
  });

  it("resumes a retake that was started after the lesson was finished", () => {
    expect(
      restorePlayerPosition(SCREEN_IDS, record({ completedAt: 3000, positionSavedAt: 4000 }))
    ).toEqual({ sequence: SCREEN_IDS, currentIndex: 2, retryQueue: [] });
  });

  it("starts fresh for garbled data", () => {
    for (const garbled of ["text", 42, [], { sequence: "s1" }, record({ sequence: [1, 2, 3, 4, 5] }), record({ retryQueue: "s2" })]) {
      expect(restorePlayerPosition(SCREEN_IDS, garbled)).toBeNull();
    }
  });
});

describe("planRetry", () => {
  const LESSON = ["s1", "s2", "s3", "s4", "s5", "s6"];

  it("brings a wrong answer back after three other screens", () => {
    expect(planRetry(LESSON, 1, "s2")).toEqual({
      sequence: ["s1", "s2", "s3", "s4", "s5", "s2", "s6"],
      screensBefore: 3,
    });
  });

  it("puts the retry at the end, and says how close it is, when fewer screens remain", () => {
    expect(planRetry(LESSON, 4, "s5")).toEqual({
      sequence: ["s1", "s2", "s3", "s4", "s5", "s6", "s5"],
      screensBefore: 1,
    });
    expect(planRetry(LESSON, 5, "s6")).toEqual({
      sequence: [...LESSON, "s6"],
      screensBefore: 0,
    });
  });

  it("does not queue a question a second time, so the lesson always ends", () => {
    const withRetry = [...LESSON, "s2"];
    expect(planRetry(withRetry, 6, "s2")).toBeNull();
  });

  it("never grows an old saved sequence that already holds extra copies", () => {
    const oldSave = [...LESSON, "s2", "s2", "s2"];
    expect(planRetry(oldSave, 1, "s2")).toBeNull();
    expect(planRetry(oldSave, oldSave.length - 1, "s2")).toBeNull();
  });

  it("finishes even if every answer, first try and retry, is wrong", () => {
    let sequence = [...LESSON];
    for (let index = 0; index < sequence.length; index++) {
      sequence = planRetry(sequence, index, sequence[index])?.sequence ?? sequence;
    }
    expect(sequence).toHaveLength(LESSON.length * 2);
  });
});

describe("retryLabel", () => {
  it("says how far away the retry is", () => {
    expect(retryLabel(0)).toBe("Retry next");
    expect(retryLabel(1)).toBe("Retry after 1 screen");
    expect(retryLabel(3)).toBe("Retry after 3 screens");
  });
});

describe("isRetryAttempt", () => {
  it("is false on the first attempt and true on the retry", () => {
    const sequence = ["s1", "s2", "s3", "s2"];
    expect(isRetryAttempt(sequence, 1)).toBe(false);
    expect(isRetryAttempt(sequence, 3)).toBe(true);
    expect(isRetryAttempt(sequence, 0)).toBe(false);
  });
});
