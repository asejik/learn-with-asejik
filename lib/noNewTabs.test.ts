import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

// Project rule: reference links open in a slide-over drawer, never a new tab
// that pulls learners out of the lesson.

const ROOTS = ["app", "components", "lib"];
const NEW_TAB = /["'`]_blank["'`]|\b(?:window|globalThis|self)\.open\s*\(/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });
}

describe("no new tabs", () => {
  it("finds the source files to check", () => {
    expect(ROOTS.flatMap((root) => sourceFiles(path.join(process.cwd(), root))).length).toBeGreaterThan(10);
  });

  it("never opens a new browser tab", () => {
    const offenders = ROOTS.flatMap((root) => sourceFiles(path.join(process.cwd(), root)))
      .filter((file) => NEW_TAB.test(fs.readFileSync(file, "utf-8")))
      .map((file) => path.relative(process.cwd(), file));
    expect(offenders).toEqual([]);
  });
});
