import fs from "fs";
import path from "path";
import { getAllCourses, getAllLessonParams } from "../lib/content";
import { buildRedirects, flatSegmentName } from "../lib/hosting";

// Runs after `next build` (static export). Writes the Cloudflare redirects
// file and fails the build if anything the deployment needs is missing.

const OUT = path.join(process.cwd(), "out");

function fail(message: string): never {
  console.error(`❌ Export check failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(OUT)) fail("out/ was not created. Is `output: \"export\"` set in next.config.mjs?");

fs.writeFileSync(path.join(OUT, "_redirects"), buildRedirects(getAllCourses()));

// Copy nested segment prefetch data to the dotted names the browser requests
// (see flatSegmentName). Existing files are never overwritten.
function filesUnder(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

let flattened = 0;
for (const file of filesUnder(OUT)) {
  const relative = path.relative(OUT, file).split(path.sep);
  const start = relative.findIndex((part, i) => part.startsWith("__next.") && i < relative.length - 1);
  if (start === -1) continue;
  const name = flatSegmentName(relative.slice(start).join("/"));
  if (!name) continue;
  const target = path.join(OUT, ...relative.slice(0, start), name);
  if (!fs.existsSync(target)) {
    fs.copyFileSync(file, target);
    flattened += 1;
  } else if (!fs.readFileSync(target).equals(fs.readFileSync(file))) {
    // Next wrote both names with different data: something changed upstream.
    fail(`${path.relative(OUT, target)} differs from ${path.relative(OUT, file)}; check the Next.js export.`);
  }
}

const required = [
  "_headers",
  "_redirects",
  "sw.js",
  "manifest.json",
  "index.html",
  "offline.html",
  "privacy.html",
  "404.html",
  ...getAllLessonParams().map((p) => `courses/${p.courseSlug}/${p.lessonSlug}.html`),
];
const missing = required.filter((file) => !fs.existsSync(path.join(OUT, file)));
if (missing.length > 0) fail(`missing ${missing.join(", ")}`);

// The static export silently drops API routes; signups must go through the
// Worker (worker/index.ts), never a file in out/.
if (fs.existsSync(path.join(OUT, "api"))) fail("out/api exists; API routes cannot be static files.");

const headers = fs.readFileSync(path.join(OUT, "_headers"), "utf-8");
for (const header of ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options"]) {
  if (!headers.includes(header)) fail(`_headers is missing ${header}`);
}

console.log(
  `✅ Export ready for Cloudflare Workers: ${required.length} required files present, ${flattened} segment data file(s) copied to their requested names.`
);
