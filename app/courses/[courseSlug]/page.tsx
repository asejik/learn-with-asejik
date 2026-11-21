import { notFound, redirect } from "next/navigation";
import { getCourseBySlug, getAllCourses } from "@/lib/content";

interface CourseOverviewPageProps {
  params: {
    courseSlug: string;
  };
}

export function generateStaticParams() {
  const courses = getAllCourses();
  return courses.map((c) => ({ courseSlug: c.slug }));
}

export default function CourseOverviewPage({ params }: CourseOverviewPageProps) {
  try {
    const course = getCourseBySlug(params.courseSlug);
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
