import { useEffect, useRef } from "react";
import type { BoundaryCell } from "../physics/solver";
import type { SimulationFrame } from "../simulation/SimulationController";
import type { ContinuousSourceConfig } from "../simulation/types";
import { colorForDisplacement, monochromeForDisplacement } from "./colorScale";

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

  }, [boundaryCells, displayMode, frame]);

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
      <div
        className="wave-field-layer"
        style={{ aspectRatio: frame === undefined ? "4 / 5" : `${frame.columns} / ${frame.rows}` }}
      >
        <canvas
          ref={canvasReference}
          className="wave-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={fieldLabel(interactionMode)}
        />
        {frame === undefined ? null : (
          <svg
            className="field-marker-overlay"
            viewBox={`0 0 ${frame.columns} ${frame.rows}`}
            aria-hidden="true"
          >
            {continuousSources.map((source) => (
              <g
                key={source.id}
                className={`source-marker ${source.enabled ? "" : "disabled"}`}
                transform={`translate(${source.column + 0.5} ${source.row + 0.5})`}
              >
                <circle className="source-marker-halo" r="5.25" />
                <circle className="source-marker-body" r="3.75" />
                <circle className="source-marker-core" r="1.35" />
                <path className="source-marker-cross" d="M -6 0 H -4.5 M 4.5 0 H 6 M 0 -6 V -4.5 M 0 4.5 V 6" />
              </g>
            ))}
            {observer === undefined ? null : (
              <g transform={`translate(${observer.column + 0.5} ${observer.row + 0.5})`}>
                <circle className="observer-marker" r="4" />
                <path className="observer-marker-cross" d="M -5.5 0 H 5.5 M 0 -5.5 V 5.5" />
              </g>
            )}
          </svg>
        )}
      </div>
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
