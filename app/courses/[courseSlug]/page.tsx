import { notFound, redirect } from "next/navigation";
import { getCourseBySlug, getAllCourses } from "@/lib/content";

interface CourseOverviewPageProps {
  // Next.js 15: route params arrive as a Promise
  params: Promise<{
    courseSlug: string;
  }>;
}

export function generateStaticParams() {
  const courses = getAllCourses();
  return courses.map((c) => ({ courseSlug: c.slug }));
}

export default async function CourseOverviewPage({ params }: CourseOverviewPageProps) {
  const { courseSlug } = await params;
  try {
    const course = getCourseBySlug(courseSlug);
    const firstLesson = course.chapters[0]?.lessons[0];

    if (firstLesson) {
      redirect(`/courses/${course.slug}/${firstLesson.slug}`);
    } else {
      redirect("/");
    }
  } catch {
    notFound();
  }
}
