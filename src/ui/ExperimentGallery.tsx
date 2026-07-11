import type { ExperimentPreset, ExperimentPresetId } from "../experiments/presets";

interface ExperimentGalleryProps {
  open: boolean;
  presets: readonly ExperimentPreset[];
  onSelect: (presetId: ExperimentPresetId) => void;
  onClose: () => void;
}

export function ExperimentGallery({
  open,
  presets,
  onSelect,
  onClose,
}: ExperimentGalleryProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="experiment-gallery" aria-label="実験を選ぶ">
      <header>
        <div>
          <strong>実験を選ぶ</strong>
          <span>やってみたい現象を1つ選ぼう</span>
        </div>
        <button type="button" onClick={onClose}>閉じる</button>
      </header>
      <div className="experiment-preset-list">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="experiment-preset-card"
            onClick={() => onSelect(preset.id)}
          >
            <strong>{preset.title}</strong>
            <span>{preset.goal}</span>
            <small>{preset.prompt}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
