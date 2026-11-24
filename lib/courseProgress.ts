import type { Course } from "./schema";

export interface LessonRef {
  slug: string;
  title: string;
}

/** Every lesson of the course in reading order, across chapters. */
export function courseLessons(course: Course): LessonRef[] {
  return course.chapters.flatMap((chapter) => chapter.lessons);
}

/**
 * Share of the course's lessons that are done, 0-100. Only slugs that are
 * still in the course count, so a removed lesson cannot push it past 100.
 */
export function coursePercent(course: Course, completedSlugs: string[]): number {
  const lessons = courseLessons(course);
  if (lessons.length === 0) return 0;
  const done = lessons.filter((lesson) => completedSlugs.includes(lesson.slug)).length;
  return Math.round((done / lessons.length) * 100);
}

/** The lesson after `slug`, or null on the last lesson (or an unknown slug). */
export function nextLesson(course: Course, slug: string): LessonRef | null {
  const lessons = courseLessons(course);
  const index = lessons.findIndex((lesson) => lesson.slug === slug);
  return index >= 0 ? lessons[index + 1] ?? null : null;
}

/** Where a learner should land: the first unfinished lesson, else the first lesson. */
export function resumeLesson(course: Course, completedSlugs: string[]): LessonRef | null {
  const lessons = courseLessons(course);
  return lessons.find((lesson) => !completedSlugs.includes(lesson.slug)) ?? lessons[0] ?? null;
}
