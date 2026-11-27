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

  it("rejects an answer explanation that opens with a verdict", () => {
    const clozeIndex = lesson.screens.findIndex((s: { widgetType: string }) => s.widgetType === "cloze");
    for (const verdict of ["Correct! ", "Exactly! ", "Wrong. ", "spot  on - ", "Not quite: ", "That’s right! "]) {
      const screens = structuredClone(lesson.screens);
      screens[clozeIndex].widgetData.explanation = verdict + screens[clozeIndex].widgetData.explanation;
      const result = LessonSchema.safeParse({ ...lesson, screens });
      expect(result.success).toBe(false);
      expect(issueMessages(result).join(" ")).toContain("must not start with a verdict");
    }
  });

  it("allows explanations that merely contain or start near those words", () => {
    const clozeIndex = lesson.screens.findIndex((s: { widgetType: string }) => s.widgetType === "cloze");
    for (const text of [
      "Correctness matters here.",
      "An API returns the correct data.",
      "Exactly how an API answers depends on the request.",
      "Wrong credentials return a 401 status.",
    ]) {
      const screens = structuredClone(lesson.screens);
      screens[clozeIndex].widgetData.explanation = text;
      expect(LessonSchema.safeParse({ ...lesson, screens }).success).toBe(true);
    }
  });

  it("requires the diagram explorer's completion message", () => {
    const diagramIndex = lesson.screens.findIndex(
      (s: { widgetType: string }) => s.widgetType === "diagramExplorer"
    );
    const screens = structuredClone(lesson.screens);
    screens[diagramIndex].widgetData = without(screens[diagramIndex].widgetData, "completionMessage");
    expect(LessonSchema.safeParse({ ...lesson, screens }).success).toBe(false);
  });

  it("rejects a lesson diagram whose label touches its shape", () => {
    const diagramIndex = lesson.screens.findIndex(
      (s: { widgetType: string }) => s.widgetType === "diagramExplorer"
    );
    const screens = structuredClone(lesson.screens);
    screens[diagramIndex].widgetData.diagramSvg =
      "<svg viewBox='0 0 500 120'><circle cx='430' cy='60' r='35' stroke-width='2'/>" +
      "<text x='430' y='65' font-size='12' text-anchor='middle'>3. Response</text></svg>";
    const result = LessonSchema.safeParse({ ...lesson, screens });
    expect(result.success).toBe(false);
    expect(issueMessages(result).join(" ")).toContain("Diagram label check");
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

// Each case breaks one rule in an otherwise valid lesson and names the message it must give.
// get/set walk a dotted path such as "widgetData.options.0.id" through parsed JSON.
function get(root: unknown, path: string): unknown {
  return path.split(".").filter(Boolean).reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], root);
}

function set(root: unknown, path: string, value: unknown) {
  const keys = path.split(".");
  const last = keys.pop() as string;
  (get(root, keys.join(".") || ".") as Record<string, unknown>)[last] = value;
}

function lessonIssues(widgetType: string, edit: (screen: unknown) => void) {
  const copy = structuredClone(lesson);
  edit(copy.screens.find((s: { widgetType: string }) => s.widgetType === widgetType));
  return issueMessages(LessonSchema.safeParse(copy)).join(" | ");
}

