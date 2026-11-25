import { describe, it, expect } from "vitest";
import { splitByGlossary } from "./glossaryMatch";

const terms = (text: string, list: string[]) =>
  splitByGlossary(text, list).filter((p) => p.term).map((p) => [p.text, p.term]);

describe("splitByGlossary", () => {
  it("matches a single word in any case, with punctuation next to it", () => {
    expect(terms("An OTP, a PIN. Otp again.", ["OTP"])).toEqual([["OTP", "OTP"], ["Otp", "OTP"]]);
  });

  it("matches a plural", () => {
    expect(terms("Most scams work.", ["Scam"])).toEqual([["scams", "Scam"]]);
  });

  it("matches a phrase of more than one word", () => {
    expect(terms("You pay an advance fee first.", ["Advance fee"])).toEqual([["advance fee", "Advance fee"]]);
  });

  it("does not match inside a longer word", () => {
    expect(terms("A scammer and a promptly reply.", ["Scam", "Prompt"])).toEqual([]);
  });

  it("prefers the longer term over one inside it", () => {
    expect(terms("A pyramid scheme collapses.", ["Scheme", "Pyramid scheme"])).toEqual([
      ["pyramid scheme", "Pyramid scheme"],
    ]);
  });

  it("keeps all the text, in order", () => {
    const parts = splitByGlossary("Use the API, then the server.", ["API", "server"]);
    expect(parts.map((p) => p.text).join("")).toBe("Use the API, then the server.");
  });

  it("is safe with terms that contain special characters", () => {
    // matched as plain text, not read as a pattern
    expect(terms("Pay (now) or later.", ["(now)"])).toEqual([["(now)", "(now)"]]);
    expect(terms("Pay now or later.", ["(now)"])).toEqual([]);
    expect(splitByGlossary("plain", []).map((p) => p.text)).toEqual(["plain"]);
  });
});
