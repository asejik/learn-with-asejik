import { describe, it, expect } from "vitest";
import { courseLessons, coursePercent, nextLesson, resumeLesson } from "./courseProgress";
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
});
