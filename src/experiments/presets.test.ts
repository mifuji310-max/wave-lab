import { describe, expect, it } from "vitest";
import { createExperimentPreset } from "./presets";

const grid = { columns: 200, rows: 120, visibleInsetCells: 20 };

describe("experiment presets", () => {
  it("starts the pulse preset with one finite pulse and no obstacles", () => {
    const preset = createExperimentPreset("pulse", grid);

    expect(preset.sources).toEqual([]);
    expect(preset.boundaryCells).toEqual([]);
    expect(preset.pulse).toMatchObject({ amplitude: 4 });
    expect(preset.interactionMode).toBe("pulse");
  });

  it("creates two coherent sources for the interference preset", () => {
    const preset = createExperimentPreset("interference", grid);

    expect(preset.sources).toHaveLength(2);
    expect(new Set(preset.sources.map((source) => source.phaseRadians))).toEqual(new Set([0]));
    expect(new Set(preset.sources.map((source) => source.wavelengthCells))).toEqual(new Set([24]));
    expect(preset.interactionMode).toBe("sourceSelect");
  });

  it("places a fixed wall in front of the reflection pulse", () => {
    const preset = createExperimentPreset("reflection", grid);

    expect(preset.pulse).toBeDefined();
    expect(preset.boundaryCells.length).toBeGreaterThan(0);
    expect(Math.min(...preset.boundaryCells.map((cell) => cell.column))).toBeGreaterThan(
      preset.pulse?.column ?? 0,
    );
  });

  it("places a coherent source line and a centered opening for diffraction", () => {
    const preset = createExperimentPreset("diffraction", grid);
    const sourceColumns = new Set(preset.sources.map((source) => source.column));
    const barrierColumns = new Set(preset.boundaryCells.map((cell) => cell.column));
    const centerRow = grid.rows / 2;

    expect(preset.sources).toHaveLength(7);
    expect(sourceColumns).toHaveLength(1);
    expect(barrierColumns).toHaveLength(2);
    expect(preset.boundaryCells.some((cell) => Math.abs(cell.row - centerRow) <= 5)).toBe(false);
  });
});
