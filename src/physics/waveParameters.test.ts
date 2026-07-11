import { describe, expect, it } from "vitest";
import { calculateWaveTiming } from "./waveParameters";

describe("wave timing", () => {
  it("calculates period and frequency from wavelength and speed", () => {
    expect(calculateWaveTiming(24, 1)).toEqual({
      periodSeconds: 24,
      frequencyHertz: 1 / 24,
    });
  });

  it("keeps the v = fλ relationship when speed changes", () => {
    const timing = calculateWaveTiming(12, 2);
    expect(timing.periodSeconds).toBe(6);
    expect(timing.frequencyHertz).toBeCloseTo(1 / 6);
  });
});
