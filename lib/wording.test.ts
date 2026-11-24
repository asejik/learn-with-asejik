import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Words that made past screens say things the pilot does not do (P16-P05, R05):
// there are no accounts, nothing is linked or synced, and no certificates exist.
const BANNED = /\baccounts?\b|\blinked\b|\bcredentials\b|\bcertificates?\b|ready to sync|strictly on your|planned to be hosted|tune future|Explored in detail/i;

const FILES = [
  "components/player/LessonCompletionView.tsx",
  "components/privacy/PrivacyNoticeContent.tsx",
  "components/catalog/ClearDataModal.tsx",
  "components/pwa/PWARegister.tsx",
  "components/player/PlayerShell.tsx",
  "lib/pilotSignup.ts",
];

describe("learner-facing wording", () => {
  it.each(FILES)("%s has no false or misleading words", (file) => {
    const text = readFileSync(file, "utf-8");
    const hits = text.split("\n").filter((line) => BANNED.test(line));
    expect(hits).toEqual([]);
  });
});
