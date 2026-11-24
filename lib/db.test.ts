import { describe, expect, it } from "vitest";
import { getCourseProgress, saveCourseProgress, saveLessonState } from "./db";

// Vitest runs in Node, where there is no IndexedDB: the same situation as a
// phone whose storage is blocked or full.
describe("when the phone's storage is unavailable", () => {
  it("still counts progress but says it was not saved to storage", async () => {
    const result = await saveCourseProgress("course-a", "lesson-1", 4);
    expect(result).toEqual({ percentage: 25, persisted: false });
    expect((await getCourseProgress("course-a"))?.completedLessonSlugs).toEqual(["lesson-1"]);
  });

  it("reports a lesson-position save as not saved", async () => {
    expect(await saveLessonState("course-a", "lesson-1", { currentScreenIndex: 2 })).toBe(false);
  });
});
