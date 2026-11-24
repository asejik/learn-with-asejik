import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";
import { TITLES, answer, continueFromFeedback, openLesson } from "./lessonSteps";

// Serious and critical WCAG A/AA problems fail the test
async function scan(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(" ")}`),
    label
  ).toEqual([]);
}

test("catalog, privacy and course pages", async ({ page }) => {
  for (const url of ["/", "/privacy", "/courses/how-apis-work"]) {
    await page.goto(url);
    await scan(page, url);
  }
});

test("every lesson screen and its feedback panel", async ({ page }) => {
  await openLesson(page);
  for (let i = 0; i < TITLES.length; i++) {
    await scan(page, `screen ${i + 1} before answering`);
    await answer(page, i);
    if (i > 0) await scan(page, `screen ${i + 1} feedback`);
    if (i > 0) await continueFromFeedback(page);
  }
  await expect(page.getByRole("heading", { name: /Save Your Progress/ })).toBeVisible();
  await scan(page, "completion screen");
});

test("the wrong-answer (amber) feedback panel", async ({ page }) => {
  await openLesson(page);
  await answer(page, 0);
  await answer(page, 1, false);
  await scan(page, "amber feedback");
});
