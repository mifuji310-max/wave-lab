import type { ContinuousSourceConfig } from "../simulation/types";

export type SourceTapResolution =
  | { type: "select"; source: ContinuousSourceConfig }
  | { type: "create" }
  | { type: "ignore" };

export function resolveSourceTap(
  sources: ContinuousSourceConfig[],
  column: number,
  row: number,
  allowCreation: boolean,
): SourceTapResolution {
  const selectionRadiusCells = 8;
  const existingSource = sources.find(
    (source) => Math.hypot(source.column - column, source.row - row) <= selectionRadiusCells,
  );

  if (existingSource !== undefined) {
    return { type: "select", source: existingSource };
  }

  return allowCreation ? { type: "create" } : { type: "ignore" };
}
