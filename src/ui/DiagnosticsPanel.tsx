import type { PerformanceMeasurement, SimulationFrame } from "../simulation/SimulationController";

export interface ViewportDiagnostic {
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  androidDetected: boolean;
}

interface DiagnosticsPanelProps {
  open: boolean;
  viewport: ViewportDiagnostic;
  frame: SimulationFrame | undefined;
  performanceMeasurement: PerformanceMeasurement | undefined;
  renderFramesPerSecond: number | undefined;
  onClose: () => void;
}

export function DiagnosticsPanel({
  open,
  viewport,
  frame,
  performanceMeasurement,
  renderFramesPerSecond,
  onClose,
}: DiagnosticsPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="diagnostics-panel" aria-label="端末と性能の診断">
      <header>
        <div>
          <strong>端末・性能チェック</strong>
          <span>画面回転後も実験状態を保持します</span>
        </div>
        <button type="button" onClick={onClose}>閉じる</button>
      </header>

      <dl className="diagnostics-grid">
        <div>
          <dt>端末判定</dt>
          <dd>{viewport.androidDetected ? "Android" : "Android以外"}</dd>
        </div>
        <div>
          <dt>画面</dt>
          <dd>{viewport.width} × {viewport.height} px</dd>
        </div>
        <div>
          <dt>向き</dt>
          <dd>{viewport.orientation === "portrait" ? "縦" : "横"}</dd>
        </div>
        <div>
          <dt>計算格子</dt>
          <dd>{frame === undefined ? "準備中" : `${frame.columns} × ${frame.rows}`}</dd>
        </div>
        <div>
          <dt>計算速度</dt>
          <dd>
            {performanceMeasurement === undefined
              ? "再生すると計測"
              : `${Math.round(performanceMeasurement.simulationStepsPerSecond)} step/s`}
          </dd>
        </div>
        <div>
          <dt>表示更新</dt>
          <dd>{renderFramesPerSecond === undefined ? "計測中" : `${renderFramesPerSecond} fps`}</dd>
        </div>
      </dl>
      <p className="diagnostics-note">
        実機確認では、波を出したまま縦横を切り替え、波源・壁・観測点が残ることを確認してください。
      </p>
    </aside>
  );
}
