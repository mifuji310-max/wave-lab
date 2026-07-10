import type { ObservationSample } from "../simulation/SimulationController";

interface ObservationPanelProps {
  open: boolean;
  observer: { column: number; row: number } | undefined;
  samples: ObservationSample[];
  onToggle: () => void;
}

export function ObservationPanel({ open, observer, samples, onToggle }: ObservationPanelProps) {
  const latestSample = samples.at(-1);
  const waveformPoints = createWaveformPoints(samples);

  return (
    <aside className={open ? "observation-panel open" : "observation-panel"} aria-label="観測結果">
      <button type="button" className="observation-handle" onClick={onToggle} disabled={observer === undefined}>
        <span>観測結果</span>
        <span>{open ? "閉じる" : "開く"}</span>
      </button>
      {observer === undefined ? (
        <p className="observation-empty">「観測点」を選び、フィールドをタップしてください</p>
      ) : (
        <div className="observation-content">
          <div className="observation-values">
            <p>
              <span>現在の波の高さ</span>
              <strong>{latestSample?.displacement.toFixed(3) ?? "0.000"}</strong>
            </p>
            <p>
              <span>シミュレーション時間</span>
              <strong>{latestSample?.simulationTimeSeconds.toFixed(1) ?? "0.0"}</strong>
            </p>
          </div>
          <svg className="waveform-graph" viewBox="0 0 320 96" role="img" aria-label="観測点で測った波の高さの時間変化">
            <line x1="0" y1="48" x2="320" y2="48" className="waveform-zero" />
            <polyline points={waveformPoints} className="waveform-line" />
          </svg>
          <p className="measurement-note">実線は観測点で測った値です</p>
        </div>
      )}
    </aside>
  );
}

function createWaveformPoints(samples: ObservationSample[]): string {
  if (samples.length === 0) {
    return "";
  }

  const maximumMagnitude = Math.max(0.1, ...samples.map((sample) => Math.abs(sample.displacement)));

  return samples
    .map((sample, index) => {
      const x = samples.length === 1 ? 0 : (index / (samples.length - 1)) * 320;
      const y = 48 - (sample.displacement / maximumMagnitude) * 42;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
