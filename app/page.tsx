import { getAllCourses } from "@/lib/content";
import { siteConfig } from "@/lib/config";
import { BookOpen, Sparkles, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const courses = getAllCourses();

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
      {/* Brand Header */}
      <header className="mb-8 border-b pb-6">
        <div className="flex items-center gap-2 text-brand-600 mb-1">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {siteConfig.brandName}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {siteConfig.name}
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
          {siteConfig.description}
        </p>
      </header>

      {/* Walking Skeleton Catalog Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Available Courses & Tutorials</h2>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
            {courses.length} Available
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <article
              key={course.slug}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 uppercase">
                    {course.mode}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ~{course.approxKbSize} KB • {course.estimatedMinutes} mins
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                  {course.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {course.canonicalTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                  <BookOpen className="w-3.5 h-3.5" />
                  Ready
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Walking Skeleton Footer */}
      <footer className="mt-16 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            NDPA 2023 Compliant
          </span>
        </div>
      </footer>
    </main>
  );
}