describe("strict content rules", () => {
  const cases: Array<[string, string, (s: unknown) => void, string]> = [
    ["an unknown field on a screen", "cloze", (s) => set(s, "explaination", "typo"), "Unrecognized key"],
    ["an unknown field in widget data", "cloze", (s) => set(s, "widgetData.bonusFct", "typo"), "Unrecognized key"],
    ["widget data of another type", "cloze", (s) => set(s, "widgetData", { paragraphs: ["x"] }), "Unrecognized key"],
    ["an unknown widget type", "cloze", (s) => set(s, "widgetType", "videoPlayer"), "Invalid discriminator value"],
    ["a cloze without a blank", "cloze", (s) => set(s, "widgetData.template", "No gap here."), "exactly one {blank}"],
    ["a cloze answer that is not an option", "cloze", (s) => set(s, "widgetData.correctAnswer", "zzz"), "not one of the options"],
    ["a repeated cloze option", "cloze", (s) => set(s, "widgetData.options.1", get(s, "widgetData.options.0")), "Duplicate option"],
    ["a correct id that is not an option", "choice", (s) => set(s, "widgetData.correctOptionIds", ["nope"]), "is not one of the options"],
    ["a repeated option id", "choice", (s) => set(s, "widgetData.options.1.id", get(s, "widgetData.options.0.id")), "Duplicate option id"],
    ["two answers on a single-select question", "choice", (s) =>
      set(s, "widgetData.correctOptionIds", [get(s, "widgetData.options.0.id"), get(s, "widgetData.options.1.id")]), "exactly one correct"],
    ["a repeated card id", "swipeDeck", (s) => set(s, "widgetData.cards.1.id", get(s, "widgetData.cards.0.id")), "Duplicate card id"],
    ["a repeated node id", "diagramExplorer", (s) => set(s, "widgetData.nodes.1.id", get(s, "widgetData.nodes.0.id")), "Duplicate node id"],
    ["a matching screen without a bonus fact", "matchPairs", (s) => set(s, "widgetData.bonusFact", undefined), "expected string"],
    ["a repeated left item", "matchPairs", (s) => set(s, "widgetData.pairs.1.left", get(s, "widgetData.pairs.0.left")), "Duplicate left item"],
    ["a repeated right item", "matchPairs", (s) => set(s, "widgetData.pairs.1.right", get(s, "widgetData.pairs.0.right")), "Duplicate right item"],
    ["a repeated glossary term", "reading", (s) =>
      set(s, "glossary", [{ term: "A", definition: "x" }, { term: "a", definition: "y" }]), "Duplicate glossary term"],
  ];

  it.each(cases)("rejects %s", (_name, type, edit, message) => {
    expect(lessonIssues(type, edit)).toContain(message);
  });

  it("rejects a swipe card with no bonus tip (shown with Spot on)", () => {
    expect(lessonIssues("swipeDeck", (s) => set(s, "widgetData.cards.0.bonusFact", undefined))).not.toBe("");
    expect(lessonIssues("swipeDeck", (s) => set(s, "widgetData.cards.0.bonusFact", ""))).not.toBe("");
  });

  it("requires the opening and closing cards", () => {
    expect(LessonSchema.safeParse(without(lesson, "intro")).success).toBe(false);
    expect(LessonSchema.safeParse(without(lesson, "recap")).success).toBe(false);
    expect(LessonSchema.safeParse({ ...lesson, recap: ["only one point"] }).success).toBe(false);
    expect(LessonSchema.safeParse({ ...lesson, intro: "x".repeat(241) }).success).toBe(false);
    expect(CourseSchema.safeParse(without(course, "overview")).success).toBe(false);
    expect(CourseSchema.safeParse(without(course, "finish")).success).toBe(false);
    expect(
      CourseSchema.safeParse({ ...course, finish: { ...course.finish, relatedCourse: "Not A Slug" } }).success
    ).toBe(false);
  });

  it("rejects an unknown field on a lesson, a course and a chapter", () => {
    expect(issueMessages(LessonSchema.safeParse({ ...lesson, extra: 1 })).join()).toContain("Unrecognized key");
    expect(issueMessages(CourseSchema.safeParse({ ...course, extra: 1 })).join()).toContain("Unrecognized key");
    const chapters = structuredClone(course.chapters);
    chapters[0].extra = 1;
    expect(issueMessages(CourseSchema.safeParse({ ...course, chapters })).join()).toContain("Unrecognized key");
  });

  it("rejects slugs that are not URL-safe", () => {
    for (const slug of ["Has Space", "UPPER", "-lead", "trail-", "a--b", "a/b"]) {
      expect(CourseSchema.safeParse({ ...course, slug }).success, slug).toBe(false);
      expect(LessonSchema.safeParse({ ...lesson, slug }).success, slug).toBe(false);
    }
  });

  it("rejects repeated chapter ids and lesson slugs in a course", () => {
    const chapter = course.chapters[0];
    const messages = issueMessages(CourseSchema.safeParse({ ...course, chapters: [chapter, chapter] })).join(" | ");
    expect(messages).toContain("Duplicate chapter id");
    expect(messages).toContain("Duplicate lesson slug");
  });
});
