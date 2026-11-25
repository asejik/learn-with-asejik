interface CatalogHeaderProps {
  courseCount: number;
  lessonCount: number;
}

const LABEL = "font-mono text-[11px] sm:text-xs uppercase tracking-[0.12em]";

/** The home page hero: what the site is, and two real numbers computed from the content. */
export function CatalogHeader({ courseCount, lessonCount }: CatalogHeaderProps) {
  const stats = [
    { value: courseCount, label: "Courses" },
    { value: lessonCount, label: "Lessons" },
    { value: 0, label: "Accounts needed" },
  ];
  return (
    <section className="pt-10 pb-10 sm:pt-16 sm:pb-14 flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-12">
      <div className="flex-1 min-w-0">
        <p className={`${LABEL} text-slate-500 mb-4 sm:mb-5`}>Interactive courses</p>
        <h1 className="font-display text-[40px] sm:text-6xl leading-[1.04] tracking-tight text-slate-900">
          Learn by doing, <em className="italic text-brand-500">one screen at a time.</em>
        </h1>
        <p className="mt-5 sm:mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-700">
          Master practical skills through in-depth modules and interactive checks. Each lesson takes 6 to 8 minutes and stays current as tools change.
        </p>
        <div className="mt-7 sm:mt-8 flex flex-wrap gap-3">
          <a
            href="#courses"
            className="min-h-[52px] px-7 inline-flex items-center rounded-full bg-brand-600 text-white text-base font-semibold hover:bg-brand-700 active:bg-brand-800 transition"
          >
            Browse courses
          </a>
          <a
            href="#how"
            className="min-h-[52px] px-7 inline-flex items-center rounded-full border-[1.5px] border-slate-900 text-slate-900 text-base font-semibold hover:bg-white transition"
          >
            How it works
          </a>
        </div>
      </div>

      <dl className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:w-56 shrink-0">
        {stats.map((s) => (
          // Term first in the markup (what a list of definitions needs), shown below its value
          <div key={s.label} className="border border-slate-200 bg-white rounded-md px-4 py-3.5 flex flex-col-reverse">
            <dt className={`${LABEL} mt-1.5 text-slate-500`}>{s.label}</dt>
            <dd className="font-display italic text-3xl sm:text-4xl leading-none text-slate-900">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
