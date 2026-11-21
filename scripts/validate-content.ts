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
  }

  const lessonParams = getAllLessonParams();
  console.log(`\n✅ Successfully validated ${lessonParams.length} lesson(s):`);

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
