"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ListOrdered, Lock, MapPin } from "lucide-react";
import type { Course } from "@/lib/schema";
import { getCourseProgress, getAllLessonStates } from "@/lib/db";
import {
  lessonRows,
  partialLessons,
  type LessonRow,
  type PartialLesson,
} from "@/lib/courseProgress";
import { SlideOverDrawer } from "./SlideOverDrawer";

interface LessonsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  currentSlug: string;
}

const STATUS_TEXT: Record<LessonRow["status"], string> = {
  done: "Finished",
  "in-progress": "In progress",
  next: "Up next",
  locked: "Locked until you finish the lesson before",
};

function RowIcon({ row }: { row: LessonRow }) {
  const cls = "w-5 h-5 shrink-0";
  if (row.isCurrent) return <MapPin className={`${cls} text-brand-600`} aria-hidden="true" />;
  if (row.status === "done") return <CheckCircle2 className={`${cls} text-brand-600`} aria-hidden="true" />;
  if (row.status === "locked") return <Lock className={`${cls} text-slate-400`} aria-hidden="true" />;
  return <Circle className={`${cls} text-slate-400`} aria-hidden="true" />;
}

/** Every lesson of the course. Finished lessons and the next one can be opened; later ones stay locked. */
export function LessonsDrawer({ isOpen, onClose, course, currentSlug }: LessonsDrawerProps) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [partial, setPartial] = useState<Record<string, PartialLesson>>({});

  // Read saved progress each time the list opens. If it cannot be read, only
  // the first lesson and this one can be opened (fail closed).
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getCourseProgress(course.slug)
      .then((record) => {
        if (!cancelled) setCompleted(record?.completedLessonSlugs ?? []);
      })
      .catch(() => {
        if (!cancelled) setCompleted([]);
      });
    getAllLessonStates()
      .then((states) => {
        if (!cancelled) setPartial(partialLessons(states.filter((s) => s.courseSlug === course.slug)));
      })
      .catch(() => {
        if (!cancelled) setPartial({});
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, course.slug]);

  const chapters = lessonRows(course, completed, partial, currentSlug);

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      titleId="lessons-title"
      closeLabel="Close lessons list"
      footerLabel="Back to lesson"
      bodyClassName="space-y-6"
      header={
        <>
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
            <ListOrdered className="w-4 h-4 text-brand-600" aria-hidden="true" />
          </div>
          <div>
            <h2 id="lessons-title" className="text-sm font-bold text-slate-900">
              Lessons
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">{course.title}</span>
          </div>
        </>
      }
    >
      {chapters.map((chapter) => (
        <section key={chapter.chapterId} aria-label={chapter.chapterTitle} className="space-y-2">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            {chapter.chapterTitle}
          </h3>
          <ol className="space-y-2">
            {chapter.lessons.map((row) => {
              const body = (
                <>
                  <RowIcon row={row} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{row.title}</span>
                    <span className="block text-xs text-slate-600">
                      {row.isCurrent ? "You are here" : STATUS_TEXT[row.status]}
                    </span>
                  </span>
                </>
              );
              const base = "flex items-center gap-3 min-h-tap px-3 py-2.5 rounded-xl border";
              return (
                <li key={row.slug}>
                  {row.isCurrent ? (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-current="step"
                      className={`${base} w-full text-left bg-brand-50 border-brand-200`}
                    >
                      {body}
                    </button>
                  ) : row.canOpen ? (
                    <Link
                      href={`/courses/${course.slug}/${row.slug}`}
                      className={`${base} bg-white border-slate-200 hover:bg-slate-50`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div aria-disabled="true" className={`${base} bg-slate-100 border-slate-200 text-slate-500`}>
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </SlideOverDrawer>
  );
}
