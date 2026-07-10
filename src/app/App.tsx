import { useEffect, useRef, useState } from "react";
import { ObservationPanel } from "../observation/ObservationPanel";
import type { BoundaryCell, SolverConfig } from "../physics/solver";
import { WaveCanvas } from "../renderer/WaveCanvas";
import { appVersion } from "../shared/version";
import {
  SimulationController,
  type ObservationSample,
  type PerformanceMeasurement,
  type SimulationFrame,
} from "../simulation/SimulationController";

type SimulationStatus = "loading" | "ready" | "running" | "paused" | "error";
type InteractionMode = "pulse" | "observer" | "wall" | "erase";

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
  const boundaryCellsReference = useRef<Map<string, BoundaryCell>>(new Map());
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>("loading");
  const [frame, setFrame] = useState<SimulationFrame>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [continuousSourceEnabled, setContinuousSourceEnabled] = useState(false);
  const [displayMode, setDisplayMode] = useState<"color" | "monochrome">("color");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("pulse");
  const [observer, setObserver] = useState<{ column: number; row: number }>();
  const [observationSamples, setObservationSamples] = useState<ObservationSample[]>([]);
  const [observationPanelOpen, setObservationPanelOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.25 | 0.5 | 1 | 2>(1);
  const [performanceMeasurement, setPerformanceMeasurement] = useState<PerformanceMeasurement>();
  const [boundaryCells, setBoundaryCells] = useState<BoundaryCell[]>([]);

  useEffect(() => {
    const controller = new SimulationController(prototypeConfig, {
      onReady: () => setSimulationStatus("ready"),
      onFrame: setFrame,
      onObservationSample: (sample) => {
        setObservationSamples((samples) => [...samples.slice(-179), sample]);
      },
      onPerformance: setPerformanceMeasurement,
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

    if (interactionMode === "wall" || interactionMode === "erase") {
      updateBoundaries([{ column, row }], interactionMode === "erase");
      return;
    }

    controllerReference.current?.injectPulse(column, row, 1.4);

    if (simulationStatus !== "running") {
      controllerReference.current?.start();
      setSimulationStatus("running");
    }
  };

  const handleFieldDrag = (from: BoundaryCell, to: BoundaryCell) => {
    if (interactionMode !== "wall" && interactionMode !== "erase") {
      return;
    }

    updateBoundaries(rasterizeLine(from, to), interactionMode === "erase");
  };

  const updateBoundaries = (centers: BoundaryCell[], erase: boolean) => {
    const nextBoundaryCells = new Map(boundaryCellsReference.current);

    for (const center of centers) {
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
          const cell = {
            column: center.column + columnOffset,
            row: center.row + rowOffset,
          };
          const key = `${cell.column}:${cell.row}`;

          if (erase) {
            nextBoundaryCells.delete(key);
          } else {
            nextBoundaryCells.set(key, cell);
          }
        }
      }
    }

    boundaryCellsReference.current = nextBoundaryCells;
    const cells = [...nextBoundaryCells.values()];
    setBoundaryCells(cells);
    controllerReference.current?.setBoundaries(cells);
  };

  const handleSpeed = () => {
    const speeds: Array<0.25 | 0.5 | 1 | 2> = [0.25, 0.5, 1, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    controllerReference.current?.setSpeed(nextSpeed);
    setPlaybackSpeed(nextSpeed);
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
        {performanceMeasurement === undefined ? null : (
          <p className="performance-label">
            {Math.round(performanceMeasurement.simulationStepsPerSecond)} step/s
          </p>
        )}
      </header>

      <section className="experiment" aria-labelledby="experiment-title">
        <div className="field-container">
          <h2 id="experiment-title" className="field-title">
            {fieldTitleForMode(interactionMode)}
          </h2>
          <WaveCanvas
            frame={frame}
            displayMode={displayMode}
            observer={observer}
            boundaryCells={boundaryCells}
            interactionMode={interactionMode}
            onFieldTap={handleFieldTap}
            onFieldDrag={handleFieldDrag}
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
        <button
          type="button"
          className={interactionMode === "wall" ? "mode-control active-control" : "mode-control"}
          onClick={() => setInteractionMode("wall")}
        >
          壁を描く
        </button>
        <button
          type="button"
          className={interactionMode === "erase" ? "mode-control active-control" : "mode-control"}
          onClick={() => setInteractionMode("erase")}
        >
          壁を消す
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
        <button type="button" onClick={handleSpeed} disabled={controlsDisabled}>
          速度: {playbackSpeed}×
        </button>
        <button type="button" onClick={() => setDisplayMode((mode) => (mode === "color" ? "monochrome" : "color"))}>
          {displayMode === "color" ? "白黒表示" : "色表示"}
        </button>
      </section>
      {errorMessage === undefined ? null : <p className="error-message">{errorMessage}</p>}
    </main>
  );
}

function rasterizeLine(from: BoundaryCell, to: BoundaryCell): BoundaryCell[] {
  const cells: BoundaryCell[] = [];
  const columnDistance = Math.abs(to.column - from.column);
  const rowDistance = Math.abs(to.row - from.row);
  const columnDirection = from.column < to.column ? 1 : -1;
  const rowDirection = from.row < to.row ? 1 : -1;
  let error = columnDistance - rowDistance;
  let column = from.column;
  let row = from.row;

  while (true) {
    cells.push({ column, row });

    if (column === to.column && row === to.row) {
      return cells;
    }

    const doubledError = error * 2;

    if (doubledError > -rowDistance) {
      error -= rowDistance;
      column += columnDirection;
    }

    if (doubledError < columnDistance) {
      error += columnDistance;
      row += rowDirection;
    }
  }
}

function fieldTitleForMode(mode: InteractionMode): string {
  switch (mode) {
    case "pulse":
      return "タップして波を起こす";
    case "observer":
      return "タップして観測点を置く";
    case "wall":
      return "ドラッグして壁を描く";
    case "erase":
      return "ドラッグして壁を消す";
  }
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
