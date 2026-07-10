import { describe, expect, it } from "vitest";
import {
  calculateCourantNumber,
  calculateDampingPerSecond,
  createSolverState,
  injectGaussianPulse,
  stepSolver,
  type SolverConfig,
} from "./solver";

const stableConfig: SolverConfig = {
  columns: 25,
  rows: 25,
  waveSpeedCellsPerSecond: 1,
  cellSize: 1,
  timeStepSeconds: 0.5,
  dampingPerSecond: 0,
  absorptionLayerCells: 3,
  absorptionMaxDampingPerSecond: 1,
};

describe("solver", () => {
  it("calculates a stable Courant number", () => {
    expect(calculateCourantNumber(stableConfig)).toBe(0.5);
  });

  it("adds damping only inside the outer absorption layer", () => {
    expect(calculateDampingPerSecond(stableConfig, 12, 12)).toBe(0);
    expect(calculateDampingPerSecond(stableConfig, 0, 12)).toBe(1);
    expect(calculateDampingPerSecond(stableConfig, 2, 12)).toBeCloseTo(1 / 9);
  });

  it("rejects a configuration outside the two-dimensional stability margin", () => {
    expect(() =>
      createSolverState({ ...stableConfig, timeStepSeconds: 0.8 }),
    ).toThrow("Unstable solver configuration");
  });

  it("keeps an empty field at rest", () => {
    const state = createSolverState(stableConfig);
    stepSolver(state, stableConfig);

    expect([...state.current].every((value) => value === 0)).toBe(true);
  });

  it("preserves symmetry for a centered Gaussian pulse after one step", () => {
    const state = createSolverState(stableConfig);
    injectGaussianPulse(state, stableConfig, 12, 12, 1);
    stepSolver(state, stableConfig);

    const left = state.current[12 * stableConfig.columns + 11];
    const right = state.current[12 * stableConfig.columns + 13];
    const above = state.current[11 * stableConfig.columns + 12];
    const below = state.current[13 * stableConfig.columns + 12];

    expect(left).toBe(right);
    expect(left).toBe(above);
    expect(left).toBe(below);
  });
});
