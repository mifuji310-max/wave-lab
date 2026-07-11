/// <reference lib="webworker" />

import {
  createSolverState,
  resetSolverState,
  setFixedBoundaryCells,
  stepSolver,
  type SolverConfig,
  type SolverState,
} from "../physics/solver";
import { addGaussianSourceTerm, rickerWavelet } from "../physics/sources";
import { workerProtocolVersion, type WorkerCommand, type WorkerEvent } from "./protocol";
import type { ContinuousSourceConfig } from "../simulation/types";

let config: SolverConfig | undefined;
let state: SolverState | undefined;
let timerId: number | undefined;
let continuousSourceEnabled = false;
let continuousSources: ContinuousSourceConfig[] = [];
let observer: { column: number; row: number } | undefined;
let simulationStepCount = 0;
let playbackSpeed: 0.25 | 0.5 | 1 | 2 = 1;
let performanceWindowStartedAt = performance.now();
let performanceWindowStepCount = 0;
let sourceTerm: Float32Array | undefined;
let activePulses: Array<{
  column: number;
  row: number;
  amplitude: number;
  startedAtSeconds: number;
}> = [];

const pulseDurationSeconds = 36;
const pulseCentralFrequencyHz = 1 / 18;

self.onmessage = (message: MessageEvent<WorkerCommand>) => {
  try {
    handleCommand(message.data);
  } catch (error) {
    emit({
      version: workerProtocolVersion,
      type: "ERROR",
      message: error instanceof Error ? error.message : "The simulation worker failed.",
    });
  }
};

function handleCommand(command: WorkerCommand): void {
  if (command.version !== workerProtocolVersion) {
    emit({
      version: workerProtocolVersion,
      type: "ERROR",
      message: "Unsupported simulation worker protocol version.",
    });
    return;
  }

  switch (command.type) {
    case "INIT":
      stopLoop();
      config = command.config;
      state = createSolverState(config);
      sourceTerm = new Float32Array(config.columns * config.rows);
      activePulses = [];
      continuousSourceEnabled = false;
      continuousSources = [];
      observer = undefined;
      activePulses = [];
      simulationStepCount = 0;
      playbackSpeed = 1;
      resetPerformanceWindow();
      emit({ version: workerProtocolVersion, type: "READY" });
      emitFrame();
      return;
    case "START":
      requireState();
      requireConfig();
      startLoop();
      return;
    case "PAUSE":
      stopLoop();
      return;
    case "STEP":
      stepAndEmit();
      return;
    case "RESET":
      resetSolverState(requireState());
      setFixedBoundaryCells(requireState(), requireConfig(), []);
      continuousSourceEnabled = false;
      continuousSources = [];
      observer = undefined;
      simulationStepCount = 0;
      emitFrame();
      return;
    case "SET_CONTINUOUS_SOURCE":
      continuousSourceEnabled = command.enabled;
      return;
    case "SET_CONTINUOUS_SOURCES":
      continuousSources = command.sources.map((source) => ({ ...source }));
      return;
    case "SET_SPEED":
      playbackSpeed = command.multiplier;

      if (timerId !== undefined) {
        stopLoop();
        startLoop();
      }
      return;
    case "SET_OBSERVER":
      observer = {
        column: Math.max(1, Math.min(requireConfig().columns - 2, command.column)),
        row: Math.max(1, Math.min(requireConfig().rows - 2, command.row)),
      };
      emitObservationSample();
      return;
    case "SET_BOUNDARIES":
      setFixedBoundaryCells(requireState(), requireConfig(), command.cells);
      emitFrame();
      return;
    case "INJECT_PULSE":
      activePulses.push({
        column: command.column,
        row: command.row,
        amplitude: command.amplitude,
        startedAtSeconds: requireState().simulationTimeSeconds,
      });
      return;
    case "DISPOSE":
      stopLoop();
      config = undefined;
      state = undefined;
      return;
  }
}

function startLoop(): void {
  if (timerId !== undefined) {
    return;
  }

  timerId = self.setInterval(stepAndEmit, 16 / playbackSpeed);
}

