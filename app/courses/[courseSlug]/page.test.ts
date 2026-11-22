import { describe, it, expect } from "vitest";
import CourseOverviewPage from "./page";

// redirect() and notFound() work by throwing; Next reads the error's digest.
async function digestOf(courseSlug: string): Promise<string> {
  try {
    await CourseOverviewPage({ params: Promise.resolve({ courseSlug }) });
  } catch (error) {
    return String((error as { digest?: unknown }).digest);
  }
  throw new Error("Expected the course page to redirect or 404");
}

describe("course overview page", () => {
  it("sends the learner to the first lesson", async () => {
    // Format: NEXT_REDIRECT;<type>;<url>;<status>;
    expect(await digestOf("how-apis-work")).toBe(
      "NEXT_REDIRECT;replace;/courses/how-apis-work/01-what-is-an-api;307;"
    );
  });

  it("returns 404 for an unknown course", async () => {
    expect(await digestOf("no-such-course")).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
