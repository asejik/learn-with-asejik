import { describe, it, expect } from "vitest";
import { getAllCourses, getAllLessonParams, getLesson } from "./content";
import { splitByGlossary } from "./glossaryMatch";

// A glossary term that can never be tapped is dead content, so every term
// must sit on a reading screen and appear in its text.
describe("glossary terms in the real lessons", () => {
  getAllCourses(); // fails early if content is invalid
  for (const { courseSlug, lessonSlug } of getAllLessonParams()) {
    const lesson = getLesson(courseSlug, lessonSlug);
    for (const screen of lesson.screens) {
      for (const entry of screen.glossary) {
        it(`${lessonSlug} / ${screen.id}: "${entry.term}" can be tapped`, () => {
          expect(screen.widgetType).toBe("reading");
          if (screen.widgetType !== "reading") return;
          const matched = screen.widgetData.paragraphs.some((p) =>
            splitByGlossary(p, [entry.term]).some((part) => part.term)
          );
          expect(matched).toBe(true);
        });
      }
    }
  }
});
