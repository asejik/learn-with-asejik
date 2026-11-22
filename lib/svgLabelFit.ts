// Build-time check that every text label in a lesson SVG fits inside the
// circle or rectangle it sits in, with padding, so labels never touch or
// cross a shape's border (owner report, 2026-11-22).
//
// Text width is estimated per character from Inter (the site font). The
// factors were calibrated against real browser measurements of bold text
// (the widest weight used) and round up, so the estimate is always slightly
// wider than the rendered text. Characters outside the table count as 1em.
//
// Limits: only <circle> and <rect> count as shapes (rounded corners are
// treated as square); labels on other shapes are not checked. Anything that
// moves or resizes text in ways this check cannot follow fails the check
// rather than passing silently (see UNSUPPORTED).

/** Minimum gap between a label and its shape's border, in SVG units */
export const LABEL_PADDING = 4;

const NARROW = new Set("iljI.,:;'!|() ".split(""));
const SEMI_NARROW = new Set("rtf".split(""));
const WIDE = new Set("MWmw".split(""));

export function estimateTextWidth(text: string, fontSize: number): number {
  let ems = 0;
  for (const char of text) {
    if (NARROW.has(char)) ems += 0.32;
    else if (SEMI_NARROW.has(char)) ems += 0.42;
    else if (WIDE.has(char)) ems += 0.95;
    else if (char >= "A" && char <= "Z") ems += 0.72;
    else if (char.charCodeAt(0) > 126) ems += 1;
    else ems += 0.62;
  }
  return ems * fontSize;
}

type Attributes = Record<string, string>;

