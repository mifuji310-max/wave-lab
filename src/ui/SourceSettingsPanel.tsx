import type { ContinuousSourceConfig } from "../simulation/types";

interface SourceSettingsPanelProps {
  source: ContinuousSourceConfig;
  columns: number;
  rows: number;
  visibleInsetCells: number;
  onChange: (source: ContinuousSourceConfig) => void;
  onDelete: (sourceId: string) => void;
  onClose: () => void;
}

export function SourceSettingsPanel({
  source,
  columns,
  rows,
  visibleInsetCells,
  onChange,
  onDelete,
  onClose,
}: SourceSettingsPanelProps) {
  const phaseDegrees = Math.round((source.phaseRadians * 180) / Math.PI);
  const positionMarginCells = 6;
  const minimumPosition = visibleInsetCells + positionMarginCells;

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
          <input
            type="range"
            min={minimumPosition}
            max={Math.max(minimumPosition, columns - minimumPosition - 1)}
            value={source.column}
            onChange={(event) => onChange({ ...source, column: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>縦位置: {source.row}</span>
          <input
            type="range"
            min={minimumPosition}
            max={Math.max(minimumPosition, rows - minimumPosition - 1)}
            value={source.row}
            onChange={(event) => onChange({ ...source, row: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>波の強さ: {source.amplitude.toFixed(1)}</span>
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={source.amplitude}
            onChange={(event) => onChange({ ...source, amplitude: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>波長: {source.wavelengthCells} セル</span>
          <input
            type="range"
            min="8"
            max="48"
            step="2"
            value={source.wavelengthCells}
            onChange={(event) => onChange({ ...source, wavelengthCells: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>位相: {phaseDegrees}°</span>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={phaseDegrees}
            onChange={(event) =>
              onChange({ ...source, phaseRadians: (Number(event.target.value) * Math.PI) / 180 })
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

      <button type="button" className="danger-control" onClick={() => onDelete(source.id)}>
        この波源を削除
      </button>
    </aside>
  );
}
