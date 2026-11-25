import { describe, it, expect } from "vitest";
import {
  courseLessons,
  coursePercent,
  hasStartedCourse,
  lessonRows,
  nextLesson,
  partialLessons,
  resumeLesson,
} from "./courseProgress";
import type { Course } from "./schema";

const lesson = (slug: string) => ({ slug, title: `Lesson ${slug}` });
const course = {
  slug: "c",
  chapters: [
    { id: "ch1", title: "One", lessons: [lesson("a"), lesson("b")] },
    { id: "ch2", title: "Two", lessons: [lesson("c")] },
  ],
} as unknown as Course;

describe("courseProgress", () => {
  it("lists lessons in order across chapters", () => {
    expect(courseLessons(course).map((l) => l.slug)).toEqual(["a", "b", "c"]);
  });

  it("is not 100% after one lesson of three", () => {
    expect(coursePercent(course, [])).toBe(0);
    expect(coursePercent(course, ["a"])).toBe(33);
    expect(coursePercent(course, ["a", "b"])).toBe(67);
    expect(coursePercent(course, ["a", "b", "c"])).toBe(100);
  });

  it("ignores completed lessons that are no longer in the course", () => {
    expect(coursePercent(course, ["a", "gone", "other"])).toBe(33);
  });

  it("a one-lesson course is 100% once its lesson is done", () => {
    const single = { ...course, chapters: [{ id: "x", title: "X", lessons: [lesson("only")] }] } as Course;
    expect(coursePercent(single, ["only"])).toBe(100);
  });

  it("finds the next lesson, and none after the last", () => {
    expect(nextLesson(course, "a")?.slug).toBe("b");
    expect(nextLesson(course, "b")?.slug).toBe("c");
    expect(nextLesson(course, "c")).toBeNull();
    expect(nextLesson(course, "unknown")).toBeNull();
  });

  it("resumes at the first unfinished lesson, or the start when all are done", () => {
    expect(resumeLesson(course, [])?.slug).toBe("a");
    expect(resumeLesson(course, ["a"])?.slug).toBe("b");
    expect(resumeLesson(course, ["a", "c"])?.slug).toBe("b");
    expect(resumeLesson(course, ["a", "b", "c"])?.slug).toBe("a");
  });

  describe("lessons in progress", () => {
    const partial = partialLessons([
      { lessonSlug: "b", currentScreenIndex: 3, sequence: ["1", "2", "3", "4", "5", "6"], positionSavedAt: 200 },
    ]);

    it("counts how far through an open lesson the learner is", () => {
      expect(partial.b.fraction).toBe(0.5);
      expect(coursePercent(course, ["a"], partial)).toBe(50); // (1 + 0.5) / 3
    });

    it("never counts an open lesson as finished", () => {
      const last = partialLessons([{ lessonSlug: "a", currentScreenIndex: 5, sequence: ["1", "2", "3", "4", "5", "6"], positionSavedAt: 1 }]);
      expect(last.a.fraction).toBeLessThan(1);
    });

    it("a lesson opened on its first screen is started but at 0%", () => {
      const fresh = partialLessons([{ lessonSlug: "a", currentScreenIndex: 0, sequence: ["1", "2"], positionSavedAt: 1 }]);
      expect(coursePercent(course, [], fresh)).toBe(0);
      expect(hasStartedCourse(course, [], fresh)).toBe(true);
      expect(hasStartedCourse(course, [], {})).toBe(false);
    });

    it("ignores a finished lesson with no later position", () => {
      expect(partialLessons([{ lessonSlug: "a", positionSavedAt: 5, completedAt: 9 }])).toEqual({});
    });

    it("resumes the open lesson saved last", () => {
      expect(resumeLesson(course, ["a"], partial)?.slug).toBe("b");
      const both = { ...partial, c: { fraction: 0.2, savedAt: 300 } };
      expect(resumeLesson(course, ["a"], both)?.slug).toBe("c");
    });
  });

  describe("lesson list", () => {
    const flat = (done: string[], partial = {}, current = "a") =>
      lessonRows(course, done, partial, current).flatMap((c) => c.lessons.map((l) => [l.slug, l.status, l.canOpen]));

    it("opens only the first lesson on a fresh start", () => {
      expect(flat([])).toEqual([["a", "in-progress", true], ["b", "locked", false], ["c", "locked", false]]);
    });

    it("opens finished lessons and the next one, and keeps later ones locked", () => {
      expect(flat(["a"], {}, "b")).toEqual([["a", "done", true], ["b", "in-progress", true], ["c", "locked", false]]);
      expect(flat(["a", "b"], {}, "a")).toEqual([["a", "done", true], ["b", "done", true], ["c", "next", true]]);
    });

    it("a finished course has every lesson open", () => {
      expect(flat(["a", "b", "c"]).every(([, , open]) => open)).toBe(true);
    });

    it("marks a lesson that is partly done, and groups by chapter", () => {
      const rows = lessonRows(course, ["a"], { b: { fraction: 0.4, savedAt: 1 } }, "a");
      expect(rows.map((c) => c.chapterId)).toEqual(["ch1", "ch2"]);
      expect(rows[0].lessons[1].status).toBe("in-progress");
      expect(rows[0].lessons[0].isCurrent).toBe(true);
    });
  });
});
