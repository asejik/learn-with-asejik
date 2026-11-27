import { test, expect, type Page } from "@playwright/test";
import { TITLES, answer, continueFromFeedback, feedback, openLesson, passClosingCards } from "./lessonSteps";

const heading = (page: Page) => page.getByRole("heading", { level: 1 });

test("catalog: buttons and links are at least 44px", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const small = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main button:not([disabled]), main a, nav a, nav button"))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30), h: r.height, w: r.width };
      })
      // Links hidden at this width (display: none) are not tap targets
      .filter((b) => (b.h > 0 || b.w > 0) && (b.h < 44 || b.w < 44))
  );
  expect(small).toEqual([]);
});

test("the logo shows in the header on one line", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("link", { name: "Learn with Asejik, home" });
  await expect(logo).toBeVisible();
  const lineHeight = await logo.locator(".logo-wordmark").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.height / parseFloat(getComputedStyle(el).fontSize);
  });
  // One line of text is about 1.2 times the font size tall; two lines would be 2.4
  expect(lineHeight).toBeLessThan(1.6);
  await expect(logo.locator(".logo-dot")).toHaveCount(2);
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(sideways).toBe(false);
});

test.describe("lesson player", () => {
  test("completes the lesson and shows the sign-up form", async ({ page }) => {
    test.setTimeout(60_000); // a whole lesson walk, slower on a busy machine
    await openLesson(page);
    for (let i = 0; i < TITLES.length; i++) {
      await expect(heading(page)).toHaveText(TITLES[i]);
      await answer(page, i);
      if (i > 1) await continueFromFeedback(page);
    }
    await passClosingCards(page);
    await expect(page.getByRole("heading", { name: /Join the pilot/ })).toBeVisible();
    // One-lesson tutorial: nothing follows, and the catalog shows it complete
    await expect(page.getByText(/Tutorial Completed/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Next lesson/ })).toHaveCount(0);
    // Storage works here, so no warning
    await expect(page.getByText(/could not be saved on this phone/)).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByText("100%")).toBeVisible();
  });

  test("Continue is hidden until the learner answers, and a wrong answer shows amber feedback", async ({ page }) => {
    await openLesson(page);
    await answer(page, 0);
    await answer(page, 1);
    await expect(heading(page)).toHaveText(TITLES[2]);
    await expect(page.getByRole("button", { name: /^Continue/ })).toHaveCount(0);
    await answer(page, 2, false);
    await expect(feedback(page).getByRole("heading", { name: "Not quite right" })).toBeVisible();
    await expect(feedback(page)).not.toContainText("Correct");
  });

  test("a wrong answer comes back once and the lesson still finishes", async ({ page }) => {
    test.setTimeout(60_000); // a whole lesson walk, slower on a busy machine
    await openLesson(page);
    await answer(page, 0);
    await answer(page, 1);
    await answer(page, 2, false);
    await continueFromFeedback(page);
    for (let i = 3; i <= 5; i++) {
      await expect(heading(page)).toHaveText(TITLES[i]);
      await answer(page, i);
      await continueFromFeedback(page);
    }
    // Three screens later the same question returns as a retry
    await expect(heading(page)).toHaveText(TITLES[2]);
    await expect(page.getByText("Active Recall Retry")).toBeVisible();
    await answer(page, 2);
    await continueFromFeedback(page);
    await expect(heading(page)).toHaveText(TITLES[6]);
    await answer(page, 6);
    await continueFromFeedback(page);
    await passClosingCards(page);
    await expect(page.getByRole("heading", { name: /Join the pilot/ })).toBeVisible();
  });

  test("the opening card shows the course overview and is skipped on a mid-lesson reload", async ({ page }) => {
    await page.goto("/courses/how-apis-work/01-what-is-an-api");
    await expect(heading(page)).toHaveText(/How APIs Work/);
    await expect(page.getByText("What you will learn")).toBeVisible();
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(sideways).toBe(false);
    const start = page.getByRole("button", { name: "Start lesson" });
    expect((await start.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await start.click();
    await answer(page, 0);
    await expect(heading(page)).toHaveText(TITLES[1]);
    await page.reload();
    await expect(heading(page)).toHaveText(TITLES[1]);
    await expect(page.getByRole("button", { name: "Start lesson" })).toHaveCount(0);
  });

  test("the lessons list opens finished lessons and keeps later ones locked", async ({ page }) => {
    // Lesson 1 finished, so lessons 1 and 2 can be opened and 3 and 4 stay locked
    await page.goto("/courses/spot-scams/02-fake-alerts-and-otps");
    await expect(page.getByRole("button", { name: "Start lesson" })).toBeVisible(); // the app has opened its storage
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open("asejik_learning_db", 1);
          open.onerror = () => reject(open.error);
          // Same stores as lib/db.ts, in case the app has not created them yet
          open.onupgradeneeded = () => {
            const d = open.result;
            if (!d.objectStoreNames.contains("user_profile")) d.createObjectStore("user_profile");
            if (!d.objectStoreNames.contains("course_progress")) d.createObjectStore("course_progress", { keyPath: "courseSlug" });
            if (!d.objectStoreNames.contains("lesson_state")) d.createObjectStore("lesson_state", { keyPath: "key" });
          };
          open.onsuccess = () => {
            const db = open.result;
            const tx = db.transaction("course_progress", "readwrite");
            tx.objectStore("course_progress").put({
              courseSlug: "spot-scams",
              completedLessonSlugs: ["01-the-scammers-playbook"],
              activeLessonSlug: "01-the-scammers-playbook",
              lastActiveAt: Date.now(),
              percentage: 25,
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          };
        })
    );
    await page.getByRole("button", { name: "Open the list of lessons" }).click();
    const list = page.getByRole("dialog", { name: "Lessons" });
    await expect(list.getByText("You are here")).toBeVisible();
    await expect(list.getByRole("link", { name: /The Scammer's Playbook/ })).toBeVisible();
    // Lessons 3 and 4 are not reached yet: shown, but not links
    await expect(list.getByRole("link", { name: /Investment, Loan and Job Scams/ })).toHaveCount(0);
    await expect(list.getByText(/Locked until you finish/)).toHaveCount(2);
    // Going back to lesson 1 opens it from its first card
    await list.getByRole("link", { name: /The Scammer's Playbook/ }).click();
    await expect(page).toHaveURL(/01-the-scammers-playbook/);
    await expect(heading(page)).toHaveText("Spot Scams Before They Spot You");
  });

  test("a reload resumes at the same screen", async ({ page }) => {
    await openLesson(page);
    await answer(page, 0);
    await answer(page, 1);
    await answer(page, 2);
    await continueFromFeedback(page);
    await expect(heading(page)).toHaveText(TITLES[3]);
    await page.reload();
    await expect(heading(page)).toHaveText(TITLES[3]);
  });

  test("Back looks at an earlier screen without scoring it, and returns to the same place", async ({ page }) => {
    await openLesson(page);
    await answer(page, 0);
    await answer(page, 1);
    await answer(page, 2);
    await continueFromFeedback(page);
    await expect(heading(page)).toHaveText(TITLES[3]);
    await page.getByRole("button", { name: "Go back to the previous screen" }).click();
    await expect(heading(page)).toHaveText(TITLES[2]);
    await expect(page.getByText(/Looking back/)).toBeVisible();
    // A wrong answer while looking back is practice: nothing is queued for retry
    await answer(page, 2, false);
    await page.getByRole("button", { name: "Back to where you were" }).click();
    await expect(heading(page)).toHaveText(TITLES[3]);
    await expect(page.getByText(/Looking back/)).toHaveCount(0);
    // The first screen has no Back button
    await page.getByRole("button", { name: "Go back to the previous screen" }).click();
    await page.getByRole("button", { name: "Go back to the previous screen" }).click();
    await page.getByRole("button", { name: "Go back to the previous screen" }).click();
    await expect(heading(page)).toHaveText(TITLES[0]);
    await expect(page.getByRole("button", { name: "Go back to the previous screen" })).toHaveCount(0);
  });

  test("feedback panel: right-hand on desktop, bottom on phone", async ({ page, viewport }) => {
    await openLesson(page);
    await answer(page, 0);
    await answer(page, 1);
    await answer(page, 2);
    const box = (await feedback(page).boundingBox())!;
    if (viewport!.width >= 1024) {
      expect(box.x + box.width).toBeCloseTo(viewport!.width, 0);
      expect(box.height).toBeGreaterThanOrEqual(viewport!.height - 1);
    } else {
      expect(box.width).toBeCloseTo(viewport!.width, 0);
      expect(box.y + box.height).toBeGreaterThan(viewport!.height * 0.5);
    }
  });

  test("every screen: no sideways scroll, tap targets at least 44px, no console errors", async ({ page }) => {
    test.setTimeout(60_000); // a whole lesson walk, slower on a busy machine
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await openLesson(page);
    for (let i = 0; i < TITLES.length; i++) {
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect(sideways, `sideways scroll on screen ${i + 1}`).toBe(false);
      // Answer buttons and nav controls. Inline glossary words are checked
      // separately below: they stay inline, with an invisible 44px hit area.
      const small = await page.evaluate(() =>
        Array.from(document.querySelectorAll("main button:not([disabled]):not([title^='Define:']), nav a, nav button"))
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30), h: r.height, w: r.width };
          })
          .filter((b) => b.h < 44 || b.w < 44)
      );
      expect(small, `small tap targets on screen ${i + 1}`).toEqual([]);
      await answer(page, i);
      if (i > 1) await continueFromFeedback(page);
    }
    expect(errors).toEqual([]);
  });

  test("tells the learner when this phone cannot save progress", async ({ page }) => {
    test.setTimeout(60_000); // a whole lesson walk, slower on a busy machine
    // A phone whose storage is blocked or full has no usable IndexedDB
    await page.addInitScript(() => {
      delete (window as { indexedDB?: unknown }).indexedDB;
    });
    const warning = page.getByRole("alert").filter({ hasText: "could not be saved on this phone" });
    await openLesson(page);
    await answer(page, 0);
    await expect(heading(page)).toHaveText(TITLES[1]);
    await expect(warning).toBeVisible(); // shown while learning, as soon as a save fails
    await answer(page, 1);
    for (let i = 2; i < TITLES.length; i++) {
      await answer(page, i);
      await continueFromFeedback(page);
    }
    await passClosingCards(page);
    await expect(page.getByRole("heading", { name: /Join the pilot/ })).toBeVisible();
    await expect(warning).toBeVisible(); // and again on the completion screen
  });

  test("glossary words have a hit area of at least 44 x 44px", async ({ page }) => {
    await openLesson(page);
    const words = page.locator("main button[title^='Define:']");
    expect(await words.count()).toBeGreaterThan(0);
    for (let n = 0; n < (await words.count()); n++) {
      const word = words.nth(n);
      await word.scrollIntoViewIfNeeded();
      const box = (await word.boundingBox())!;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      // A tap anywhere in a 44px square around the word must land on the word
      for (const [dx, dy] of [[-21, 0], [21, 0], [0, -21], [0, 21]]) {
        const hit = await word.evaluate(
          (el, [x, y]) => el.contains(document.elementFromPoint(x, y)),
          [cx + dx, cy + dy]
        );
        expect(hit, `word ${n} at offset ${dx},${dy}`).toBe(true);
      }
    }
  });
});
