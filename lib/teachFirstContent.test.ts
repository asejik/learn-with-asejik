import { describe, it, expect } from "vitest";
import { getAllLessonParams, getLesson } from "./content";
import type { Lesson } from "./schema";

// Learners must meet a word before a question needs it. Only what is shown
// without opening a drawer counts: reading text, diagram text and earlier
// answer feedback. Tutor hints and the glossary are optional, so they do not.
function shownBy(screen: Lesson["screens"][number]): string[] {
  switch (screen.widgetType) {
    case "reading":
      return screen.widgetData.paragraphs;
    case "diagramExplorer":
      return screen.widgetData.nodes.flatMap((n) => [n.title, n.definition, n.bonusFact ?? ""]);
    case "choice":
    case "cloze":
      return [screen.widgetData.explanation, screen.widgetData.bonusFact ?? ""];
    case "swipeDeck":
      return screen.widgetData.cards.flatMap((c) => [c.explanation, c.bonusFact]);
    case "matchPairs":
      return [screen.widgetData.explanation];
  }
}

describe("fill-the-blank answers are taught first", () => {
  for (const { courseSlug, lessonSlug } of getAllLessonParams()) {
    const lesson = getLesson(courseSlug, lessonSlug);
    lesson.screens.forEach((screen, index) => {
      if (screen.widgetType !== "cloze") return;
      const answer = screen.widgetData.correctAnswer;
      it(`${lessonSlug}: "${answer}" appears before it is asked`, () => {
        const earlier = lesson.screens.slice(0, index).flatMap(shownBy).join(" ");
        expect(earlier.toLowerCase()).toContain(answer.toLowerCase());
      });
    });
  }
});
