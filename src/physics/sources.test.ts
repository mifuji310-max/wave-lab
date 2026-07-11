import { describe, expect, it } from "vitest";
import { addGaussianSourceTerm, rickerWavelet } from "./sources";
import { createSolverState, stepSolver, type SolverConfig } from "./solver";

const config: SolverConfig = {
  columns: 25,
  rows: 25,
  waveSpeedCellsPerSecond: 1,
  cellSize: 1,
  timeStepSeconds: 0.5,
  dampingPerSecond: 0,
  absorptionLayerCells: 3,
  absorptionMaxDampingPerSecond: 1,
};

describe("source terms", () => {
  it("uses a finite-duration Ricker wavelet", () => {
    expect(rickerWavelet(-0.1, 36, 1 / 18, 1)).toBe(0);
    expect(rickerWavelet(18, 36, 1 / 18, 1)).toBe(1);
    expect(rickerWavelet(36.1, 36, 1 / 18, 1)).toBe(0);
  });

  it("adds a localized source through the FDTD source term", () => {
    const state = createSolverState(config);
    const sourceTerm = new Float32Array(config.columns * config.rows);
    addGaussianSourceTerm(sourceTerm, config, 12, 12, 1);
    stepSolver(state, config, sourceTerm);

    expect(state.current[12 * config.columns + 12]).toBeCloseTo(0.25);
    expect(state.current[1 * config.columns + 1]).toBe(0);
  });
});
