import { notFound } from "next/navigation";
import {
  getCourseBySlug,
  getLesson,
  getAllLessonParams,
} from "@/lib/content";
import { PlayerShell } from "@/components/player/PlayerShell";
import { Metadata } from "next";

interface LessonPageProps {
  // Next.js 15: route params arrive as a Promise
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
}

export function generateStaticParams() {
  return getAllLessonParams();
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { courseSlug, lessonSlug } = await params;
  try {
    const lesson = getLesson(courseSlug, lessonSlug);
    return {
      title: lesson.title,
      description: `Interactive lesson on ${lesson.title}. Ultra-low data active recall learning.`,
    };
  } catch {
    return {
      title: "Interactive Lesson",
    };
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseSlug, lessonSlug } = await params;
  // Load inside try/catch, render outside it, so render errors are not
  // mistaken for a missing lesson.
  let data;
  try {
    data = {
      course: getCourseBySlug(courseSlug),
      lesson: getLesson(courseSlug, lessonSlug),
    };
  } catch {
    notFound();
  }

  return <PlayerShell course={data.course} lesson={data.lesson} />;
}
