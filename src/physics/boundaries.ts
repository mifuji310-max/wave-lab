import type { BoundaryCell } from "./solver";

export function createSingleSlitBoundaryCells(
  columns: number,
  rows: number,
  column: number,
  openingCenterRow: number,
  openingWidthCells = 24,
): BoundaryCell[] {
  const cells: BoundaryCell[] = [];
  const barrierThicknessCells = 2;
  const normalizedOpeningWidth = Math.max(1, Math.round(openingWidthCells));
  const openingStartRow = openingCenterRow - Math.floor(normalizedOpeningWidth / 2);
  const openingEndRow = openingStartRow + normalizedOpeningWidth;

  for (let row = 1; row < rows - 1; row += 1) {
    if (row >= openingStartRow && row < openingEndRow) {
      continue;
    }

    for (let columnOffset = 0; columnOffset < barrierThicknessCells; columnOffset += 1) {
      const barrierColumn = column + columnOffset;

      if (barrierColumn > 0 && barrierColumn < columns - 1) {
        cells.push({ column: barrierColumn, row });
      }
    }
  }

  return cells;
}
