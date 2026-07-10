import type { SolverConfig } from "../physics/solver";

export const workerProtocolVersion = 1 as const;

export type WorkerCommand =
  | { version: typeof workerProtocolVersion; type: "INIT"; config: SolverConfig }
  | { version: typeof workerProtocolVersion; type: "START" }
  | { version: typeof workerProtocolVersion; type: "PAUSE" }
  | { version: typeof workerProtocolVersion; type: "STEP" }
  | { version: typeof workerProtocolVersion; type: "RESET" }
  | { version: typeof workerProtocolVersion; type: "SET_CONTINUOUS_SOURCE"; enabled: boolean }
  | { version: typeof workerProtocolVersion; type: "SET_OBSERVER"; column: number; row: number }
  | {
      version: typeof workerProtocolVersion;
      type: "INJECT_PULSE";
      column: number;
      row: number;
      amplitude: number;
    }
  | { version: typeof workerProtocolVersion; type: "DISPOSE" };

export type WorkerEvent =
  | { version: typeof workerProtocolVersion; type: "READY" }
  | {
      version: typeof workerProtocolVersion;
      type: "FRAME";
      columns: number;
      rows: number;
      simulationTimeSeconds: number;
      fieldBuffer: ArrayBuffer;
    }
  | { version: typeof workerProtocolVersion; type: "WARNING"; message: string }
  | {
      version: typeof workerProtocolVersion;
      type: "OBSERVATION_SAMPLE";
      column: number;
      row: number;
      simulationTimeSeconds: number;
      displacement: number;
    }
  | { version: typeof workerProtocolVersion; type: "ERROR"; message: string };
