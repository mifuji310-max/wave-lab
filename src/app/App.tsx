import { useEffect, useRef, useState } from "react";
import { ObservationPanel } from "../observation/ObservationPanel";
import type { SolverConfig } from "../physics/solver";
import { WaveCanvas } from "../renderer/WaveCanvas";
import { appVersion } from "../shared/version";
import {
  SimulationController,
  type ObservationSample,
  type SimulationFrame,
} from "../simulation/SimulationController";

type SimulationStatus = "loading" | "ready" | "running" | "paused" | "error";
type InteractionMode = "pulse" | "observer";

const statusLabels: Record<SimulationStatus, string> = {
  loading: "計算を準備中",
  ready: "準備中",
  running: "再生中",
  paused: "一時停止中",
  error: "計算エラー",
};

const prototypeConfig = createPrototypeConfig();

export function App() {
  const controllerReference = useRef<SimulationController | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>("loading");
  const [frame, setFrame] = useState<SimulationFrame>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [continuousSourceEnabled, setContinuousSourceEnabled] = useState(false);
  const [displayMode, setDisplayMode] = useState<"color" | "monochrome">("color");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("pulse");
  const [observer, setObserver] = useState<{ column: number; row: number }>();
  const [observationSamples, setObservationSamples] = useState<ObservationSample[]>([]);
  const [observationPanelOpen, setObservationPanelOpen] = useState(false);

  useEffect(() => {
    const controller = new SimulationController(prototypeConfig, {
      onReady: () => setSimulationStatus("ready"),
      onFrame: setFrame,
      onObservationSample: (sample) => {
        setObservationSamples((samples) => [...samples.slice(-179), sample]);
      },
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
    setObservationSamples([]);
    setSimulationStatus("ready");
  };

  const handleStep = () => {
    controllerReference.current?.step();
    setSimulationStatus("paused");
  };

  const handleContinuousSource = () => {
    const nextEnabled = !continuousSourceEnabled;
    controllerReference.current?.setContinuousSource(nextEnabled);
    setContinuousSourceEnabled(nextEnabled);

    if (nextEnabled && simulationStatus !== "running") {
      controllerReference.current?.start();
      setSimulationStatus("running");
    }
  };

  const handleFieldTap = (column: number, row: number) => {
    if (interactionMode === "observer") {
      controllerReference.current?.setObserver(column, row);
      setObserver({ column, row });
      setObservationSamples([]);
      setObservationPanelOpen(true);
      return;
    }

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
          <div className="title-row">
            <h1>Wave Lab</h1>
            <span className="version-label">v{appVersion}</span>
          </div>
        </div>
        <p className="status" aria-live="polite">
          {statusLabels[simulationStatus]}
        </p>
      </header>

      <section className="experiment" aria-labelledby="experiment-title">
        <div className="field-container">
          <h2 id="experiment-title" className="field-title">
            {interactionMode === "pulse" ? "タップして波を起こす" : "タップして観測点を置く"}
          </h2>
          <WaveCanvas
            frame={frame}
            displayMode={displayMode}
            observer={observer}
            interactionMode={interactionMode}
            onFieldTap={handleFieldTap}
          />
          <div className="color-legend" aria-label="波の高さの色の説明">
            <span>低い</span>
            <span className="legend-gradient" aria-hidden="true" />
            <span>高い</span>
          </div>
        </div>
      </section>

      <ObservationPanel
        open={observationPanelOpen}
        observer={observer}
        samples={observationSamples}
        onToggle={() => setObservationPanelOpen((open) => !open)}
      />

      <section className="control-panel" aria-label="シミュレーション操作">
        <button
          type="button"
          className={interactionMode === "pulse" ? "mode-control active-control" : "mode-control"}
          onClick={() => setInteractionMode("pulse")}
        >
          波を起こす
        </button>
        <button
          type="button"
          className={interactionMode === "observer" ? "mode-control active-control" : "mode-control"}
          onClick={() => setInteractionMode("observer")}
        >
          観測点
        </button>
        <button type="button" className="primary-control" onClick={handlePlayPause} disabled={controlsDisabled}>
          {isRunning ? "一時停止" : "再生"}
        </button>
        <button type="button" onClick={handleReset} disabled={controlsDisabled}>
          リセット
        </button>
        <button type="button" onClick={handleStep} disabled={controlsDisabled || isRunning}>
          一歩進む
        </button>
        <button type="button" onClick={handleContinuousSource} disabled={controlsDisabled}>
          連続波: {continuousSourceEnabled ? "ON" : "OFF"}
        </button>
        <button type="button" onClick={() => setDisplayMode((mode) => (mode === "color" ? "monochrome" : "color"))}>
          {displayMode === "color" ? "白黒表示" : "色表示"}
        </button>
      </section>
      {errorMessage === undefined ? null : <p className="error-message">{errorMessage}</p>}
    </main>
  );
}

function createPrototypeConfig(): SolverConfig {
  const availableWidth = window.innerWidth;
  const availableHeight = Math.max(320, window.innerHeight - 56);
  const fieldAspectRatio = Math.max(0.55, Math.min(1.8, availableWidth / availableHeight));
  const targetCellCount = 192 * 192;
  const columns = Math.round(Math.sqrt(targetCellCount * fieldAspectRatio));
  const rows = Math.round(targetCellCount / columns);
  const minimumDimension = Math.min(columns, rows);

  return {
    columns,
    rows,
    waveSpeedCellsPerSecond: 1,
    cellSize: 1,
    timeStepSeconds: 0.5,
    dampingPerSecond: 0.02,
    absorptionLayerCells: Math.max(16, Math.round(minimumDimension * 0.1)),
    absorptionMaxDampingPerSecond: 1.2,
  };
}
