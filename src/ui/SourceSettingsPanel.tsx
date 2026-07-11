import type { ContinuousSourceConfig } from "../simulation/types";
import { calculateWaveTiming } from "../physics/waveParameters";
import { SafeRangeInput } from "./SafeRangeInput";

interface SourceSettingsPanelProps {
  source: ContinuousSourceConfig;
  columns: number;
  rows: number;
  visibleInsetCells: number;
  waveSpeedCellsPerSecond: number;
  onChange: (source: ContinuousSourceConfig) => void;
  onDelete: (sourceId: string) => void;
  onClose: () => void;
}

export function SourceSettingsPanel({
  source,
  columns,
  rows,
  visibleInsetCells,
  waveSpeedCellsPerSecond,
  onChange,
  onDelete,
  onClose,
}: SourceSettingsPanelProps) {
  const phaseDegrees = Math.round((source.phaseRadians * 180) / Math.PI);
  const positionMarginCells = 6;
  const minimumPosition = visibleInsetCells + positionMarginCells;
  const waveTiming = calculateWaveTiming(
    source.wavelengthCells,
    waveSpeedCellsPerSecond,
  );

  return (
    <aside className="source-settings-panel" aria-label="連続波源の設定">
      <header>
        <div>
          <strong>連続波源の設定</strong>
          <span>{source.id}</span>
        </div>
        <button type="button" onClick={onClose}>閉じる</button>
      </header>

      <div className="source-settings-grid">
        <label>
          <span>横位置: {source.column}</span>
          <SafeRangeInput
            min={minimumPosition}
            max={Math.max(minimumPosition, columns - minimumPosition - 1)}
            value={source.column}
            onValueChange={(column) => onChange({ ...source, column })}
          />
        </label>
        <label>
          <span>縦位置: {source.row}</span>
          <SafeRangeInput
            min={minimumPosition}
            max={Math.max(minimumPosition, rows - minimumPosition - 1)}
            value={source.row}
            onValueChange={(row) => onChange({ ...source, row })}
          />
        </label>
        <label>
          <span>波の強さ: {source.amplitude.toFixed(1)}</span>
          <SafeRangeInput
            min={0.2}
            max={2}
            step={0.1}
            value={source.amplitude}
            onValueChange={(amplitude) => onChange({ ...source, amplitude })}
          />
        </label>
        <label>
          <span>波長: {source.wavelengthCells} セル</span>
          <SafeRangeInput
            min={8}
            max={48}
            step={2}
            value={source.wavelengthCells}
            onValueChange={(wavelengthCells) => onChange({ ...source, wavelengthCells })}
          />
        </label>
        <label>
          <span>位相: {phaseDegrees}°</span>
          <SafeRangeInput
            min={0}
            max={360}
            step={15}
            value={phaseDegrees}
            onValueChange={(phase) =>
              onChange({ ...source, phaseRadians: (phase * Math.PI) / 180 })
            }
          />
        </label>
        <label className="source-enabled-control">
          <input
            type="checkbox"
            checked={source.enabled}
            onChange={(event) => onChange({ ...source, enabled: event.target.checked })}
          />
          <span>この波源を使う</span>
        </label>
      </div>

      <section className="source-timing-readout" aria-label="波長から計算した波の時間情報">
        <p>
          <span>周期（ゆれ1回）</span>
          <strong>{waveTiming.periodSeconds.toFixed(1)} シミュレーション秒</strong>
        </p>
        <p>
          <span>1秒あたりのゆれ</span>
          <strong>{waveTiming.frequencyHertz.toFixed(3)} 回</strong>
        </p>
        <small>
          この実験の波の速さ: {waveSpeedCellsPerSecond.toFixed(1)} セル/シミュレーション秒。速さ = 周波数 × 波長
        </small>
      </section>

      <button type="button" className="danger-control" onClick={() => onDelete(source.id)}>
        この波源を削除
      </button>
    </aside>
  );
}
