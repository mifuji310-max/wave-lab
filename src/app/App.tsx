import { useState } from "react";

type SimulationStatus = "ready" | "running" | "paused";

const statusLabels: Record<SimulationStatus, string> = {
  ready: "準備中",
  running: "再生中",
  paused: "一時停止中",
};

export function App() {
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>("ready");

  const handlePlayPause = () => {
    setSimulationStatus((currentStatus) =>
      currentStatus === "running" ? "paused" : "running",
    );
  };

  const handleReset = () => {
    setSimulationStatus("ready");
  };

  const isRunning = simulationStatus === "running";

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
        <div className="field-placeholder" role="img" aria-label="波を表示する領域。次の開発段階で波動場を表示します。">
          <p id="experiment-title">波を起こしてみよう</p>
          <p>ここに数値計算による波が表示されます</p>
        </div>
      </section>

      <section className="control-panel" aria-label="シミュレーション操作">
        <button type="button" className="primary-control" onClick={handlePlayPause}>
          {isRunning ? "一時停止" : "再生"}
        </button>
        <button type="button" onClick={handleReset}>
          リセット
        </button>
      </section>
    </main>
  );
}
