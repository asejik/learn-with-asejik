import React from "react";
import { notFound } from "next/navigation";
import {
  getCourseBySlug,
  getLesson,
  getAllLessonParams,
} from "@/lib/content";
import { PlayerShell } from "@/components/player/PlayerShell";
import { Metadata } from "next";

interface LessonPageProps {
  params: {
    courseSlug: string;
    lessonSlug: string;
  };
}

export function generateStaticParams() {
  return getAllLessonParams();
}

export function generateMetadata({ params }: LessonPageProps): Metadata {
  try {
    const lesson = getLesson(params.courseSlug, params.lessonSlug);
    return {
      title: `${lesson.title} | Learn with Asejik`,
      description: `Interactive lesson on ${lesson.title}. Ultra-low data active recall learning.`,
    };
  } catch {
    return {
      title: "Interactive Lesson | Learn with Asejik",
    };
  }
}

export default function LessonPage({ params }: LessonPageProps) {
  try {
    const course = getCourseBySlug(params.courseSlug);
    const lesson = getLesson(params.courseSlug, params.lessonSlug);

    return <PlayerShell course={course} lesson={lesson} />;
  } catch {
    notFound();
  }
}
