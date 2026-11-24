import Link from "next/link";
import { Course } from "@/lib/schema";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface CourseCardProps {
  course: Course;
  /** Index label such as C.01 (courses) or T.01 (tutorials) */
  label: string;
  progressPercent?: number;
  /** Lesson the button opens: the first one not finished yet */
  resumeLessonSlug?: string;
}

const META = "font-mono text-[11px] sm:text-xs uppercase tracking-[0.12em]";

/** One numbered row of the course list. */
export function CourseCard({ course, label, progressPercent = 0, resumeLessonSlug }: CourseCardProps) {
  const isCompleted = progressPercent >= 100;
  const isStarted = progressPercent > 0 && !isCompleted;
  const noun = course.mode === "course" ? "course" : "tutorial";
  const lessonCount = course.chapters.reduce((n, c) => n + c.lessons.length, 0);

  // The first lesson, or the first one the learner has not finished
  const lessonSlug = resumeLessonSlug ?? course.chapters[0]?.lessons[0]?.slug;
  const destinationHref = lessonSlug
    ? `/courses/${course.slug}/${lessonSlug}`
    : `/courses/${course.slug}`;

  return (
    <li className="border-b border-slate-200 py-7 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
      <div className="flex-1 min-w-0 space-y-2.5">
        <p className={`${META} text-brand-700`}>
          {label} <span aria-hidden="true">&middot;</span>{" "}
          <span className="text-slate-500">
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"} &middot; {course.estimatedMinutes} min &middot; ~{course.approxKbSize} KB
          </span>
        </p>

        <h3 className="font-display text-2xl sm:text-[26px] leading-snug text-slate-900">
          <Link href={destinationHref} className="block py-3 -my-3 hover:text-brand-700 transition-colors focus:outline-none focus-visible:underline">
            {course.title}
          </Link>
        </h3>

        {/* 140-char summary */}
        <p className="text-[15px] sm:text-base text-slate-700 leading-relaxed max-w-xl">{course.summary}</p>

        <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5" aria-label="Topics">
          {course.canonicalTags.map((tag) => (
            <li key={tag} className="text-xs font-medium text-slate-500 capitalize">
              #{tag}
            </li>
          ))}
        </ul>
      </div>

      {/* Progress and action */}
      <div className="md:w-56 shrink-0 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              {isCompleted ? (
                <span className="text-emerald-800 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> Completed
                </span>
              ) : isStarted ? (
                "In progress"
              ) : (
                "Not started"
              )}
            </span>
            <span className="font-mono text-slate-700">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isCompleted ? "bg-emerald-600" : "bg-brand-600"}`}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-label="Course progress"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <Link
          href={destinationHref}
          className={`w-full min-h-tap px-5 py-2.5 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition ${
            isCompleted
              ? "border-[1.5px] border-slate-900 text-slate-900 hover:bg-white"
              : "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800"
          }`}
        >
          <span>{isCompleted ? "Review again" : isStarted ? `Resume ${noun}` : `Start ${noun}`}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}
