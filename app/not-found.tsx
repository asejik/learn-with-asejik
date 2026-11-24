import Link from "next/link";
import { ArrowRight, BookOpen, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      {/* Mini Brand Header */}
      <header className="max-w-xl w-full mx-auto pt-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:bg-brand-700 transition">
            A
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-sm group-hover:text-brand-600 transition">
            Learn with Asejik
          </span>
        </Link>
      </header>

      {/* Main 404 Content */}
      <main className="max-w-md w-full mx-auto my-auto text-center space-y-6 py-12">
        <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-2xs">
          <Compass className="w-8 h-8 text-brand-600 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600">
            404 &bull; Page Not Found
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Lost in the Architecture?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            The page or tutorial you were looking for doesn&apos;t exist, was moved, or hasn&apos;t been published yet.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full min-h-tap px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>Return to Course Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-xl w-full mx-auto pb-4 text-center text-[11px] text-slate-400">
        &copy; {new Date().getFullYear()} Learn with Asejik. Low-data interactive education.
      </footer>
    </div>
  );
}
