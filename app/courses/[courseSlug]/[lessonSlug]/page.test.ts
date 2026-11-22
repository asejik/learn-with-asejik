import { describe, it, expect } from "vitest";
import { generateMetadata } from "./page";
import { siteConfig } from "@/lib/config";

// The root layout's title template adds " | <site name>", so the page title
// must not add it again.
async function titleOf(courseSlug: string, lessonSlug: string) {
  const metadata = await generateMetadata({ params: Promise.resolve({ courseSlug, lessonSlug }) });
  return metadata.title;
}

describe("lesson page title", () => {
  it("is the lesson title, without the site name", async () => {
    const title = await titleOf("how-apis-work", "01-what-is-an-api");
    expect(title).toBe("Understanding APIs & Data Exchange");
    expect(String(title)).not.toContain(siteConfig.name);
  });

  it("falls back without the site name for an unknown lesson", async () => {
    expect(await titleOf("how-apis-work", "no-such-lesson")).toBe("Interactive Lesson");
  });
});
