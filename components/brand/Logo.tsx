import { siteConfig } from "@/lib/config";

/**
 * The Learn with Asejik logo: a ladder-shaped A (a nod to the truss A of
 * asejik.com) on a charcoal tile, and the name on one straight line with the
 * dots of the "j" and "i" in the accent colour. Colours come from the logo
 * variables in globals.css.
 */

/** The tile with the ladder A. Decorative: the name next to it says what it is. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="200" height="200" rx="44" fill="var(--logo-charcoal)" />
      <g transform="translate(24 27.5) scale(.76)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 182 L100 30 L176 182" stroke="var(--logo-ivory)" strokeWidth="14" />
        <path d="M64 108 H136" stroke="var(--logo-ivory)" strokeWidth="12" />
        <path d="M48 142 H152" stroke="var(--logo-accent)" strokeWidth="12" />
        <circle cx="100" cy="24" r="22" fill="var(--logo-accent)" stroke="none" />
      </g>
    </svg>
  );
}

/** "Learn with Asejik" on one line; the dots on the j and i are coloured. */
export function Wordmark({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={`logo-wordmark font-display tracking-tight whitespace-nowrap ${
        tone === "dark" ? "logo-wordmark-dark" : ""
      } ${className}`}
    >
      Learn with Ase<span className="logo-dot">j</span>
      <span className="logo-dot">i</span>k
    </span>
  );
}

/** Mark and name together, as used in the header and footer. */
export function Logo({ tone = "light", size = 32, className = "" }: { tone?: "light" | "dark"; size?: number; className?: string }) {
  // The wordmark spells the site name in full, so keep it in step with the config
  if (siteConfig.name !== "Learn with Asejik") {
    throw new Error("Logo wordmark is drawn for the name 'Learn with Asejik'");
  }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <Wordmark tone={tone} className="text-lg sm:text-xl" />
    </span>
  );
}
