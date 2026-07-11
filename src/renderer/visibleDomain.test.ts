import { describe, expect, it } from "vitest";
import { cellInVisibleDomain, createVisibleDomain } from "./visibleDomain";

describe("visible simulation domain", () => {
  it("removes the absorption layer from all four displayed edges", () => {
    expect(createVisibleDomain({ columns: 258, rows: 143 }, 26)).toEqual({
      left: 26,
      top: 26,
      columns: 206,
      rows: 91,
    });
  });

  it("maps display corners back into the full solver grid", () => {
    const domain = createVisibleDomain({ columns: 258, rows: 143 }, 26);

    expect(cellInVisibleDomain(domain, 0, 0)).toEqual({ column: 26, row: 26 });
    expect(cellInVisibleDomain(domain, 1, 1)).toEqual({ column: 231, row: 116 });
  });
});
