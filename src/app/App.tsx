import { useEffect, useRef, useState } from "react";
import { ObservationPanel } from "../observation/ObservationPanel";
import { createSingleSlitBoundaryCells } from "../physics/boundaries";
import type { BoundaryCell, SolverConfig } from "../physics/solver";
import { WaveCanvas } from "../renderer/WaveCanvas";
import { appVersion } from "../shared/version";
import { DiagnosticsPanel, type ViewportDiagnostic } from "../ui/DiagnosticsPanel";
import { SourceSettingsPanel } from "../ui/SourceSettingsPanel";
import {
  SimulationController,
  type ObservationSample,
  type PerformanceMeasurement,
  type SimulationFrame,
} from "../simulation/SimulationController";
import type { ContinuousSourceConfig } from "../simulation/types";
import { resolveSourceTap } from "./sourceInteraction";

type SimulationStatus = "loading" | "ready" | "running" | "paused" | "error";
type InteractionMode =
  | "pulse"
  | "observer"
  | "source"
  | "sourceSelect"
  | "wall"
  | "slit"
  | "erase";
type ToolCategory = "experiment" | "placement" | "playback" | "display";

const statusLabels: Record<SimulationStatus, string> = {
  loading: "計算を準備中",
  ready: "準備中",
  running: "再生中",
  paused: "一時停止中",
  error: "計算エラー",
};

