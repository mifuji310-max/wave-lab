import { describe, expect, it } from "vitest";
import { colorForDisplacement } from "./colorScale";

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
});
