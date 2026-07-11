export interface GridSize {
  columns: number;
  rows: number;
}

export interface VisibleDomain {
  left: number;
  top: number;
  columns: number;
  rows: number;
}

export function createVisibleDomain(
  gridSize: GridSize,
  absorptionLayerCells: number,
): VisibleDomain {
  const maximumInset = Math.floor((Math.min(gridSize.columns, gridSize.rows) - 3) / 2);
  const inset = Math.max(0, Math.min(maximumInset, Math.round(absorptionLayerCells)));

  return {
    left: inset,
    top: inset,
    columns: gridSize.columns - inset * 2,
    rows: gridSize.rows - inset * 2,
  };
}

export function cellInVisibleDomain(
  domain: VisibleDomain,
  normalizedX: number,
  normalizedY: number,
): { column: number; row: number } {
  const x = Math.max(0, Math.min(0.999999, normalizedX));
  const y = Math.max(0, Math.min(0.999999, normalizedY));

  return {
    column: domain.left + Math.floor(x * domain.columns),
    row: domain.top + Math.floor(y * domain.rows),
  };
}
