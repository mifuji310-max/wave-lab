import { useEffect, useRef } from "react";
import type { SimulationFrame } from "../simulation/SimulationController";

interface WaveCanvasProps {
  frame: SimulationFrame | undefined;
  onPulse: (column: number, row: number) => void;
}

export function WaveCanvas({ frame, onPulse }: WaveCanvasProps) {
  const canvasReference = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasReference.current;

    if (canvas === null || frame === undefined) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });

    if (context === null) {
      return;
    }

    canvas.width = frame.columns;
    canvas.height = frame.rows;
    const image = context.createImageData(frame.columns, frame.rows);

    for (let index = 0; index < frame.field.length; index += 1) {
      const color = colorForDisplacement(frame.field[index]);
      const pixelIndex = index * 4;
      image.data[pixelIndex] = color.red;
      image.data[pixelIndex + 1] = color.green;
      image.data[pixelIndex + 2] = color.blue;
      image.data[pixelIndex + 3] = 255;
    }

    context.putImageData(image, 0, 0);
  }, [frame]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (frame === undefined) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const column = Math.max(
      1,
      Math.min(frame.columns - 2, Math.floor(((event.clientX - bounds.left) / bounds.width) * frame.columns)),
    );
    const row = Math.max(
      1,
      Math.min(frame.rows - 2, Math.floor(((event.clientY - bounds.top) / bounds.height) * frame.rows)),
    );

    onPulse(column, row);
  };

  return (
    <div className="wave-canvas-viewport">
      <canvas
        ref={canvasReference}
        className="wave-canvas"
        style={{ aspectRatio: frame === undefined ? "4 / 5" : `${frame.columns} / ${frame.rows}` }}
        onPointerDown={handlePointerDown}
        aria-label="波の実験フィールド。タップして波を起こします。"
      />
    </div>
  );
}

function colorForDisplacement(displacement: number): { red: number; green: number; blue: number } {
  const normalized = Math.max(-1, Math.min(1, displacement * 0.7));

  if (normalized >= 0) {
    return {
      red: 247,
      green: Math.round(247 - normalized * 117),
      blue: Math.round(247 - normalized * 174),
    };
  }

  const magnitude = Math.abs(normalized);
  return {
    red: Math.round(247 - magnitude * 176),
    green: Math.round(247 - magnitude * 107),
    blue: 255,
  };
}
