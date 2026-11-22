import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { CourseSchema, LessonSchema, ChoiceWidgetDataSchema } from "./schema";

// Guards the content rules so a library upgrade cannot quietly loosen them.

const COURSE_DIR = path.join(process.cwd(), "content", "courses", "how-apis-work");

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(COURSE_DIR, file), "utf-8"));
}

const course = readJson("course.json");
const lesson = readJson("lessons/01-what-is-an-api.json");

// A copy of a parsed JSON object with one field removed.
function without(source: Record<string, unknown>, field: string) {
  const copy = { ...source };
  delete copy[field];
  return copy;
}

function issueMessages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues ?? []).map((i) => i.message);
}

describe("content schema", () => {
  it("accepts the real course and lesson files", () => {
    expect(CourseSchema.safeParse(course).success).toBe(true);
    expect(LessonSchema.safeParse(lesson).success).toBe(true);
  });

  it("rejects a course summary over 140 characters", () => {
    const result = CourseSchema.safeParse({ ...course, summary: "x".repeat(141) });
    expect(result.success).toBe(false);
    expect(issueMessages(result)).toContain(
      "Course summary must be 140 characters or fewer to prevent truncation"
    );
  });

  it("rejects duplicate tag variants after normalising them", () => {
    const result = CourseSchema.safeParse({ ...course, canonicalTags: ["Web Apps", " web apps "] });
    expect(result.success).toBe(false);
    expect(issueMessages(result)).toContain("Duplicate canonical tags are not permitted");
  });

  it("normalises tags to trimmed lower case", () => {
    const result = CourseSchema.parse({ ...course, canonicalTags: ["  Web Apps "] });
    expect(result.canonicalTags).toEqual(["web apps"]);
  });

  it("rejects duplicate screen IDs in a lesson", () => {
    const duplicate = { ...lesson.screens[1], id: lesson.screens[0].id };
    const result = LessonSchema.safeParse({ ...lesson, screens: [lesson.screens[0], duplicate] });
    expect(result.success).toBe(false);
    expect(issueMessages(result)).toContain("All screen IDs within a lesson must be unique");
  });

  it("rejects a lesson missing a required field", () => {
    expect(LessonSchema.safeParse(without(lesson, "title")).success).toBe(false);
  });

  it("rejects a lesson with no screens", () => {
    expect(LessonSchema.safeParse({ ...lesson, screens: [] }).success).toBe(false);
  });

  it("still applies defaults", () => {
    const choice = lesson.screens.find((s: { widgetType: string }) => s.widgetType === "choice");
    const choiceData = without(choice.widgetData, "isMultiSelect");
    expect(ChoiceWidgetDataSchema.parse(choiceData).isMultiSelect).toBe(false);

    const screenWithoutGlossary = without(lesson.screens[0], "glossary");
    const parsed = LessonSchema.parse({ ...lesson, screens: [screenWithoutGlossary] });
    expect(parsed.screens[0].glossary).toEqual([]);
  });
});
