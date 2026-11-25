import { notFound } from "next/navigation";
import {
  getCourseBySlug,
  getLesson,
  getAllLessonParams,
} from "@/lib/content";
import { PlayerShell } from "@/components/player/PlayerShell";
import { PrivacyNoticeContent } from "@/components/privacy/PrivacyNoticeContent";
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
    const course = getCourseBySlug(courseSlug);
    const related = course.finish.relatedCourse
      ? getCourseBySlug(course.finish.relatedCourse)
      : null;
    data = {
      course,
      lesson: getLesson(courseSlug, lessonSlug),
      related: related && {
        slug: related.slug,
        title: related.title,
        summary: related.summary,
        firstLessonSlug: related.chapters[0].lessons[0].slug,
      },
    };
  } catch {
    notFound();
  }

  // The notice is rendered here on the server, so its text is not added to
  // the player's JavaScript and is saved with the lesson for offline use.
  return (
    <PlayerShell
      course={data.course}
      lesson={data.lesson}
      relatedCourse={data.related}
      privacyNotice={<PrivacyNoticeContent />}
    />
  );
}
