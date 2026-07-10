import type { SolverConfig } from "../physics/solver";
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
    }
  };

  private readonly handleWorkerFailure = (): void => {
    this.callbacks.onError("シミュレーションの計算を開始できませんでした。再読み込みしてください。");
  };

  private send(command: WorkerCommand): void {
    this.worker.postMessage(command);
  }
}
