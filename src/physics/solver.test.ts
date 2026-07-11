import { describe, expect, it } from "vitest";
import {
  calculateCourantNumber,
  calculateDampingPerSecond,
  createSolverState,
  setFixedBoundaryCells,
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

  it("keeps fixed wall cells at zero displacement", () => {
    const state = createSolverState(stableConfig);
    setFixedBoundaryCells(state, stableConfig, [{ column: 12, row: 12 }]);
    const sourceTerm = new Float32Array(stableConfig.columns * stableConfig.rows);
    sourceTerm[12 * stableConfig.columns + 12] = 1;
    stepSolver(state, stableConfig, sourceTerm);

    expect(state.current[12 * stableConfig.columns + 12]).toBe(0);
  });

  it("lets outgoing displacement enter the absorbing outer boundary", () => {
    const state = createSolverState(stableConfig);
    const edgeNeighborIndex = 12 * stableConfig.columns + 1;
    const edgeIndex = 12 * stableConfig.columns;
    state.previous[edgeNeighborIndex] = 1;
    state.current[edgeNeighborIndex] = 1;

    stepSolver(state, stableConfig);

    expect(state.current[edgeIndex]).not.toBe(0);
  });

  it("removes a pulse after it leaves the simulated field", () => {
    const absorptionConfig: SolverConfig = {
      ...stableConfig,
      absorptionLayerCells: 5,
      absorptionMaxDampingPerSecond: 1.5,
    };
    const state = createSolverState(absorptionConfig);
    const sourceTerm = new Float32Array(absorptionConfig.columns * absorptionConfig.rows);
    sourceTerm[12 * absorptionConfig.columns + 12] = 1;
    stepSolver(state, absorptionConfig, sourceTerm);

    for (let step = 0; step < 300; step += 1) {
      stepSolver(state, absorptionConfig);
    }

    const remainingPeak = Math.max(...state.current.map((value) => Math.abs(value)));
    expect(remainingPeak).toBeLessThan(0.005);
  });
});
