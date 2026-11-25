import type { Course } from "./schema";

export interface LessonRef {
  slug: string;
  title: string;
}

/** Every lesson of the course in reading order, across chapters. */
export function courseLessons(course: Course): LessonRef[] {
  return course.chapters.flatMap((chapter) => chapter.lessons);
}

/** A lesson the learner has opened but not finished. */
export interface PartialLesson {
  /** How far through it they are, 0 to 0.95 */
  fraction: number;
  /** When the position was last saved (ms since epoch) */
  savedAt: number;
}

/** Saved lesson state, as far as progress needs it. */
export interface SavedLessonPosition {
  lessonSlug: string;
  currentScreenIndex?: number;
  sequence?: string[];
  positionSavedAt?: number;
  completedAt?: number;
}

/**
 * Lessons that were opened but not finished, keyed by lesson slug. A lesson
 * finished before its last saved position counts as a retake in progress.
 */
export function partialLessons(states: SavedLessonPosition[]): Record<string, PartialLesson> {
  const out: Record<string, PartialLesson> = {};
  for (const s of states) {
    if (typeof s.positionSavedAt !== "number") continue;
    if (typeof s.completedAt === "number" && s.positionSavedAt <= s.completedAt) continue;
    const total = s.sequence?.length ?? 0;
    const index = s.currentScreenIndex ?? 0;
    const fraction = total > 0 ? Math.min(0.95, Math.max(0, index / total)) : 0;
    out[s.lessonSlug] = { fraction, savedAt: s.positionSavedAt };
  }
  return out;
}

/**
 * Share of the course done, 0-100. Finished lessons count fully, a lesson in
 * progress counts by how far through it the learner is (never as finished).
 * Only slugs still in the course count, so a removed lesson cannot push it
 * past 100.
 */
export function coursePercent(
  course: Course,
  completedSlugs: string[],
  partial: Record<string, PartialLesson> = {}
): number {
  const lessons = courseLessons(course);
  if (lessons.length === 0) return 0;
  const score = lessons.reduce((sum, lesson) => {
    if (completedSlugs.includes(lesson.slug)) return sum + 1;
    return sum + (partial[lesson.slug]?.fraction ?? 0);
  }, 0);
  return Math.min(100, Math.round((score / lessons.length) * 100));
}

/** True when the learner has finished or opened any lesson of the course. */
export function hasStartedCourse(
  course: Course,
  completedSlugs: string[],
  partial: Record<string, PartialLesson> = {}
): boolean {
  return courseLessons(course).some((l) => completedSlugs.includes(l.slug) || l.slug in partial);
}

/** The lesson after `slug`, or null on the last lesson (or an unknown slug). */
export function nextLesson(course: Course, slug: string): LessonRef | null {
  const lessons = courseLessons(course);
  const index = lessons.findIndex((lesson) => lesson.slug === slug);
  return index >= 0 ? lessons[index + 1] ?? null : null;
}

/**
 * Where a learner should land: the unfinished lesson they were last in, else
 * the first unfinished lesson, else the first lesson.
 */
export function resumeLesson(
  course: Course,
  completedSlugs: string[],
  partial: Record<string, PartialLesson> = {}
): LessonRef | null {
  const lessons = courseLessons(course);
  const open = lessons
    .filter((l) => !completedSlugs.includes(l.slug) && l.slug in partial)
    .sort((a, b) => partial[b.slug].savedAt - partial[a.slug].savedAt);
  return open[0] ?? lessons.find((l) => !completedSlugs.includes(l.slug)) ?? lessons[0] ?? null;
}

export type LessonStatus = "done" | "in-progress" | "next" | "locked";

export interface LessonRow {
  slug: string;
  title: string;
  status: LessonStatus;
  /** The lesson on screen now */
  isCurrent: boolean;
  /** Finished lessons, the next unfinished one and the current one can be opened */
  canOpen: boolean;
}

/**
 * The course's lessons in chapters, each with where the learner stands and
 * whether it can be opened. A lesson can be opened once it is finished, or
 * when it is the first one not yet finished; later lessons stay locked until
 * the ones before them are done.
 */
export function lessonRows(
  course: Course,
  completedSlugs: string[],
  partial: Record<string, PartialLesson>,
  currentSlug: string
): Array<{ chapterId: string; chapterTitle: string; lessons: LessonRow[] }> {
  const nextSlug = courseLessons(course).find((l) => !completedSlugs.includes(l.slug))?.slug;
  return course.chapters.map((chapter) => ({
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    lessons: chapter.lessons.map((lesson) => {
      const done = completedSlugs.includes(lesson.slug);
      const isCurrent = lesson.slug === currentSlug;
      const status: LessonStatus = done
        ? "done"
        : lesson.slug in partial || isCurrent
          ? "in-progress"
          : lesson.slug === nextSlug
            ? "next"
            : "locked";
      return { slug: lesson.slug, title: lesson.title, status, isCurrent, canOpen: status !== "locked" };
    }),
  }));
}