function parseAttributes(source: string): Attributes {
  const attributes: Attributes = {};
  for (const match of Array.from(source.matchAll(/([a-zA-Z-]+)\s*=\s*(["'])(.*?)\2/g))) {
    attributes[match[1]] = match[3];
  }
  return attributes;
}

function numberAttribute(attributes: Attributes, name: string, fallback?: number): number | null {
  const value = attributes[name];
  if (value === undefined) return fallback ?? null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface Circle {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
  stroke: number;
}

interface Rect {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: number;
}

type Shape = Circle | Rect;

interface Label {
  text: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  middleY: number;
}

function readShapes(svg: string, problems: string[]): Shape[] {
  const shapes: Shape[] = [];
  for (const match of Array.from(svg.matchAll(/<(circle|rect)\b([^>]*)\/?>/g))) {
    const attributes = parseAttributes(match[2]);
    const stroke = numberAttribute(attributes, "stroke-width", 1) ?? 1;
    if (match[1] === "circle") {
      const cx = numberAttribute(attributes, "cx", 0);
      const cy = numberAttribute(attributes, "cy", 0);
      const r = numberAttribute(attributes, "r");
      if (cx === null || cy === null || r === null) {
        problems.push(`A circle has a missing or non-numeric size: <circle${match[2]}>`);
        continue;
      }
      shapes.push({ kind: "circle", cx, cy, r, stroke });
    } else {
      const x = numberAttribute(attributes, "x", 0);
      const y = numberAttribute(attributes, "y", 0);
      const width = numberAttribute(attributes, "width");
      const height = numberAttribute(attributes, "height");
      if (x === null || y === null || width === null || height === null) {
        problems.push(`A rectangle has a missing or non-numeric size: <rect${match[2]}>`);
        continue;
      }
      shapes.push({ kind: "rect", x, y, width, height, stroke });
    }
  }
  return shapes;
}

function readLabels(svg: string, problems: string[]): Label[] {
  const labels: Label[] = [];
  for (const match of Array.from(svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g))) {
    const content = match[2];
    if (content.includes("<")) {
      // Fail closed: nested markup (e.g. <tspan>) can't be measured here.
      problems.push(`Label "${content}" uses nested tags; use one <text> element per line.`);
      continue;
    }
    const attributes = parseAttributes(match[1]);
    const x = numberAttribute(attributes, "x", 0);
    const y = numberAttribute(attributes, "y", 0);
    const fontSize = numberAttribute(attributes, "font-size");
    if (x === null || y === null || fontSize === null) {
      problems.push(`Label "${content}" needs numeric x, y and font-size attributes.`);
      continue;
    }
    const width = estimateTextWidth(content, fontSize);
    const anchor = attributes["text-anchor"] ?? "start";
    const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
    // Inter: capitals reach ~0.75em above the baseline, descenders ~0.2em below
    const top = y - fontSize * 0.75;
    const bottom = y + fontSize * 0.2;
    labels.push({
      text: content,
      left,
      right: left + width,
      top,
      bottom,
      middleY: (top + bottom) / 2,
    });
  }
  return labels;
}

function containsPoint(shape: Shape, x: number, y: number): boolean {
  if (shape.kind === "circle") return (x - shape.cx) ** 2 + (y - shape.cy) ** 2 <= shape.r ** 2;
  return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height;
}

function fitProblem(label: Label, shape: Shape): string | null {
  const inner = LABEL_PADDING + shape.stroke / 2;
  if (shape.kind === "circle") {
    const dy = Math.max(Math.abs(label.top - shape.cy), Math.abs(label.bottom - shape.cy));
    const room = shape.r - inner;
    if (dy >= room) return `Label "${label.text}" is too tall for its circle (radius ${shape.r}).`;
    const halfChord = Math.sqrt(room ** 2 - dy ** 2);
    const reach = Math.max(shape.cx - label.left, label.right - shape.cx);
    if (reach > halfChord) {
      const needed = Math.ceil(Math.sqrt(reach ** 2 + dy ** 2) + inner);
      return `Label "${label.text}" touches its circle's border (radius ${shape.r}; needs at least ${needed}, or a shorter label or second line).`;
    }
    return null;
  }
  const fits =
    label.left >= shape.x + inner &&
    label.right <= shape.x + shape.width - inner &&
    label.top >= shape.y + inner &&
    label.bottom <= shape.y + shape.height - inner;
  return fits
    ? null
    : `Label "${label.text}" does not fit inside its ${shape.width}x${shape.height} rectangle with ${LABEL_PADDING}px padding.`;
}

/** Returns a description of every label that would touch or cross its shape. */
export function findLabelOverflows(svg: string): string[] {
  const problems: string[] = [];
  for (const [pattern, reason] of UNSUPPORTED) {
    if (pattern.test(svg)) {
      problems.push(`Diagram uses ${reason}, which this check cannot measure; remove it or check the layout by hand.`);
    }
  }
  const shapes = readShapes(svg, problems);
  const labels = readLabels(svg, problems);
  for (const label of labels) {
    // The innermost shape under the label's centre is the one it sits in.
    const centreX = (label.left + label.right) / 2;
    const holders = shapes.filter((shape) => containsPoint(shape, centreX, label.middleY));
    const area = (shape: Shape) =>
      shape.kind === "circle" ? Math.PI * shape.r ** 2 : shape.width * shape.height;
    if (holders.length > 0) {
      const holder = holders.reduce((smallest, shape) => (area(shape) < area(smallest) ? shape : smallest));
      const problem = fitProblem(label, holder);
      if (problem) problems.push(problem);
    }
    // A label must not run into any shape it does not sit in.
    for (const shape of shapes) {
      if (!holders.includes(shape) && overlaps(label, shape)) {
        problems.push(`Label "${label.text}" runs into a ${shape.kind} it does not sit in.`);
      }
    }
  }
  return problems;
}

function overlaps(label: Label, shape: Shape): boolean {
  if (shape.kind === "circle") {
    const nearestX = Math.min(Math.max(shape.cx, label.left), label.right);
    const nearestY = Math.min(Math.max(shape.cy, label.top), label.bottom);
    return (nearestX - shape.cx) ** 2 + (nearestY - shape.cy) ** 2 < shape.r ** 2;
  }
  return (
    label.right > shape.x &&
    label.left < shape.x + shape.width &&
    label.bottom > shape.y &&
    label.top < shape.y + shape.height
  );
}

// Features that move or resize text or shapes in ways this check ignores.
const UNSUPPORTED: Array<[RegExp, string]> = [
  [/\stransform\s*=/i, "a transform"],
  [/<text\b[^>]*\s(dx|dy)\s*=/i, "dx/dy text offsets"],
  [/\sdominant-baseline\s*=|\salignment-baseline\s*=/i, "a baseline setting"],
  [/<text\b[^>]*\sstyle\s*=/i, "inline text styles"],
  [/\sletter-spacing\s*=|\stextLength\s*=|\sfont-family\s*=/i, "custom text spacing or font"],
  [/<ellipse\b/i, "an ellipse"],
];
