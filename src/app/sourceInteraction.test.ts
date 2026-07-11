import { describe, expect, it } from "vitest";
import type { ContinuousSourceConfig } from "../simulation/types";
import { resolveSourceTap } from "./sourceInteraction";

const source: ContinuousSourceConfig = {
  id: "source-1",
  column: 40,
  row: 30,
  amplitude: 0.8,
  wavelengthCells: 24,
  phaseRadians: 0,
  enabled: true,
};

describe("source tap interaction", () => {
  it("selects an existing source in either source mode", () => {
    expect(resolveSourceTap([source], 42, 31, false)).toEqual({ type: "select", source });
  });

  it("creates a source only when creation is explicitly enabled", () => {
    expect(resolveSourceTap([source], 80, 70, true)).toEqual({ type: "create" });
  });

  it("ignores empty-space taps in selection-only mode", () => {
    expect(resolveSourceTap([source], 80, 70, false)).toEqual({ type: "ignore" });
  });
});
