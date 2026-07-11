import { useEffect, useRef } from "react";
import type { BoundaryCell } from "../physics/solver";
import type { SimulationFrame } from "../simulation/SimulationController";
import type { ContinuousSourceConfig } from "../simulation/types";

type InteractionMode = "pulse" | "observer" | "source" | "wall" | "slit" | "erase";

interface WaveCanvasProps {
  frame: SimulationFrame | undefined;
  displayMode: "color" | "monochrome";
  observer: { column: number; row: number } | undefined;
  continuousSources: ContinuousSourceConfig[];
  boundaryCells: BoundaryCell[];
  interactionMode: InteractionMode;
  onFieldTap: (column: number, row: number) => void;
  onBoundaryStroke: (cells: BoundaryCell[], erase: boolean) => void;
}

export function WaveCanvas({
  frame,
  displayMode,
  observer,
  continuousSources,
  boundaryCells,
  interactionMode,
  onFieldTap,
  onBoundaryStroke,
}: WaveCanvasProps) {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const previousPointerCell = useRef<BoundaryCell | null>(null);
  const strokeCells = useRef<BoundaryCell[]>([]);

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

    for (const source of continuousSources) {
      context.beginPath();
      context.arc(source.column + 0.5, source.row + 0.5, 4, 0, Math.PI * 2);
      context.fillStyle = "#22d3ee";
      context.fill();
      context.lineWidth = 1.5;
      context.strokeStyle = "#083344";
      context.stroke();
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
  }, [boundaryCells, continuousSources, displayMode, frame, observer]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const cell = cellFromPointer(event, frame);

    if (cell === undefined) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (interactionMode === "wall" || interactionMode === "erase") {
      previousPointerCell.current = cell;
      strokeCells.current = [cell];
      drawStrokePreview(event.currentTarget, [cell], interactionMode === "erase");
      return;
    }

    onFieldTap(cell.column, cell.row);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (previousPointerCell.current === null) {
      return;
    }

    event.preventDefault();
    const cell = cellFromPointer(event, frame);

    if (cell === undefined || sameCell(cell, previousPointerCell.current)) {
      return;
    }

    const segment = rasterizeLine(previousPointerCell.current, cell);
    strokeCells.current.push(...segment.slice(1));
    previousPointerCell.current = cell;
    drawStrokePreview(event.currentTarget, segment, interactionMode === "erase");
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (previousPointerCell.current !== null) {
      const uniqueCells = new Map(strokeCells.current.map((cell) => [`${cell.column}:${cell.row}`, cell]));
      onBoundaryStroke([...uniqueCells.values()], interactionMode === "erase");
    }

    previousPointerCell.current = null;
    strokeCells.current = [];

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
        aria-label={fieldLabel(interactionMode)}
      />
    </div>
  );
}

function drawStrokePreview(canvas: HTMLCanvasElement, cells: BoundaryCell[], erase: boolean): void {
  const context = canvas.getContext("2d", { alpha: false });

  if (context === null) {
    return;
  }

  context.fillStyle = erase ? "#ef4444" : "#1e293b";

  for (const cell of cells) {
    context.fillRect(cell.column - 1, cell.row - 1, 3, 3);
  }
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

function sameCell(left: BoundaryCell, right: BoundaryCell): boolean {
  return left.column === right.column && left.row === right.row;
}

function fieldLabel(mode: InteractionMode): string {
  switch (mode) {
    case "pulse":
      return "波の実験フィールド。タップして波を起こします。";
    case "observer":
      return "波の実験フィールド。タップして観測点を置きます。";
    case "source":
      return "波の実験フィールド。タップして連続波源を追加または削除します。";
    case "wall":
      return "波の実験フィールド。ドラッグして壁を描きます。";
    case "slit":
      return "波の実験フィールド。タップして単スリットを置きます。";
    case "erase":
      return "波の実験フィールド。ドラッグして壁を消します。";
  }
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
