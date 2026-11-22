import { notFound, redirect } from "next/navigation";
import { getCourseBySlug, getAllCourses } from "@/lib/content";

interface CourseOverviewPageProps {
  // Route params arrive as a Promise (Next.js 15+)
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
  // Load inside try/catch, redirect outside it: redirect() works by throwing,
  // so a catch around it would turn every redirect into a 404.
  let course;
  try {
    course = getCourseBySlug(courseSlug);
  } catch {
    notFound();
  }

  const firstLesson = course.chapters[0]?.lessons[0];
  redirect(firstLesson ? `/courses/${course.slug}/${firstLesson.slug}` : "/");
}
