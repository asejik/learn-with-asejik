import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

const PUBLIC = path.join(process.cwd(), "public");
const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, "manifest.json"), "utf-8"));

/** Width and height from a PNG's header. */
function pngSize(file: string): [number, number] {
  const buf = fs.readFileSync(file);
  expect(buf.subarray(1, 4).toString()).toBe("PNG");
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

describe("app icons", () => {
  it("every icon in the manifest exists and has the size it declares", () => {
    for (const icon of manifest.icons as Array<{ src: string; sizes: string; type: string }>) {
      const file = path.join(PUBLIC, icon.src);
      expect(fs.existsSync(file), icon.src).toBe(true);
      if (icon.type === "image/png") {
        const [w, h] = icon.sizes.split("x").map(Number);
        expect(pngSize(file), icon.src).toEqual([w, h]);
      }
    }
  });

  it("offers a maskable icon, the iPhone icon and a favicon", () => {
    expect((manifest.icons as Array<{ purpose: string }>).some((i) => i.purpose === "maskable")).toBe(true);
    expect(pngSize(path.join(PUBLIC, "apple-touch-icon.png"))).toEqual([180, 180]);
    expect(fs.existsSync(path.join(PUBLIC, "favicon.ico"))).toBe(true);
  });

  it("the share card is the size social sites expect", () => {
    expect(pngSize(path.join(PUBLIC, "og-image.png"))).toEqual([1200, 630]);
  });

  it("the tab icon uses the logo colours, not the old blue", () => {
    const svg = fs.readFileSync(path.join(PUBLIC, "icon.svg"), "utf-8").toLowerCase();
    expect(svg).toContain("#16140f");
    expect(svg).not.toContain("#2563eb");
  });
});
