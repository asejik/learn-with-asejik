"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Course } from "@/lib/schema";
import { SiteHeader } from "./SiteHeader";
import { CatalogHeader } from "./CatalogHeader";
import { TagFilterBar } from "./TagFilterBar";
import { CourseCard } from "./CourseCard";
import { ClearDataModal } from "./ClearDataModal";
import { Check, ShieldCheck, Trash2, SearchX } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { getAllCourseProgress, clearAllLocalData } from "@/lib/db";
import { coursePercent, resumeLesson } from "@/lib/courseProgress";

interface CatalogViewProps {
  initialCourses: Course[];
}

const STORAGE_KEY_PROGRESS = "asejik_course_progress_v1";

export function CatalogView({ initialCourses }: CatalogViewProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "grouped" | "alpha">("all");
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  // Lessons finished per course, from which the real course percentage is worked out
  const [completedMap, setCompletedMap] = useState<Record<string, string[]>>({});
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Failure-path safe client progress hydration (IndexedDB + localStorage)
  useEffect(() => {
    let isMounted = true;
    getAllCourseProgress()
      .then((records) => {
        if (!isMounted) return;
        if (records && records.length > 0) {
          const completed: Record<string, string[]> = {};
          records.forEach((r) => {
            completed[r.courseSlug] = r.completedLessonSlugs;
          });
          setCompletedMap(completed);
        } else {
          // Fallback to localStorage
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              const raw = window.localStorage.getItem(STORAGE_KEY_PROGRESS);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                  setProgressMap(parsed);
                }
              }
            }
          } catch {
            setProgressMap({});
          }
        }
      })
      .catch(() => {
        if (isMounted) setProgressMap({});
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Collect all unique canonical tags across all courses
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    initialCourses.forEach((c) => {
      c.canonicalTags.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [initialCourses]);

  // Tag filter toggle
  function handleToggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleClearTags() {
    setSelectedTags([]);
  }

  // Full courses come before one-off tutorials, so the longer material leads
  const orderedCourses = useMemo(
    () => [...initialCourses].sort((a, b) => Number(b.mode === "course") - Number(a.mode === "course")),
    [initialCourses]
  );

  // Index labels (C.01 for courses, T.01 for tutorials) stay the same whatever the filter
  const labels = useMemo(() => {
    const counts = { course: 0, tutorial: 0 };
    const out: Record<string, string> = {};
    orderedCourses.forEach((c) => {
      counts[c.mode] += 1;
      out[c.slug] = `${c.mode === "course" ? "C" : "T"}.${String(counts[c.mode]).padStart(2, "0")}`;
    });
    return out;
  }, [orderedCourses]);

  const lessonCount = useMemo(
    () => initialCourses.reduce((n, c) => n + c.chapters.reduce((m, ch) => m + ch.lessons.length, 0), 0),
    [initialCourses]
  );

  // Filtered and sorted courses
  const filteredCourses = useMemo(() => {
    let result = [...orderedCourses];

    // Apply tag filter if tags are selected
    if (selectedTags.length > 0) {
      result = result.filter((course) =>
        course.canonicalTags.some((tag) => selectedTags.includes(tag))
      );
    }

    // Apply sorting
    if (viewMode === "alpha") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [orderedCourses, selectedTags, viewMode]);

  // Grouped courses mapping (for "grouped" view mode)
  const groupedCourses = useMemo(() => {
    if (viewMode !== "grouped") return null;

    const groups: Record<string, Course[]> = {};
    filteredCourses.forEach((course) => {
      const primaryTag = course.canonicalTags[0] || "general";
      if (!groups[primaryTag]) {
        groups[primaryTag] = [];
      }
      groups[primaryTag].push(course);
    });

    return groups;
  }, [filteredCourses, viewMode]);

  // Saved lessons give the real percentage; the localStorage copy is the fallback
  function percentFor(course: Course): number {
    const completed = completedMap[course.slug];
    return completed ? coursePercent(course, completed) : progressMap[course.slug] || 0;
  }

  // Handle clear data action (purges IndexedDB & localStorage)
  async function handleConfirmClearData() {
    await clearAllLocalData();
    setProgressMap({});
    setCompletedMap({});
  }

  const card = (course: Course) => (
    <CourseCard
      key={course.slug}
      course={course}
      label={labels[course.slug]}
      progressPercent={percentFor(course)}
      resumeLessonSlug={resumeLesson(course, completedMap[course.slug] ?? [])?.slug}
    />
  );
  const LABEL = "font-mono text-xs uppercase tracking-[0.12em]";

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <main className="flex-1">
        <div className="max-w-5xl w-full mx-auto px-4">
          <CatalogHeader courseCount={initialCourses.length} lessonCount={lessonCount} />
        </div>

        {/* Trust strip: only claims that are true of how the site works */}
        <section aria-label="Why it is easy to use" className="bg-slate-900 text-slate-50">
          <ul className={`max-w-5xl mx-auto px-4 py-4 grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-between gap-x-6 gap-y-2 ${LABEL} text-[11px]`}>
            {["No account required", "Works offline", "Light on data", "Made for phones"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section id="courses" className="max-w-5xl w-full mx-auto px-4 pt-14 sm:pt-20 scroll-mt-4">
          <p className={`${LABEL} text-brand-700 mb-3`}>The courses</p>
          <h2 className="font-display text-3xl sm:text-[42px] leading-tight tracking-tight text-slate-900 max-w-2xl">
            Pick a course. <em className="italic">Start today.</em>
          </h2>

          <div className="mt-8">
            <TagFilterBar
              allTags={allTags}
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
              onClearTags={handleClearTags}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
            />
          </div>

          {filteredCourses.length === 0 ? (
            // Empty State
            <div className="p-12 text-center bg-white rounded-md border border-dashed border-slate-300 space-y-4 my-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <SearchX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl text-slate-900">No courses found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  No courses match all the selected tags. Try clearing or toggling other topic filters.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearTags}
                className="min-h-tap px-5 py-2 bg-brand-600 text-white rounded-full text-sm font-semibold hover:bg-brand-700 transition"
              >
                Reset all filters
              </button>
            </div>
          ) : viewMode === "grouped" && groupedCourses ? (
            // Grouped by Topic View
            <div className="space-y-10">
              {Object.entries(groupedCourses).map(([topic, coursesInTopic]) => (
                <section key={topic}>
                  <h3 className={`${LABEL} text-slate-500 pb-2 border-b-[1.5px] border-slate-900 capitalize`}>
                    {topic} ({coursesInTopic.length})
                  </h3>
                  <ol>{coursesInTopic.map(card)}</ol>
                </section>
              ))}
            </div>
          ) : (
            <ol className="border-t-[1.5px] border-slate-900">{filteredCourses.map(card)}</ol>
          )}
        </section>

        <section id="how" className="max-w-5xl w-full mx-auto px-4 pt-16 sm:pt-24 pb-16 sm:pb-24 scroll-mt-4">
          <p className={`${LABEL} text-brand-700 mb-3`}>How a lesson works</p>
          <h2 className="font-display text-3xl sm:text-[42px] leading-tight tracking-tight text-slate-900 max-w-2xl mb-8 sm:mb-10">
            Read a little. <em className="italic">Try it straight away.</em>
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {[
              ["Short screens", "One idea per screen, with a small drawing where it helps. No long videos to download."],
              ["Instant feedback", "Every answer tells you why it is right or wrong, so you learn from each try."],
              ["A second chance", "Missed one? It comes back a few screens later, so it sticks. Your progress stays on your phone."],
            ].map(([title, text], i) => (
              <li key={title} className="border-t-[1.5px] border-slate-900 pt-4">
                <span className={`${LABEL} text-brand-700`}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-[22px] sm:text-2xl text-slate-900 mt-2 mb-2">{title}</h3>
                <p className="text-[15px] sm:text-base leading-relaxed text-slate-700">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {/* Trust & Compliance Catalog Footer */}
      <footer className="bg-slate-900 text-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="block w-3 h-3 rounded-[3px] bg-brand-500" />
              <span className="font-display text-xl">{siteConfig.name}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 inline-flex gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>Your progress is saved on your phone. Nothing is sent anywhere unless you join the pilot list.</span>
            </p>
          </div>
          <div className="flex flex-col sm:items-end text-sm">
            <Link href="/privacy" className="min-h-tap inline-flex items-center underline underline-offset-2 hover:text-white">
              Privacy notice
            </Link>
            <a href={`mailto:${siteConfig.contactEmail}`} className="min-h-tap inline-flex items-center underline underline-offset-2 hover:text-white">
              {siteConfig.contactEmail}
            </a>
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="min-h-tap inline-flex items-center gap-1.5 text-left hover:text-white"
              title="Wipe locally saved progress from your browser"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear local data</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Confirmation Dialog */}
      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearData}
      />
    </div>
  );
}
