import { useEffect, useRef, useState } from "react";
import type { SolverConfig } from "../physics/solver";
import { WaveCanvas } from "../renderer/WaveCanvas";
import {
  SimulationController,
  type SimulationFrame,
} from "../simulation/SimulationController";

type SimulationStatus = "loading" | "ready" | "running" | "paused" | "error";

const statusLabels: Record<SimulationStatus, string> = {
  loading: "計算を準備中",
  ready: "準備中",
  running: "再生中",
  paused: "一時停止中",
  error: "計算エラー",
};

const prototypeConfig: SolverConfig = {
  columns: 128,
  rows: 160,
  waveSpeedCellsPerSecond: 1,
  cellSize: 1,
  timeStepSeconds: 0.5,
  dampingPerSecond: 0.02,
  absorptionLayerCells: 16,
  absorptionMaxDampingPerSecond: 1.2,
};

export function App() {
  const controllerReference = useRef<SimulationController | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>("loading");
  const [frame, setFrame] = useState<SimulationFrame>();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const controller = new SimulationController(prototypeConfig, {
      onReady: () => setSimulationStatus("ready"),
      onFrame: setFrame,
      onError: (message) => {
        setErrorMessage(message);
        setSimulationStatus("error");
      },
    });
    controllerReference.current = controller;

    return () => {
      controller.dispose();
      controllerReference.current = null;
    };
  }, []);

  const handlePlayPause = () => {
    if (simulationStatus === "running") {
      controllerReference.current?.pause();
      setSimulationStatus("paused");
      return;
    }

    controllerReference.current?.start();
    setSimulationStatus("running");
  };

  const handleReset = () => {
    controllerReference.current?.reset();
    setSimulationStatus("ready");
  };

  const handlePulse = (column: number, row: number) => {
    controllerReference.current?.injectPulse(column, row, 1.4);

    if (simulationStatus !== "running") {
      controllerReference.current?.start();
      setSimulationStatus("running");
    }
  };

  const isRunning = simulationStatus === "running";
  const controlsDisabled = simulationStatus === "loading" || simulationStatus === "error";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">実験して理解する</p>
          <h1>Wave Lab</h1>
        </div>
        <p className="status" aria-live="polite">
          {statusLabels[simulationStatus]}
        </p>
      </header>

      <section className="experiment" aria-labelledby="experiment-title">
        <div className="field-container">
          <p id="experiment-title">波を起こしてみよう</p>
          <WaveCanvas frame={frame} onPulse={handlePulse} />
          <p className="field-hint">フィールドをタップすると、波が広がります</p>
          <div className="color-legend" aria-label="波の高さの色の説明">
            <span>低い</span>
            <span className="legend-gradient" aria-hidden="true" />
            <span>高い</span>
          </div>
        </div>
      </section>

      <section className="control-panel" aria-label="シミュレーション操作">
        <button type="button" className="primary-control" onClick={handlePlayPause} disabled={controlsDisabled}>
          {isRunning ? "一時停止" : "再生"}
        </button>
        <button type="button" onClick={handleReset} disabled={controlsDisabled}>
          リセット
        </button>
      </section>
      {errorMessage === undefined ? null : <p className="error-message">{errorMessage}</p>}
    </main>
  );
}
