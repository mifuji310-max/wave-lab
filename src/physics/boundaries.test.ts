import { describe, expect, it } from "vitest";
import { createSingleSlitBoundaryCells } from "./boundaries";

describe("single slit boundary", () => {
  it("leaves an open region through a two-cell-thick barrier", () => {
    const cells = createSingleSlitBoundaryCells(80, 80, 40, 40);

    expect(cells.some((cell) => cell.column === 40 && cell.row === 40)).toBe(false);
    expect(cells.some((cell) => cell.column === 40 && cell.row === 10)).toBe(true);
    expect(cells.some((cell) => cell.column === 41 && cell.row === 10)).toBe(true);
  });
});
