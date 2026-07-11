import { describe, expect, it } from "vitest";
import { addGaussianSourceTerm, rickerWavelet } from "./sources";
import {
  createSolverState,
  setFixedBoundaryCells,
  stepSolver,
  type SolverConfig,
  type SolverState,
} from "./solver";

function createValidationConfig(columns: number, rows: number): SolverConfig {
  return {
    columns,
    rows,
    waveSpeedCellsPerSecond: 1,
    cellSize: 1,
    timeStepSeconds: 0.5,
    dampingPerSecond: 0,
    absorptionLayerCells: Math.max(8, Math.round(Math.min(columns, rows) * 0.12)),
    absorptionMaxDampingPerSecond: 1.5,
  };
}

describe("wave physics validation", () => {
  it("propagates along a grid axis at the configured wave speed", () => {
    const config = createValidationConfig(121, 121);
    const state = createSolverState(config);
    const sourceTerm = new Float32Array(config.columns * config.rows);
    const center = 60;
    const nearSeries: number[] = [];
    const farSeries: number[] = [];

    addGaussianSourceTerm(sourceTerm, config, center, center, 1);
    stepSolver(state, config, sourceTerm);

    for (let step = 0; step < 180; step += 1) {
      stepSolver(state, config);
      nearSeries.push(Math.abs(valueAt(state, config, center + 20, center)));
      farSeries.push(Math.abs(valueAt(state, config, center + 40, center)));
    }

    const nearArrival = firstRelativeThresholdTime(nearSeries, config.timeStepSeconds, 0.05);
    const farArrival = firstRelativeThresholdTime(farSeries, config.timeStepSeconds, 0.05);
    const measuredSpeed = 20 / (farArrival - nearArrival);

    expect(measuredSpeed).toBeGreaterThan(0.92);
    expect(measuredSpeed).toBeLessThan(1.08);
  });

  it("inverts the dominant reflected pulse at a fixed wall", () => {
    const config = createValidationConfig(161, 61);
    const state = createSolverState(config);
    const wallColumn = 110;
    setFixedBoundaryCells(
      state,
      config,
      Array.from({ length: config.rows - 2 }, (_, index) => ({
        column: wallColumn,
        row: index + 1,
      })),
    );
    const sourceTerm = new Float32Array(config.columns * config.rows);
    const samples: Array<{ time: number; value: number }> = [];

    for (let step = 0; step < 380; step += 1) {
      sourceTerm.fill(0);
      addGaussianSourceTerm(
        sourceTerm,
        config,
        30,
        30,
        rickerWavelet(state.simulationTimeSeconds, 36, 1 / 18, 1),
      );
      stepSolver(state, config, sourceTerm);
      samples.push({
        time: state.simulationTimeSeconds,
        value: valueAt(state, config, 70, 30),
      });
    }

    const incident = dominantSignedValue(samples, 45, 85);
    const reflected = dominantSignedValue(samples, 125, 175);

    expect(incident * reflected).toBeLessThan(0);
    expect(Math.abs(reflected)).toBeGreaterThan(Math.abs(incident) * 0.25);
  });

  it("forms lower-amplitude nodes than antinodes between coherent sources", () => {
    const config = createValidationConfig(197, 121);
    const state = createSolverState(config);
    const sourceTerm = new Float32Array(config.columns * config.rows);
    const wavelengthCells = 24;
    const angularFrequency = (2 * Math.PI * config.waveSpeedCellsPerSecond) / wavelengthCells;
    const sourceColumns = [50, 146];
    const row = 60;
    const nodeColumns = [80, 92, 104, 116];
    const antinodeColumns = [74, 86, 98, 110, 122];
    const nodePeaks = new Array<number>(nodeColumns.length).fill(0);
    const antinodePeaks = new Array<number>(antinodeColumns.length).fill(0);
    const totalSteps = Math.round((25 * wavelengthCells) / config.timeStepSeconds);
    const measurementStartStep = Math.round((21 * wavelengthCells) / config.timeStepSeconds);

    for (let step = 0; step < totalSteps; step += 1) {
      sourceTerm.fill(0);
      const amplitude = Math.sin(state.simulationTimeSeconds * angularFrequency);

      for (const column of sourceColumns) {
        addGaussianSourceTerm(sourceTerm, config, column, row, amplitude);
      }

      stepSolver(state, config, sourceTerm);

      if (step >= measurementStartStep) {
        updatePeaks(nodePeaks, nodeColumns, state, config, row);
        updatePeaks(antinodePeaks, antinodeColumns, state, config, row);
      }
    }

    expect(median(antinodePeaks)).toBeGreaterThan(median(nodePeaks) * 2.5);
  });
});

function valueAt(
  state: SolverState,
  config: SolverConfig,
  column: number,
  row: number,
): number {
  return state.current[row * config.columns + column];
}

function firstRelativeThresholdTime(
  samples: number[],
  timeStepSeconds: number,
  fraction: number,
): number {
  const peak = Math.max(...samples);
  const sampleIndex = samples.findIndex((sample) => sample >= peak * fraction);

  if (sampleIndex < 0) {
    throw new Error("The wave did not reach the measurement point.");
  }

  return (sampleIndex + 1) * timeStepSeconds;
}

function dominantSignedValue(
  samples: Array<{ time: number; value: number }>,
  startTime: number,
  endTime: number,
): number {
  return samples
    .filter((sample) => sample.time >= startTime && sample.time <= endTime)
    .reduce(
      (dominant, sample) =>
        Math.abs(sample.value) > Math.abs(dominant) ? sample.value : dominant,
      0,
    );
}

function updatePeaks(
  peaks: number[],
  columns: number[],
  state: SolverState,
  config: SolverConfig,
  row: number,
): void {
  columns.forEach((column, index) => {
    peaks[index] = Math.max(peaks[index], Math.abs(valueAt(state, config, column, row)));
  });
}

function median(values: number[]): number {
  const sortedValues = [...values].sort((left, right) => left - right);
  return sortedValues[Math.floor(sortedValues.length / 2)];
}
