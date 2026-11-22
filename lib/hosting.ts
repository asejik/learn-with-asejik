import type { Course } from "./schema";

// Build-time helpers for the Cloudflare Workers static-assets deployment.

/**
 * Cloudflare `_redirects` rules: a course address (`/courses/<slug>`) sends
 * learners to that course's first lesson, or to the catalog if it has none.
 * In a static export the page itself can only redirect after JavaScript
 * loads, so this gives a real HTTP redirect.
 */
export function buildRedirects(courses: Course[]): string {
  const lines = courses.map((course) => {
    const firstLesson = course.chapters[0]?.lessons[0];
    const target = firstLesson ? `/courses/${course.slug}/${firstLesson.slug}` : "/";
    return `/courses/${course.slug} ${target} 307`;
  });
  return lines.join("\n") + "\n";
}

/**
 * Next 16's static export writes per-segment prefetch data in nested folders
 * (`__next.courses/$d$courseSlug/__PAGE__.txt`), but the browser requests the
 * dotted name (`__next.courses.$d$courseSlug.__PAGE__.txt`), which 404s.
 * Given a path relative to a page folder, returns the dotted name the browser
 * asks for, or null if the path is not nested segment data.
 */
export function flatSegmentName(relativePath: string): string | null {
  const parts = relativePath.split(/[\\/]/);
  if (parts.length < 2 || !parts[0].startsWith("__next.") || !relativePath.endsWith(".txt")) {
    return null;
  }
  return parts.join(".");
}
