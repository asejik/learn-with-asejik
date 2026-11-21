import fs from "fs";
import path from "path";
import { getAllCourses, getAllLessonParams, getLesson } from "../lib/content";

console.log("🔍 Validating all course and lesson content against Zod schemas...\n");

try {
  const courses = getAllCourses();
  console.log(`✅ Successfully validated ${courses.length} course(s):`);

  for (const course of courses) {
    console.log(
      `   - [${course.mode.toUpperCase()}] ${course.title} (${course.slug}) | Est: ${course.estimatedMinutes}m | Approx: ${course.approxKbSize}KB`
    );
    console.log(`     Tags: ${course.canonicalTags.join(", ")}`);
    console.log(`     Summary (${course.summary.length}/140 chars): "${course.summary}"`);

    // Verify all JSON files in the lessons folder pass schema
    const lessonsDir = path.join(process.cwd(), "content", "courses", course.slug, "lessons");
    if (fs.existsSync(lessonsDir)) {
      const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        const lessonSlug = file.replace(/\.json$/, "");
        getLesson(course.slug, lessonSlug);
      }
    }
  }

  const lessonParams = getAllLessonParams();
  console.log(`\n✅ Successfully validated ${lessonParams.length} lesson(s) in course structure:`);

  for (const param of lessonParams) {
    const lesson = getLesson(param.courseSlug, param.lessonSlug);
    console.log(
      `   - ${lesson.title} (${param.courseSlug}/${param.lessonSlug}) | ${lesson.screens.length} screens`
    );

    lesson.screens.forEach((screen, index) => {
      console.log(`       Screen ${index + 1}: [${screen.widgetType}] "${screen.title}" (ID: ${screen.id})`);
    });
  }

  console.log("\n🎉 ALL CONTENT SCHEMAS PASSED STRICT VALIDATION WITH ZERO ERRORS!\n");
  process.exit(0);
} catch (error) {
  console.error("\n❌ CONTENT VALIDATION FAILED:\n", error);
  process.exit(1);
}
