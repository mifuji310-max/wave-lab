import { describe, expect, it } from "vitest";
import { colorForDisplacement, writeDisplacementColors } from "./colorScale";

describe("displacement color scale", () => {
  it("uses a neutral gray for equilibrium", () => {
    expect(colorForDisplacement(0)).toEqual({ red: 226, green: 232, blue: 240 });
  });

  it("maps positive displacement toward red and negative displacement toward blue", () => {
    const high = colorForDisplacement(2);
    const low = colorForDisplacement(-2);

    expect(high.red).toBeGreaterThan(high.blue);
    expect(low.blue).toBeGreaterThan(low.red);
  });

  it("writes the lookup colors directly into a reusable pixel buffer", () => {
    const target = new Uint8ClampedArray(12);
    writeDisplacementColors(target, new Float32Array([-2, 0, 2]), "color");

    expect(target[2]).toBeGreaterThan(target[0]);
    expect([...target.slice(4, 7)]).toEqual([226, 232, 240]);
    expect(target[8]).toBeGreaterThan(target[10]);
    expect([target[3], target[7], target[11]]).toEqual([255, 255, 255]);
  });
});
