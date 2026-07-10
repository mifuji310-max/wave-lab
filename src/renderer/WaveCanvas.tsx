import { useEffect, useRef } from "react";
import type { BoundaryCell } from "../physics/solver";
import type { SimulationFrame } from "../simulation/SimulationController";

interface WaveCanvasProps {
  frame: SimulationFrame | undefined;
  displayMode: "color" | "monochrome";
  observer: { column: number; row: number } | undefined;
  boundaryCells: BoundaryCell[];
  interactionMode: "pulse" | "observer" | "wall" | "erase";
  onFieldTap: (column: number, row: number) => void;
  onFieldDrag: (from: BoundaryCell, to: BoundaryCell) => void;
}

export function WaveCanvas({
  frame,
  displayMode,
  observer,
  boundaryCells,
  interactionMode,
  onFieldTap,
  onFieldDrag,
}: WaveCanvasProps) {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const previousPointerCell = useRef<BoundaryCell | null>(null);

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
      const color =
        displayMode === "color"
          ? colorForDisplacement(frame.field[index])
          : monochromeForDisplacement(frame.field[index]);
      const pixelIndex = index * 4;
      image.data[pixelIndex] = color.red;
      image.data[pixelIndex + 1] = color.green;
      image.data[pixelIndex + 2] = color.blue;
      image.data[pixelIndex + 3] = 255;
    }

    context.putImageData(image, 0, 0);

    context.fillStyle = "#1e293b";
    for (const cell of boundaryCells) {
      context.fillRect(cell.column, cell.row, 1, 1);
    }

    if (observer !== undefined) {
      context.beginPath();
      context.arc(observer.column + 0.5, observer.row + 0.5, 4, 0, Math.PI * 2);
      context.fillStyle = "#facc15";
      context.fill();
      context.lineWidth = 1.5;
      context.strokeStyle = "#0f172a";
      context.stroke();
    }
  }, [boundaryCells, displayMode, frame, observer]);

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

    const cell = { column, row };
    previousPointerCell.current = cell;
    event.currentTarget.setPointerCapture(event.pointerId);
    onFieldTap(column, row);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (previousPointerCell.current === null) {
      return;
    }

    const cell = cellFromPointer(event, frame);

    if (cell === undefined || (cell.column === previousPointerCell.current.column && cell.row === previousPointerCell.current.row)) {
      return;
    }

    onFieldDrag(previousPointerCell.current, cell);
    previousPointerCell.current = cell;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    previousPointerCell.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="wave-canvas-viewport">
      <canvas
        ref={canvasReference}
        className="wave-canvas"
        style={{ aspectRatio: frame === undefined ? "4 / 5" : `${frame.columns} / ${frame.rows}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label={
          interactionMode === "pulse"
            ? "波の実験フィールド。タップして波を起こします。"
            : interactionMode === "observer"
              ? "波の実験フィールド。タップして観測点を置きます。"
              : interactionMode === "wall"
                ? "波の実験フィールド。ドラッグして壁を描きます。"
                : "波の実験フィールド。ドラッグして壁を消します。"
        }
      />
    </div>
  );
}

function cellFromPointer(
  event: React.PointerEvent<HTMLCanvasElement>,
  frame: SimulationFrame | undefined,
): BoundaryCell | undefined {
  if (frame === undefined) {
    return undefined;
  }

  const bounds = event.currentTarget.getBoundingClientRect();

  return {
    column: Math.max(
      1,
      Math.min(frame.columns - 2, Math.floor(((event.clientX - bounds.left) / bounds.width) * frame.columns)),
    ),
    row: Math.max(
      1,
      Math.min(frame.rows - 2, Math.floor(((event.clientY - bounds.top) / bounds.height) * frame.rows)),
    ),
  };
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

function monochromeForDisplacement(displacement: number): { red: number; green: number; blue: number } {
  const normalized = Math.max(-1, Math.min(1, displacement * 0.7));
  const lightness = Math.round(180 + normalized * 68);

  return { red: lightness, green: lightness, blue: lightness };
}
