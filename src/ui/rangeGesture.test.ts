import { describe, expect, it } from "vitest";
import { classifyRangeGesture } from "./rangeGesture";

describe("range gesture classification", () => {
  it("waits until the pointer has moved far enough", () => {
    expect(classifyRangeGesture(3, 4)).toBe("pending");
  });

  it("treats a mostly vertical movement as panel scrolling", () => {
    expect(classifyRangeGesture(3, 12)).toBe("vertical");
  });

  it("allows intentional horizontal parameter changes", () => {
    expect(classifyRangeGesture(14, 4)).toBe("horizontal");
  });
});
