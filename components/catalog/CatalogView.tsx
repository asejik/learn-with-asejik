"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Course } from "@/lib/schema";
import { CatalogHeader } from "./CatalogHeader";
import { TagFilterBar } from "./TagFilterBar";
import { CourseCard } from "./CourseCard";
import { ClearDataModal } from "./ClearDataModal";
import { ShieldCheck, Trash2, SearchX } from "lucide-react";
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

  // Filtered and sorted courses
  const filteredCourses = useMemo(() => {
    let result = [...initialCourses];

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
  }, [initialCourses, selectedTags, viewMode]);

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

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Brand Header */}
        <CatalogHeader />

        {/* Topic Filter & Sort Controls */}
        <TagFilterBar
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          onClearTags={handleClearTags}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
        />

        {/* Course Grid / Grouped Sections */}
        {filteredCourses.length === 0 ? (
          // Empty State
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4 my-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <SearchX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No tutorials found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No courses match all the selected tags. Try clearing or toggling other topic filters.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearTags}
              className="min-h-tap px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === "grouped" && groupedCourses ? (
          // Grouped by Topic View
          <div className="space-y-8 my-6">
            {Object.entries(groupedCourses).map(([topic, coursesInTopic]) => (
              <section key={topic} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <h3 className="text-base font-extrabold text-slate-900 capitalize">
                    {topic}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">
                    {coursesInTopic.length}
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {coursesInTopic.map((course) => (
                    <CourseCard
                      key={course.slug}
                      course={course}
                      progressPercent={percentFor(course)}
                      resumeLessonSlug={resumeLesson(course, completedMap[course.slug] ?? [])?.slug}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          // Standard / Alphabetical Grid View
          <div className="grid gap-5 sm:grid-cols-2 my-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.slug}
                course={course}
                progressPercent={percentFor(course)}
                      resumeLessonSlug={resumeLesson(course, completedMap[course.slug] ?? [])?.slug}
              />
            ))}
          </div>
        )}
      </main>

      {/* Trust & Compliance Catalog Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-slate-900 underline underline-offset-2 font-medium"
            >
              Privacy Notice & NDPA Rights
            </Link>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Progress stays on your device
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="min-h-tap px-3 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition flex items-center gap-1 font-medium"
              title="Wipe locally saved progress from your browser"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Data</span>
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
