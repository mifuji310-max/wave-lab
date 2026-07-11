import { useEffect, useRef, type RefObject } from "react";
import type { BoundaryCell } from "../physics/solver";
import type { SimulationFrame } from "../simulation/SimulationController";
import type { ContinuousSourceConfig } from "../simulation/types";
import { writeDisplacementColors } from "./colorScale";
import { cellInVisibleDomain, createVisibleDomain } from "./visibleDomain";

type InteractionMode =
  | "pulse"
  | "observer"
  | "source"
  | "sourceSelect"
  | "wall"
  | "slit"
  | "erase";

interface WaveCanvasProps {
  frameReference: RefObject<SimulationFrame | undefined>;
  gridSize: { columns: number; rows: number } | undefined;
  absorptionLayerCells: number;
  displayMode: "color" | "monochrome";
  observer: { column: number; row: number } | undefined;
  continuousSources: ContinuousSourceConfig[];
  boundaryCells: BoundaryCell[];
  interactionMode: InteractionMode;
  onFieldTap: (column: number, row: number) => void;
  onBoundaryStroke: (cells: BoundaryCell[], erase: boolean) => void;
  onRenderFramesPerSecond: (framesPerSecond: number) => void;
}

export function WaveCanvas({
  frameReference,
  gridSize,
  absorptionLayerCells,
  displayMode,
  observer,
  continuousSources,
  boundaryCells,
  interactionMode,
  onFieldTap,
  onBoundaryStroke,
  onRenderFramesPerSecond,
}: WaveCanvasProps) {
  const canvasReference = useRef<HTMLCanvasElement>(null);
  const previousPointerCell = useRef<BoundaryCell | null>(null);
  const strokeCells = useRef<BoundaryCell[]>([]);
  const visibleDomain =
    gridSize === undefined ? undefined : createVisibleDomain(gridSize, absorptionLayerCells);

  useEffect(() => {
    const canvas = canvasReference.current;

    if (canvas === null) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });

    if (context === null) {
      return;
    }

    let animationFrameId = 0;
    let lastRenderedFrame: SimulationFrame | undefined;
    let image: ImageData | undefined;
    let measurementStartedAt = performance.now();
    let renderedFrameCount = 0;

    const drawLatestFrame = () => {
      const frame = frameReference.current;

      if (frame !== undefined && frame !== lastRenderedFrame) {
        const domain = createVisibleDomain(frame, absorptionLayerCells);

        if (canvas.width !== domain.columns || canvas.height !== domain.rows) {
          canvas.width = domain.columns;
          canvas.height = domain.rows;
          image = context.createImageData(frame.columns, frame.rows);
        } else if (image === undefined) {
          image = context.createImageData(frame.columns, frame.rows);
        }

        writeDisplacementColors(image.data, frame.field, displayMode);
        context.putImageData(image, -domain.left, -domain.top);
        context.fillStyle = "#1e293b";

        for (const cell of boundaryCells) {
          context.fillRect(cell.column - domain.left, cell.row - domain.top, 1, 1);
        }

        lastRenderedFrame = frame;
        renderedFrameCount += 1;
        const now = performance.now();

        if (now - measurementStartedAt >= 1000) {
          onRenderFramesPerSecond(
            Math.round((renderedFrameCount * 1000) / (now - measurementStartedAt)),
          );
          measurementStartedAt = now;
          renderedFrameCount = 0;
        }
      }

      animationFrameId = requestAnimationFrame(drawLatestFrame);
    };

    animationFrameId = requestAnimationFrame(drawLatestFrame);

    return () => cancelAnimationFrame(animationFrameId);
  }, [absorptionLayerCells, boundaryCells, displayMode, frameReference, onRenderFramesPerSecond]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const cell = cellFromPointer(event, visibleDomain);

    if (cell === undefined) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (interactionMode === "wall" || interactionMode === "erase") {
      previousPointerCell.current = cell;
      strokeCells.current = [cell];
      drawStrokePreview(
        event.currentTarget,
        [cell],
        interactionMode === "erase",
        visibleDomain,
      );
      return;
    }

    onFieldTap(cell.column, cell.row);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (previousPointerCell.current === null) {
      return;
    }

    event.preventDefault();
    const cell = cellFromPointer(event, visibleDomain);

    if (cell === undefined || sameCell(cell, previousPointerCell.current)) {
      return;
    }

    const segment = rasterizeLine(previousPointerCell.current, cell);
    strokeCells.current.push(...segment.slice(1));
    previousPointerCell.current = cell;
    drawStrokePreview(event.currentTarget, segment, interactionMode === "erase", visibleDomain);
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
        style={{
          aspectRatio:
            visibleDomain === undefined ? "4 / 5" : `${visibleDomain.columns} / ${visibleDomain.rows}`,
        }}
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
        {visibleDomain === undefined ? null : (
          <svg
            className="field-marker-overlay"
            viewBox={`${visibleDomain.left} ${visibleDomain.top} ${visibleDomain.columns} ${visibleDomain.rows}`}
            aria-hidden="true"
          >
            {continuousSources.map((source) => (
              <g
                key={source.id}
                className={`source-marker ${source.enabled ? "" : "disabled"}`}
                transform={`translate(${source.column + 0.5} ${source.row + 0.5})`}
              >
                <circle className="source-marker-dot" r="3.25" />
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

function drawStrokePreview(
  canvas: HTMLCanvasElement,
  cells: BoundaryCell[],
  erase: boolean,
  visibleDomain: ReturnType<typeof createVisibleDomain> | undefined,
): void {
  const context = canvas.getContext("2d", { alpha: false });

  if (context === null || visibleDomain === undefined) {
    return;
  }

  context.fillStyle = erase ? "#ef4444" : "#1e293b";

  for (const cell of cells) {
    context.fillRect(
      cell.column - visibleDomain.left - 1,
      cell.row - visibleDomain.top - 1,
      3,
      3,
    );
  }
}

function cellFromPointer(
  event: React.PointerEvent<HTMLCanvasElement>,
  visibleDomain: ReturnType<typeof createVisibleDomain> | undefined,
): BoundaryCell | undefined {
  if (visibleDomain === undefined) {
    return undefined;
  }

  const bounds = event.currentTarget.getBoundingClientRect();

  return cellInVisibleDomain(
    visibleDomain,
    (event.clientX - bounds.left) / bounds.width,
    (event.clientY - bounds.top) / bounds.height,
  );
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
      return "波の実験フィールド。タップして連続波源を追加または選択します。";
    case "sourceSelect":
      return "波の実験フィールド。既存の連続波源をタップすると設定を開きます。";
    case "wall":
      return "波の実験フィールド。ドラッグして壁を描きます。";
    case "slit":
      return "波の実験フィールド。タップして単スリットを置きます。";
    case "erase":
      return "波の実験フィールド。ドラッグして壁を消します。";
  }
}
