import Link from "next/link";
import { Course } from "@/lib/schema";
import { ArrowRight, BookOpen, Clock, HardDrive, CheckCircle2 } from "lucide-react";

interface CourseCardProps {
  course: Course;
  progressPercent?: number;
}

export function CourseCard({ course, progressPercent = 0 }: CourseCardProps) {
  const isCompleted = progressPercent >= 100;
  const isStarted = progressPercent > 0 && !isCompleted;
  const isCourseMode = course.mode === "course";

  // First lesson destination
  const firstLessonSlug = course.chapters[0]?.lessons[0]?.slug;
  const destinationHref = firstLessonSlug
    ? `/courses/${course.slug}/${firstLessonSlug}`
    : `/courses/${course.slug}`;

  return (
    <article className="group bg-white rounded-2xl border border-slate-200 hover:border-brand-500/80 hover:shadow-md transition-all duration-150 p-5 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Badges: Mode & Low-Data Specs */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isCourseMode
                ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                : "bg-brand-50 text-brand-700 border border-brand-100"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>{course.mode}</span>
          </span>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>~{course.approxKbSize} KB</span>
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{course.estimatedMinutes} mins</span>
            </span>
          </div>
        </div>

        {/* Course Title */}
        <h2 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-brand-600 transition-colors">
          <Link href={destinationHref} className="focus:outline-none focus:underline">
            {course.title}
          </Link>
        </h2>

        {/* 140-char Summary */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {course.summary}
        </p>

        {/* Canonical Topic Tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {course.canonicalTags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Progress & CTA Area */}
      <div className="pt-5 mt-4 border-t border-slate-100 space-y-3">
        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>
              {isCompleted ? (
                <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                </span>
              ) : isStarted ? (
                "In Progress"
              ) : (
                "Not Started"
              )}
            </span>
            <span className="font-mono text-slate-700">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? "bg-emerald-500" : "bg-brand-600"
              }`}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-label="Course progress"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Primary CTA Button: Guaranteed >=44px tap target */}
        <Link
          href={destinationHref}
          className="w-full min-h-tap px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm"
        >
          <span>
            {isCompleted
              ? "Review Again"
              : isStarted
              ? "Resume Tutorial"
              : "Start Tutorial"}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
