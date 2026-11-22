import { describe, it, expect } from "vitest";
import { buildRedirects, flatSegmentName } from "./hosting";
import { getAllCourses } from "./content";

describe("buildRedirects", () => {
  it("sends each real course address to its first lesson", () => {
    expect(buildRedirects(getAllCourses())).toBe(
      "/courses/how-apis-work /courses/how-apis-work/01-what-is-an-api 307\n"
    );
  });

  it("sends a course with no lessons to the catalog", () => {
    const [course] = getAllCourses();
    expect(buildRedirects([{ ...course, chapters: [] }])).toBe(
      `/courses/${course.slug} / 307\n`
    );
  });
});

describe("flatSegmentName", () => {
  it("joins nested segment data into the dotted name the browser requests", () => {
    expect(flatSegmentName("__next.courses/$d$courseSlug/$d$lessonSlug/__PAGE__.txt")).toBe(
      "__next.courses.$d$courseSlug.$d$lessonSlug.__PAGE__.txt"
    );
    // Windows path separators too
    expect(flatSegmentName("__next.courses\\$d$courseSlug\\__PAGE__.txt")).toBe(
      "__next.courses.$d$courseSlug.__PAGE__.txt"
    );
  });

  it("leaves files that are already flat or are not segment data", () => {
    expect(flatSegmentName("__next._tree.txt")).toBeNull();
    expect(flatSegmentName("_next/static/chunks/a.js")).toBeNull();
    expect(flatSegmentName("__next.courses/readme.md")).toBeNull();
  });
});
