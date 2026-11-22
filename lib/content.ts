import fs from "fs";
import path from "path";
import { CourseSchema, LessonSchema, Course, Lesson } from "./schema";

const COURSES_DIRECTORY = path.join(process.cwd(), "content", "courses");

/**
 * Reads and validates a course.json file by its slug.
 */
export function getCourseBySlug(courseSlug: string): Course {
  const courseFilePath = path.join(COURSES_DIRECTORY, courseSlug, "course.json");

  if (!fs.existsSync(courseFilePath)) {
    throw new Error(`Course file not found at: ${courseFilePath}`);
  }

  const fileContents = fs.readFileSync(courseFilePath, "utf-8");
  const parsedJson = JSON.parse(fileContents);

  const result = CourseSchema.safeParse(parsedJson);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `  - [${err.path.join(".")}] ${err.message}`)
      .join("\n");
    throw new Error(
      `[Content Schema Error] Validation failed for course '${courseSlug}':\n${errorDetails}`
    );
  }

  return result.data;
}

/**
 * Returns all valid courses located in content/courses/.
 */
export function getAllCourses(): Course[] {
  if (!fs.existsSync(COURSES_DIRECTORY)) {
    return [];
  }

  const entries = fs.readdirSync(COURSES_DIRECTORY, { withFileTypes: true });
  const courseDirs = entries.filter((entry) => entry.isDirectory());

  return courseDirs.map((dir) => getCourseBySlug(dir.name));
}

/**
 * Reads and validates a lesson JSON file for a given course and lesson slug.
 */
export function getLesson(courseSlug: string, lessonSlug: string): Lesson {
  const lessonFilePath = path.join(
    COURSES_DIRECTORY,
    courseSlug,
    "lessons",
    `${lessonSlug}.json`
  );

  if (!fs.existsSync(lessonFilePath)) {
    throw new Error(
      `Lesson file not found at: ${lessonFilePath} (course: ${courseSlug}, lesson: ${lessonSlug})`
    );
  }

  const fileContents = fs.readFileSync(lessonFilePath, "utf-8");
  const parsedJson = JSON.parse(fileContents);

  const result = LessonSchema.safeParse(parsedJson);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `  - [${err.path.join(".")}] ${err.message}`)
      .join("\n");
    throw new Error(
      `[Content Schema Error] Validation failed for lesson '${lessonSlug}' in course '${courseSlug}':\n${errorDetails}`
    );
  }

  return result.data;
}

/**
 * Returns all [courseSlug, lessonSlug] pairs across all courses.
 * Useful for Next.js generateStaticParams in /learn/[courseSlug]/[lessonSlug].
 */
export function getAllLessonParams(): { courseSlug: string; lessonSlug: string }[] {
  const courses = getAllCourses();
  const params: { courseSlug: string; lessonSlug: string }[] = [];

  for (const course of courses) {
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        params.push({
          courseSlug: course.slug,
          lessonSlug: lesson.slug,
        });
      }
    }
  }

  return params;
}
