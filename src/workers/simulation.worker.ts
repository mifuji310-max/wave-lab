/// <reference lib="webworker" />

import {
  createSolverState,
  injectGaussianPulse,
  resetSolverState,
  stepSolver,
  type SolverConfig,
  type SolverState,
} from "../physics/solver";
import { workerProtocolVersion, type WorkerCommand, type WorkerEvent } from "./protocol";

let config: SolverConfig | undefined;
let state: SolverState | undefined;
let timerId: number | undefined;

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
      emitFrame();
      return;
    case "INJECT_PULSE":
      injectGaussianPulse(requireState(), requireConfig(), command.column, command.row, command.amplitude);
      emitFrame();
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

  timerId = self.setInterval(stepAndEmit, 16);
}

function stopLoop(): void {
  if (timerId !== undefined) {
    self.clearInterval(timerId);
    timerId = undefined;
  }
}

function stepAndEmit(): void {
  stepSolver(requireState(), requireConfig());
  emitFrame();
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

function emit(event: WorkerEvent): void {
  self.postMessage(event);
}
