import type { BoundaryCell, SolverConfig } from "../physics/solver";
import type { ContinuousSourceConfig } from "./types";
import {
  workerProtocolVersion,
  type WorkerCommand,
  type WorkerEvent,
} from "../workers/protocol";

export interface SimulationFrame {
  columns: number;
  rows: number;
  field: Float32Array;
  simulationTimeSeconds: number;
}

export interface SimulationControllerCallbacks {
  onReady: () => void;
  onFrame: (frame: SimulationFrame) => void;
  onError: (message: string) => void;
  onObservationSample: (sample: ObservationSample) => void;
  onPerformance: (measurement: PerformanceMeasurement) => void;
}

export interface PerformanceMeasurement {
  simulationStepsPerSecond: number;
  gridCellCount: number;
}

export interface ObservationSample {
  column: number;
  row: number;
  simulationTimeSeconds: number;
  displacement: number;
}

export class SimulationController {
  private readonly worker: Worker;

  public constructor(
    config: SolverConfig,
    private readonly callbacks: SimulationControllerCallbacks,
  ) {
    this.worker = new Worker(new URL("../workers/simulation.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.addEventListener("message", this.handleWorkerEvent);
    this.worker.addEventListener("error", this.handleWorkerFailure);
    this.send({ version: workerProtocolVersion, type: "INIT", config });
  }

  public start(): void {
    this.send({ version: workerProtocolVersion, type: "START" });
  }

  public pause(): void {
    this.send({ version: workerProtocolVersion, type: "PAUSE" });
  }

  public reset(): void {
    this.send({ version: workerProtocolVersion, type: "RESET" });
  }

  public step(): void {
    this.send({ version: workerProtocolVersion, type: "STEP" });
  }

  public setContinuousSource(enabled: boolean): void {
    this.send({ version: workerProtocolVersion, type: "SET_CONTINUOUS_SOURCE", enabled });
  }

  public setContinuousSources(sources: ContinuousSourceConfig[]): void {
    this.send({ version: workerProtocolVersion, type: "SET_CONTINUOUS_SOURCES", sources });
  }

  public setSpeed(multiplier: 0.25 | 0.5 | 1 | 2): void {
    this.send({ version: workerProtocolVersion, type: "SET_SPEED", multiplier });
  }

  public setObserver(column: number, row: number): void {
    this.send({ version: workerProtocolVersion, type: "SET_OBSERVER", column, row });
  }

  public setBoundaries(cells: BoundaryCell[]): void {
    this.send({ version: workerProtocolVersion, type: "SET_BOUNDARIES", cells });
  }

  public injectPulse(column: number, row: number, amplitude: number): void {
    this.send({
      version: workerProtocolVersion,
      type: "INJECT_PULSE",
      column,
      row,
      amplitude,
    });
  }

  public dispose(): void {
    this.send({ version: workerProtocolVersion, type: "DISPOSE" });
    this.worker.removeEventListener("message", this.handleWorkerEvent);
    this.worker.removeEventListener("error", this.handleWorkerFailure);
    this.worker.terminate();
  }

  private readonly handleWorkerEvent = (message: MessageEvent<WorkerEvent>): void => {
    const event = message.data;

    if (event.version !== workerProtocolVersion) {
      this.callbacks.onError("互換性のないシミュレーション通信を受信しました。");
      return;
    }

    switch (event.type) {
      case "READY":
        this.callbacks.onReady();
        return;
      case "FRAME":
        this.callbacks.onFrame({
          columns: event.columns,
          rows: event.rows,
          field: new Float32Array(event.fieldBuffer),
          simulationTimeSeconds: event.simulationTimeSeconds,
        });
        return;
      case "WARNING":
      case "ERROR":
        this.callbacks.onError(event.message);
        return;
      case "PERFORMANCE":
        this.callbacks.onPerformance({
          simulationStepsPerSecond: event.simulationStepsPerSecond,
          gridCellCount: event.gridCellCount,
        });
        return;
      case "OBSERVATION_SAMPLE":
        this.callbacks.onObservationSample({
          column: event.column,
          row: event.row,
          simulationTimeSeconds: event.simulationTimeSeconds,
          displacement: event.displacement,
        });
        return;
    }
  };

  private readonly handleWorkerFailure = (): void => {
    this.callbacks.onError("シミュレーションの計算を開始できませんでした。再読み込みしてください。");
  };

  private send(command: WorkerCommand): void {
    this.worker.postMessage(command);
  }
}