export function App() {
  const [solverConfig] = useState<SolverConfig>(createPrototypeConfig);
  const controllerReference = useRef<SimulationController | null>(null);
  const boundaryCellsReference = useRef<Map<string, BoundaryCell>>(new Map());
  const sourceIdReference = useRef(1);
  const latestFrameReference = useRef<SimulationFrame | undefined>(undefined);
  const gridSizeReference = useRef<{ columns: number; rows: number } | undefined>(undefined);
  const pendingObservationSamplesReference = useRef<ObservationSample[]>([]);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>("loading");
  const [gridSize, setGridSize] = useState<{ columns: number; rows: number }>();
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
  const [continuousSources, setContinuousSources] = useState<ContinuousSourceConfig[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [slitWidthCells, setSlitWidthCells] = useState(24);
  const [toolCategory, setToolCategory] = useState<ToolCategory>("experiment");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [viewportDiagnostic, setViewportDiagnostic] = useState(readViewportDiagnostic);
  const [renderFramesPerSecond, setRenderFramesPerSecond] = useState<number>();
  const [fieldHintVisible, setFieldHintVisible] = useState(true);
  const [fieldHintRevision, setFieldHintRevision] = useState(0);

  useEffect(() => {
    const controller = new SimulationController(solverConfig, {
      onReady: () => setSimulationStatus("ready"),
      onFrame: (nextFrame) => {
        latestFrameReference.current = nextFrame;
        const currentGridSize = gridSizeReference.current;

        if (
          currentGridSize === undefined ||
          currentGridSize.columns !== nextFrame.columns ||
          currentGridSize.rows !== nextFrame.rows
        ) {
          const nextGridSize = { columns: nextFrame.columns, rows: nextFrame.rows };
          gridSizeReference.current = nextGridSize;
          setGridSize(nextGridSize);
        }
      },
      onObservationSample: (sample) => {
        pendingObservationSamplesReference.current.push(sample);
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
  }, [solverConfig]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      if (pendingObservationSamplesReference.current.length === 0) {
        return;
      }

      const pendingSamples = pendingObservationSamplesReference.current;
      pendingObservationSamplesReference.current = [];
      setObservationSamples((samples) => [...samples, ...pendingSamples].slice(-180));
    }, 50);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    setFieldHintVisible(true);
    const timerId = window.setTimeout(() => setFieldHintVisible(false), 4000);
    return () => window.clearTimeout(timerId);
  }, [fieldHintRevision, interactionMode]);

  useEffect(() => {
    const updateViewportDiagnostic = () => setViewportDiagnostic(readViewportDiagnostic());
    window.addEventListener("resize", updateViewportDiagnostic);
    window.addEventListener("orientationchange", updateViewportDiagnostic);

    return () => {
      window.removeEventListener("resize", updateViewportDiagnostic);
      window.removeEventListener("orientationchange", updateViewportDiagnostic);
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
    boundaryCellsReference.current = new Map();
    setBoundaryCells([]);
    setContinuousSources([]);
    setSelectedSourceId(undefined);
    setContinuousSourceEnabled(false);
    setObserver(undefined);
    pendingObservationSamplesReference.current = [];
    setObservationSamples([]);
    setObservationPanelOpen(false);
    setPerformanceMeasurement(undefined);
    setRenderFramesPerSecond(undefined);
    setInteractionMode("pulse");
    setSimulationStatus("ready");
  };

  const handleBoundaryReset = () => {
    boundaryCellsReference.current = new Map();
    setBoundaryCells([]);
    controllerReference.current?.setBoundaries([]);
  };

  const handleStep = () => {
    controllerReference.current?.step();
    setSimulationStatus("paused");
  };

  const handleContinuousSource = () => {
    if (continuousSources.length === 0) {
      setInteractionMode("source");
      return;
    }

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

    if (interactionMode === "source" || interactionMode === "sourceSelect") {
      selectOrCreateContinuousSource(column, row, interactionMode === "source");
      return;
    }

    if (interactionMode === "slit") {
      if (gridSize === undefined) {
        return;
      }

      updateBoundaries(
        createSingleSlitBoundaryCells(gridSize.columns, gridSize.rows, column, row, slitWidthCells),
        false,
        false,
      );
      return;
    }

    controllerReference.current?.injectPulse(column, row, 4);

    if (simulationStatus !== "running") {
      controllerReference.current?.start();
      setSimulationStatus("running");
    }
  };

  const handleBoundaryStroke = (cells: BoundaryCell[], erase: boolean) => {
    updateBoundaries(cells, erase);
  };

  const selectOrCreateContinuousSource = (
    column: number,
    row: number,
    allowCreation: boolean,
  ) => {
    const resolution = resolveSourceTap(
      continuousSources,
      column,
      row,
      allowCreation,
    );

    if (resolution.type === "select") {
      setSelectedSourceId(resolution.source.id);
      setObservationPanelOpen(false);
      return;
    }

    if (resolution.type === "ignore") {
      setFieldHintRevision((revision) => revision + 1);
      return;
    }

    const newSource: ContinuousSourceConfig = {
      id: `source-${sourceIdReference.current++}`,
      column,
      row,
      amplitude: 0.8,
      wavelengthCells: 24,
      phaseRadians: 0,
      enabled: true,
    };
    const nextSources = [...continuousSources, newSource];

    setContinuousSources(nextSources);
    setSelectedSourceId(newSource.id);
    setObservationPanelOpen(false);
    controllerReference.current?.setContinuousSources(nextSources);

    if (!continuousSourceEnabled) {
      setContinuousSourceEnabled(true);
      controllerReference.current?.setContinuousSource(true);
    }

    if (simulationStatus !== "running") {
      controllerReference.current?.start();
      setSimulationStatus("running");
    }
  };

  const updateContinuousSource = (updatedSource: ContinuousSourceConfig) => {
    const nextSources = continuousSources.map((source) =>
      source.id === updatedSource.id ? updatedSource : source,
    );
    setContinuousSources(nextSources);
    controllerReference.current?.setContinuousSources(nextSources);
  };

  const deleteContinuousSource = (sourceId: string) => {
    const nextSources = continuousSources.filter((source) => source.id !== sourceId);
    setContinuousSources(nextSources);
    setSelectedSourceId(undefined);
    controllerReference.current?.setContinuousSources(nextSources);

    if (nextSources.length === 0) {
      setContinuousSourceEnabled(false);
      controllerReference.current?.setContinuousSource(false);
    }
  };

  const createTwoSourceExperiment = () => {
    if (gridSize === undefined) {
      return;
    }

    const row = Math.round(gridSize.rows * 0.5);
    const wavelengthCells = 24;
    const nextSources: ContinuousSourceConfig[] = [
      {
        id: `source-${sourceIdReference.current++}`,
        column: Math.round(gridSize.columns * 0.4),
        row,
        amplitude: 0.8,
        wavelengthCells,
        phaseRadians: 0,
        enabled: true,
      },
      {
        id: `source-${sourceIdReference.current++}`,
        column: Math.round(gridSize.columns * 0.6),
        row,
        amplitude: 0.8,
        wavelengthCells,
        phaseRadians: 0,
        enabled: true,
      },
    ];

    setContinuousSources(nextSources);
    setSelectedSourceId(undefined);
    setContinuousSourceEnabled(true);
    controllerReference.current?.setContinuousSources(nextSources);
    controllerReference.current?.setContinuousSource(true);
    controllerReference.current?.start();
    setSimulationStatus("running");
    setInteractionMode("sourceSelect");
  };

  const cycleSlitWidth = () => {
    const widths = [12, 24, 36, 48];
    const currentIndex = widths.indexOf(slitWidthCells);
    setSlitWidthCells(widths[(currentIndex + 1) % widths.length]);
  };

  const updateBoundaries = (centers: BoundaryCell[], erase: boolean, expandStroke = true) => {
    const nextBoundaryCells = new Map(boundaryCellsReference.current);
    const offsets = expandStroke ? [-1, 0, 1] : [0];

    for (const center of centers) {
      for (const rowOffset of offsets) {
        for (const columnOffset of offsets) {
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
  const selectedSource = continuousSources.find((source) => source.id === selectedSourceId);

  return (
    <main
      className={[
        "app-shell",
        selectedSource === undefined ? "" : "source-settings-open",
        observer === undefined ? "" : "has-observer",
      ].filter(Boolean).join(" ")}
    >
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
          <h2
            id="experiment-title"
            className={`field-title ${fieldHintVisible ? "" : "hidden"}`}
          >
            {fieldTitleForMode(interactionMode)}
          </h2>
          <WaveCanvas
            frameReference={latestFrameReference}
            gridSize={gridSize}
            absorptionLayerCells={solverConfig.absorptionLayerCells}
            displayMode={displayMode}
            observer={observer}
            continuousSources={continuousSources}
            boundaryCells={boundaryCells}
            interactionMode={interactionMode}
            onFieldTap={handleFieldTap}
            onBoundaryStroke={handleBoundaryStroke}
            onRenderFramesPerSecond={setRenderFramesPerSecond}
          />
          <div
            className="color-legend"
            aria-label="青は低い変位、緑は基準の0、赤は高い変位"
          >
            <span>低い</span>
            <span className="legend-scale">
              <span className="legend-gradient" aria-hidden="true" />
              <small>基準 0</small>
            </span>
            <span>高い</span>
          </div>
        </div>
      </section>

      {observer === undefined ? null : (
        <ObservationPanel
          open={observationPanelOpen}
          observer={observer}
          samples={observationSamples}
          onToggle={() => setObservationPanelOpen((open) => !open)}
        />
      )}

      {selectedSource === undefined || gridSize === undefined ? null : (
        <SourceSettingsPanel
          source={selectedSource}
          columns={gridSize.columns}
          rows={gridSize.rows}
          visibleInsetCells={solverConfig.absorptionLayerCells}
          onChange={updateContinuousSource}
          onDelete={deleteContinuousSource}
          onClose={() => setSelectedSourceId(undefined)}
        />
      )}

      <section className="tool-dock" aria-label="シミュレーション操作">
        <div className="tool-options">
          {toolCategory === "experiment" ? (
            <>
              <button
                type="button"
                className={interactionMode === "pulse" ? "active-control" : ""}
                onClick={() => setInteractionMode("pulse")}
              >
                パルス実験
              </button>
              <button type="button" onClick={createTwoSourceExperiment} disabled={controlsDisabled}>
                二波源干渉
              </button>
              <button type="button" onClick={handleContinuousSource} disabled={controlsDisabled}>
                {continuousSources.length === 0
                  ? "連続波源を置く"
                  : continuousSourceEnabled
                    ? `連続波を止める（波源${continuousSources.length}）`
                    : `連続波を出す（波源${continuousSources.length}）`}
              </button>
              <button
                type="button"
                className="danger-outline-control"
                onClick={handleReset}
                disabled={controlsDisabled}
              >
                全リセット
              </button>
            </>
          ) : null}

          {toolCategory === "placement" ? (
            <>
              <button
                type="button"
                className={interactionMode === "source" ? "active-control" : ""}
                onClick={() => setInteractionMode("source")}
              >
                波源 ({continuousSources.length})
              </button>
              <button
                type="button"
                className={interactionMode === "observer" ? "active-control" : ""}
                onClick={() => setInteractionMode("observer")}
              >
                観測点
              </button>
              <button
                type="button"
                className={interactionMode === "wall" ? "active-control" : ""}
                onClick={() => setInteractionMode("wall")}
              >
                壁を描く
              </button>
              <button
                type="button"
                className={interactionMode === "slit" ? "active-control" : ""}
                onClick={() => setInteractionMode("slit")}
              >
                単スリット
              </button>
              <button type="button" onClick={cycleSlitWidth}>
                スリット幅: {slitWidthCells}
              </button>
              <button
                type="button"
                className={interactionMode === "erase" ? "active-control" : ""}
                onClick={() => setInteractionMode("erase")}
              >
                壁を消す
              </button>
              <button
                type="button"
                className="danger-outline-control"
                onClick={handleBoundaryReset}
                disabled={boundaryCells.length === 0}
              >
                壁を全消去
              </button>
            </>
          ) : null}

          {toolCategory === "playback" ? (
            <>
              <button type="button" className="primary-control" onClick={handlePlayPause} disabled={controlsDisabled}>
                {isRunning ? "一時停止" : "再生"}
              </button>
              <button type="button" onClick={handleStep} disabled={controlsDisabled || isRunning}>
                一歩進む
              </button>
              <button type="button" onClick={handleSpeed} disabled={controlsDisabled}>
                速度: {playbackSpeed}×
              </button>
              <button
                type="button"
                className="danger-outline-control"
                onClick={handleReset}
                disabled={controlsDisabled}
              >
                全リセット
              </button>
            </>
          ) : null}

          {toolCategory === "display" ? (
            <>
              <button type="button" onClick={() => setDisplayMode((mode) => (mode === "color" ? "monochrome" : "color"))}>
                {displayMode === "color" ? "白黒表示" : "色表示"}
              </button>
              <button
                type="button"
                onClick={() => setObservationPanelOpen((open) => !open)}
                disabled={observer === undefined}
              >
                観測グラフ
              </button>
              <button type="button" onClick={() => setDiagnosticsOpen(true)}>
                端末・性能
              </button>
            </>
          ) : null}
        </div>

        <nav className="tool-categories" aria-label="機能カテゴリ">
          {(["experiment", "placement", "playback", "display"] as ToolCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              className={toolCategory === category ? "active-category" : ""}
              onClick={() => setToolCategory(category)}
            >
              {toolCategoryLabel(category)}
            </button>
          ))}
        </nav>
      </section>
      <DiagnosticsPanel
        open={diagnosticsOpen}
        viewport={viewportDiagnostic}
        gridSize={gridSize}
        performanceMeasurement={performanceMeasurement}
        renderFramesPerSecond={renderFramesPerSecond}
        onClose={() => setDiagnosticsOpen(false)}
      />
      {errorMessage === undefined ? null : <p className="error-message">{errorMessage}</p>}
    </main>
  );
}

function fieldTitleForMode(mode: InteractionMode): string {
  switch (mode) {
    case "pulse":
      return "タップして波を起こす";
    case "observer":
      return "タップして観測点を置く";
    case "source":
      return "タップして波源を追加・選択";
    case "sourceSelect":
      return "波源をタップして設定。追加は「配置」→「波源」";
    case "wall":
      return "ドラッグして壁を描く";
    case "slit":
      return "タップして単スリットを置く";
    case "erase":
      return "ドラッグして壁を消す";
  }
}

function readViewportDiagnostic(): ViewportDiagnostic {
  return {
    width: Math.round(window.innerWidth),
    height: Math.round(window.innerHeight),
    orientation: window.innerWidth >= window.innerHeight ? "landscape" : "portrait",
    androidDetected: /Android/i.test(navigator.userAgent),
  };
}

function toolCategoryLabel(category: ToolCategory): string {
  switch (category) {
    case "experiment":
      return "実験";
    case "placement":
      return "配置";
    case "playback":
      return "再生";
    case "display":
      return "表示";
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
    dampingPerSecond: 0.005,
    absorptionLayerCells: Math.max(24, Math.round(minimumDimension * 0.18)),
    absorptionMaxDampingPerSecond: 1.5,
  };
}