function stopLoop(): void {
  if (timerId !== undefined) {
    self.clearInterval(timerId);
    timerId = undefined;
  }
}

function stepAndEmit(): void {
  const currentState = requireState();
  const currentConfig = requireConfig();
  const currentSourceTerm = requireSourceTerm();
  currentSourceTerm.fill(0);

  if (continuousSourceEnabled) {
    for (const source of continuousSources) {
      // In normalized units c = 1 cell/s, so angular frequency is 2π/λ.
      const sourceAngularFrequency = (2 * Math.PI) / source.wavelengthCells;
      const sourceAmplitude =
        Math.sin(currentState.simulationTimeSeconds * sourceAngularFrequency + source.phaseRadians) *
        source.amplitude;
      addGaussianSourceTerm(
        currentSourceTerm,
        currentConfig,
        source.column,
        source.row,
        sourceAmplitude,
      );
    }
  }

  for (const pulse of activePulses) {
    const elapsedSeconds = currentState.simulationTimeSeconds - pulse.startedAtSeconds;
    const pulseStrength = rickerWavelet(
      elapsedSeconds,
      pulseDurationSeconds,
      pulseCentralFrequencyHz,
      pulse.amplitude,
    );
    addGaussianSourceTerm(currentSourceTerm, currentConfig, pulse.column, pulse.row, pulseStrength);
  }

  activePulses = activePulses.filter(
    (pulse) => currentState.simulationTimeSeconds - pulse.startedAtSeconds <= pulseDurationSeconds,
  );

  stepSolver(currentState, currentConfig, currentSourceTerm);
  simulationStepCount += 1;
  performanceWindowStepCount += 1;
  emitFrame();

  emitPerformanceIfReady(currentConfig);

  if (simulationStepCount % 3 === 0) {
    emitObservationSample();
  }
}

function emitPerformanceIfReady(currentConfig: SolverConfig): void {
  const now = performance.now();
  const elapsedMilliseconds = now - performanceWindowStartedAt;

  if (elapsedMilliseconds < 1000) {
    return;
  }

  emit({
    version: workerProtocolVersion,
    type: "PERFORMANCE",
    simulationStepsPerSecond: (performanceWindowStepCount * 1000) / elapsedMilliseconds,
    gridCellCount: currentConfig.columns * currentConfig.rows,
  });
  resetPerformanceWindow();
}

function resetPerformanceWindow(): void {
  performanceWindowStartedAt = performance.now();
  performanceWindowStepCount = 0;
}

function emitObservationSample(): void {
  if (observer === undefined) {
    return;
  }

  const currentState = requireState();
  const currentConfig = requireConfig();
  const index = observer.row * currentConfig.columns + observer.column;

  emit({
    version: workerProtocolVersion,
    type: "OBSERVATION_SAMPLE",
    column: observer.column,
    row: observer.row,
    simulationTimeSeconds: currentState.simulationTimeSeconds,
    displacement: currentState.current[index],
  });
}

function emitFrame(): void {
  const currentState = requireState();
  const currentConfig = requireConfig();
  const fieldBuffer = currentState.current.slice().buffer;
  const event: WorkerEvent = {
    version: workerProtocolVersion,
    type: "FRAME",
    columns: currentConfig.columns,
    rows: currentConfig.rows,
    simulationTimeSeconds: currentState.simulationTimeSeconds,
    fieldBuffer,
  };

  // The renderer must not receive the Worker-owned solver array. Copying is
  // intentional for this prototype and will be profiled before optimization.
  self.postMessage(event, [fieldBuffer]);
}

function requireState(): SolverState {
  if (state === undefined) {
    throw new Error("Initialize the simulation before sending commands.");
  }

  return state;
}

function requireConfig(): SolverConfig {
  if (config === undefined) {
    throw new Error("Initialize the simulation before sending commands.");
  }

  return config;
}

function requireSourceTerm(): Float32Array {
  if (sourceTerm === undefined) {
    throw new Error("Initialize the simulation before sending source commands.");
  }

  return sourceTerm;
}

function emit(event: WorkerEvent): void {
  self.postMessage(event);
}
