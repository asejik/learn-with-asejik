import { describe, it, expect } from "vitest";
import { estimateTextWidth, findLabelOverflows } from "./svgLabelFit";

// Widths measured in the browser on learn.asejik.com (Inter, SVG units),
// 2026-11-22, in bold except "(Waiter)" (regular). Bold is the widest weight
// used, so the table also covers regular text. The estimate must never be
// narrower than the real text.
const MEASURED: Array<[string, number, number]> = [
  ["3. Response", 12, 71.9],
  ["1. Request", 12, 59.8],
  ["2. Server", 12, 53.1],
  ["Response", 12, 57.9],
  ["Request", 12, 48.2],
  ["Server", 12, 39.1],
  ["Client", 12, 34.4],
  ["API", 12, 20.1],
  ["(Waiter)", 10, 37.5],
  ["MMMMMMMM", 12, 89.4],
  ["iiiiiiii", 12, 26],
];

const svg = (body: string) => `<svg viewBox='0 0 500 120'>${body}</svg>`;

describe("estimateTextWidth", () => {
  it("is never narrower than the measured browser width", () => {
    for (const [text, fontSize, measured] of MEASURED) {
      expect(estimateTextWidth(text, fontSize), text).toBeGreaterThanOrEqual(measured);
    }
  });
});

describe("findLabelOverflows", () => {
  it("flags the label that touched its circle on the live site", () => {
    const original = svg(
      "<circle cx='430' cy='60' r='35' stroke-width='2'/>" +
        "<text x='430' y='65' font-size='12' text-anchor='middle' font-weight='bold'>3. Response</text>"
    );
    const problems = findLabelOverflows(original);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('"3. Response"');
  });

  it("accepts a label with room to spare", () => {
    const roomy = svg(
      "<circle cx='70' cy='60' r='40' stroke-width='2'/>" +
        "<text x='70' y='73' font-size='12' text-anchor='middle'>Response</text>"
    );
    expect(findLabelOverflows(roomy)).toEqual([]);
  });

  it("flags a label that overflows its rectangle", () => {
    const tight = svg(
      "<rect x='10' y='30' width='50' height='40' stroke-width='2'/>" +
        "<text x='35' y='55' font-size='12' text-anchor='middle'>Response</text>"
    );
    expect(findLabelOverflows(tight)[0]).toContain("rectangle");
  });

  it("ignores labels on open background", () => {
    const free = svg(
      "<circle cx='70' cy='60' r='20'/>" + "<text x='300' y='60' font-size='12'>A long caption here</text>"
    );
    expect(findLabelOverflows(free)).toEqual([]);
  });

  it("flags a label that runs into a shape from outside", () => {
    const crossing = svg(
      "<circle cx='100' cy='60' r='30'/>" + "<text x='20' y='64' font-size='12'>A long caption</text>"
    );
    expect(findLabelOverflows(crossing)[0]).toContain("runs into a circle");
  });

  it("fails closed on attributes that move or resize text", () => {
    for (const extra of [
      "<g transform='scale(2)'></g>",
      "<text x='70' y='60' dy='4' font-size='12'>Hi</text>",
      "<text x='70' y='60' style='font-size:20px' font-size='12'>Hi</text>",
      "<ellipse cx='70' cy='60' rx='40' ry='20'/>",
    ]) {
      expect(findLabelOverflows(svg(extra)).join(" "), extra).toContain("cannot measure");
    }
  });

  it("counts characters outside the table as full width", () => {
    expect(estimateTextWidth("é", 10)).toBe(10);
  });

  it("fails closed on markup it cannot measure", () => {
    const nested = svg(
      "<circle cx='70' cy='60' r='40'/>" +
        "<text x='70' y='60' font-size='12'><tspan>Two</tspan><tspan>lines</tspan></text>"
    );
    expect(findLabelOverflows(nested)[0]).toContain("nested tags");
  });
});
