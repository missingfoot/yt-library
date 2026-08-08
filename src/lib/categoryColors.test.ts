import { describe, it, expect } from "vitest";
import { catColor, CATEGORY_NAMES } from "./categoryColors";

describe("catColor", () => {
  it("returns the correct hex for a known category", () => {
    expect(catColor("Gaming")).toBe("#E8734A");
  });

  it("returns the fallback gray for an unknown category", () => {
    expect(catColor("Not A Real Category")).toBe("#5C6274");
  });

  it("returns the fallback gray for undefined (no category)", () => {
    expect(catColor(undefined)).toBe("#5C6274");
  });
});

describe("CATEGORY_NAMES", () => {
  it("contains all 19 known categories, excluding Uncategorized", () => {
    expect(CATEGORY_NAMES).toHaveLength(19);
    expect(CATEGORY_NAMES).not.toContain("Uncategorized");
    expect(CATEGORY_NAMES).toContain("Gaming");
  });
});
