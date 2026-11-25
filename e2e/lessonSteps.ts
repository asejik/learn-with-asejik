import { expect, type Page } from "@playwright/test";

export const LESSON_URL = "/courses/how-apis-work/01-what-is-an-api";

// Titles of the six screens in how-apis-work/01-what-is-an-api
export const TITLES = [
  "The Digital Waiter",
  "The Contract Between Systems",
  "Real-World API In Action",
  "API Myths vs. Realities",
  "The Request-Response Lifecycle",
  "HTTP Status Code Matching",
];

export const feedback = (page: Page) => page.getByRole("region", { name: "Answer Feedback" });

/** Opens the lesson, passes the opening card, and lands on screen 1 */
export async function openLesson(page: Page) {
  await page.goto(LESSON_URL);
  await page.getByRole("button", { name: "Start lesson" }).click();
  await expect(page.getByRole("heading", { level: 1, name: TITLES[0] })).toBeVisible();
}

/** After the last screen: passes the lesson recap and the course finish card */
export async function passClosingCards(page: Page) {
  await expect(page.getByRole("heading", { name: "What you learned" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("The big picture")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
}

/** Answers screen `index` (wrongly if `correct` is false, cloze and choice only). Stops before Continue. */
export async function answer(page: Page, index: number, correct = true) {
  switch (index) {
    case 0:
      await page.getByRole("button", { name: /Continue to Checkpoint/ }).click();
      return;
    case 1:
      await page.getByRole("button", { name: correct ? "contract" : "cable", exact: true }).click();
      await page.getByRole("button", { name: "Check Blank Answer" }).click();
      break;
    case 2:
      await page.getByRole("button", { name: correct ? /^The app sends/ : /^Your smartphone/ }).click();
      await page.getByRole("button", { name: "Check Answer" }).click();
      break;
    case 3:
      // Each card gets its own feedback; the button moves to the next card
      const deck = [true, false, true];
      for (let i = 0; i < deck.length; i++) {
        const isTrue = deck[i];
        await page.getByRole("button", { name: isTrue ? "True / Yes" : "False / No" }).click();
        await expect(feedback(page)).toBeVisible();
        if (i < 2) await feedback(page).getByRole("button", { name: "Next card" }).click();
        else await feedback(page).getByRole("button", { name: "See results" }).click();
      }
      break;
    case 4:
      for (const label of ["1. Request", "2. Server Processing", "3. Response"]) {
        await page.getByRole("button", { name: label }).click();
      }
      // The last step explored completes the screen by itself
      break;
    case 5: {
      const pairs: Array<[string, string]> = [
        ["200 OK", "Request succeeded and data was returned"],
        ["401 Unauthorized", "API key or user login is missing"],
        ["404 Not Found", "The requested endpoint does not exist"],
        ["500 Server Error", "The remote server crashed or failed internally"],
      ];
      for (const [left, right] of pairs) {
        await page.getByRole("button", { name: left, exact: true }).click();
        await page.getByRole("button", { name: right, exact: true }).click();
      }
      break;
    }
  }
  await expect(feedback(page)).toBeVisible();
}

export async function continueFromFeedback(page: Page) {
  await feedback(page).getByRole("button", { name: /Continue|Complete Lesson/ }).click();
}
