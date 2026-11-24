import Link from "next/link";
import { siteConfig } from "@/lib/config";

/** Wordmark and main links; the logo mark is a placeholder until the logo task. */
export function SiteHeader() {
  const navLink =
    "min-h-tap px-3 inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900 transition";
  return (
    <header className="border-b border-slate-200">
      <div className="max-w-5xl w-full mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
        <Link href="/" className="min-h-tap inline-flex items-center gap-2.5 text-slate-900">
          <span aria-hidden="true" className="block w-3.5 h-3.5 rounded-[3px] bg-brand-600" />
          <span className="font-display text-xl tracking-tight">{siteConfig.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <a href="#courses" className={`${navLink} hidden sm:inline-flex`}>
            Courses
          </a>
          <a href="#how" className={`${navLink} hidden sm:inline-flex`}>
            How it works
          </a>
          <a
            href="#courses"
            className="min-h-tap px-5 inline-flex items-center rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
          >
            Start learning
          </a>
        </nav>
      </div>
    </header>
  );
}
