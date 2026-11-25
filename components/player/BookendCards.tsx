"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, ListChecks, Target, X } from "lucide-react";
import type { Course, Lesson } from "@/lib/schema";

/**
 * The cards that open and close a lesson (and a course): what you are about
 * to learn, what you just learned, and what to do next. They are not screens,
 * so they never touch the saved place or the retry queue.
 */

export interface RelatedCourse {
  slug: string;
  title: string;
  summary: string;
  firstLessonSlug: string;
}

const EYEBROW = "font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700";

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="max-w-2xl w-full mx-auto px-4 py-2.5 flex items-center">
        <Link
          href="/"
          className="min-h-tap min-w-tap -ml-3 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
          aria-label="Return to Course Catalog"
        >
          <X className="w-5 h-5" />
        </Link>
      </nav>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pb-10 pt-2 space-y-6">{children}</main>
    </div>
  );
}

function Bullets({ items, icon }: { items: string[]; icon: ReactNode }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] sm:text-base leading-relaxed text-slate-700">
          <span className="mt-1 shrink-0 text-brand-600" aria-hidden="true">
            {icon}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-tap px-6 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
    >
      {children}
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}

interface LessonIntroCardProps {
  course: Course;
  lesson: Lesson;
  /** The first lesson also shows the course overview */
  isFirstLesson: boolean;
  onStart: () => void;
}

export function LessonIntroCard({ course, lesson, isFirstLesson, onStart }: LessonIntroCardProps) {
  return (
    <Frame>
      {isFirstLesson && (
        <section className="space-y-4" aria-labelledby="course-overview-heading">
          <p className={EYEBROW}>About this {course.mode}</p>
          <h1 id="course-overview-heading" className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            {course.title}
          </h1>
          <p className="text-[15px] sm:text-base leading-relaxed text-slate-700">{course.overview.about}</p>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              What you will learn
            </h2>
            <Bullets items={course.overview.youWillLearn} icon={<Target className="w-4 h-4" />} />
          </div>
        </section>
      )}

      <section className="space-y-3" aria-labelledby="lesson-intro-heading">
        <p className={EYEBROW}>{isFirstLesson ? "First lesson" : "In this lesson"}</p>
        {isFirstLesson ? (
          <h2 id="lesson-intro-heading" className="font-display text-2xl text-slate-900 leading-snug">
            {lesson.title}
          </h2>
        ) : (
          <h1 id="lesson-intro-heading" className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
            {lesson.title}
          </h1>
        )}
        <p className="text-[15px] sm:text-base leading-relaxed text-slate-700">{lesson.intro}</p>
      </section>

      <PrimaryButton onClick={onStart}>Start lesson</PrimaryButton>
    </Frame>
  );
}

export function LessonRecapCard({ lesson, onContinue }: { lesson: Lesson; onContinue: () => void }) {
  return (
    <Frame>
      <section className="space-y-4" aria-labelledby="lesson-recap-heading">
        <p className={EYEBROW}>Lesson recap</p>
        <h1 id="lesson-recap-heading" className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
          What you learned
        </h1>
        <p className="text-sm text-slate-600">{lesson.title}</p>
        <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
          <Bullets items={lesson.recap} icon={<ListChecks className="w-4 h-4" />} />
        </div>
        {lesson.keyTerms.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Key terms
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {lesson.keyTerms.map((t) => (
                <li key={t} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
    </Frame>
  );
}

interface CourseFinishCardProps {
  course: Course;
  related: RelatedCourse | null;
  onContinue: () => void;
}

export function CourseFinishCard({ course, related, onContinue }: CourseFinishCardProps) {
  const noun = course.mode === "course" ? "course" : "tutorial";
  return (
    <Frame>
      <section className="space-y-5" aria-labelledby="course-finish-heading">
        <p className={EYEBROW}>You finished the {noun}</p>
        <h1 id="course-finish-heading" className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight leading-tight">
          {course.title}
        </h1>

        <div className="space-y-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            The big picture
          </h2>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
            <Bullets items={course.finish.recap} icon={<ListChecks className="w-4 h-4" />} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            Do this now
          </h2>
          <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4 sm:p-5">
            <Bullets items={course.finish.actionPoints} icon={<Target className="w-4 h-4" />} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            Next steps
          </h2>
          <p className="flex gap-3 text-[15px] sm:text-base leading-relaxed text-slate-700">
            <Compass className="w-4 h-4 mt-1 shrink-0 text-brand-600" aria-hidden="true" />
            <span>{course.finish.nextSteps}</span>
          </p>
        </div>

        {related && (
          <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Try this next
            </p>
            <h2 className="font-display text-xl text-slate-900 leading-snug">{related.title}</h2>
            <p className="text-sm leading-relaxed text-slate-600">{related.summary}</p>
            <Link
              href={`/courses/${related.slug}/${related.firstLessonSlug}`}
              className="min-h-tap inline-flex items-center gap-1.5 font-semibold text-sm text-brand-700 underline underline-offset-2 hover:text-brand-900"
            >
              Start {related.title}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>
      <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
    </Frame>
  );
}
