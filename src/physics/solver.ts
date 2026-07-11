export interface SolverConfig {
  columns: number;
  rows: number;
  waveSpeedCellsPerSecond: number;
  cellSize: number;
  timeStepSeconds: number;
  dampingPerSecond: number;
  absorptionLayerCells: number;
  absorptionMaxDampingPerSecond: number;
}

export interface SolverState {
  previous: Float32Array;
  current: Float32Array;
  next: Float32Array;
  simulationTimeSeconds: number;
  fixedBoundaryMask: Uint8Array;
}

export interface BoundaryCell {
  column: number;
  row: number;
}

const twoDimensionalStabilityLimit = 1 / Math.sqrt(2);
const stabilitySafetyMargin = 0.95;

export function calculateCourantNumber(config: SolverConfig): number {
  return (config.waveSpeedCellsPerSecond * config.timeStepSeconds) / config.cellSize;
}

export function validateSolverConfig(config: SolverConfig): void {
  if (!Number.isInteger(config.columns) || config.columns < 3) {
    throw new Error("The solver needs at least three columns.");
  }

  if (!Number.isInteger(config.rows) || config.rows < 3) {
    throw new Error("The solver needs at least three rows.");
  }

  if (config.waveSpeedCellsPerSecond <= 0 || config.cellSize <= 0 || config.timeStepSeconds <= 0) {
    throw new Error("Wave speed, cell size, and time step must be positive.");
  }

  if (config.dampingPerSecond < 0) {
    throw new Error("Damping cannot be negative.");
  }

  if (!Number.isInteger(config.absorptionLayerCells) || config.absorptionLayerCells < 1) {
    throw new Error("The absorption layer must be at least one cell wide.");
  }

  if (config.absorptionLayerCells * 2 >= Math.min(config.columns, config.rows)) {
    throw new Error("The absorption layer must leave an interior simulation region.");
  }

  if (config.absorptionMaxDampingPerSecond < 0) {
    throw new Error("Absorption damping cannot be negative.");
  }

  const courantNumber = calculateCourantNumber(config);
  const maximumCourantNumber = twoDimensionalStabilityLimit * stabilitySafetyMargin;

  if (courantNumber > maximumCourantNumber) {
    throw new Error(
      `Unstable solver configuration: Courant number ${courantNumber.toFixed(4)} exceeds ${maximumCourantNumber.toFixed(4)}.`,
    );
  }
}

export function createSolverState(config: SolverConfig): SolverState {
  validateSolverConfig(config);

  const cellCount = config.columns * config.rows;

  return {
    previous: new Float32Array(cellCount),
    current: new Float32Array(cellCount),
    next: new Float32Array(cellCount),
    simulationTimeSeconds: 0,
    fixedBoundaryMask: new Uint8Array(cellCount),
  };
}

export function setFixedBoundaryCells(
  state: SolverState,
  config: SolverConfig,
  cells: BoundaryCell[],
): void {
  state.fixedBoundaryMask.fill(0);

  for (const cell of cells) {
    if (cell.column <= 0 || cell.column >= config.columns - 1 || cell.row <= 0 || cell.row >= config.rows - 1) {
      continue;
    }

    const index = toIndex(config, cell.column, cell.row);
    state.fixedBoundaryMask[index] = 1;
    state.previous[index] = 0;
    state.current[index] = 0;
    state.next[index] = 0;
  }
}

export function resetSolverState(state: SolverState): void {
  state.previous.fill(0);
  state.current.fill(0);
  state.next.fill(0);
  state.simulationTimeSeconds = 0;
}

export function stepSolver(
  state: SolverState,
  config: SolverConfig,
  sourceTerm?: Float32Array,
): void {
  const courantNumber = calculateCourantNumber(config);
  const courantSquared = courantNumber ** 2;
  state.next.fill(0);

  for (let row = 1; row < config.rows - 1; row += 1) {
    for (let column = 1; column < config.columns - 1; column += 1) {
      const index = toIndex(config, column, row);

      if (state.fixedBoundaryMask[index] === 1) {
        state.next[index] = 0;
        continue;
      }
      const laplacian =
        state.current[toIndex(config, column - 1, row)] +
        state.current[toIndex(config, column + 1, row)] +
        state.current[toIndex(config, column, row - 1)] +
        state.current[toIndex(config, column, row + 1)] -
        4 * state.current[index];

      const dampingStep =
        calculateDampingPerSecond(config, column, row) * config.timeStepSeconds;

      // This is the documented damped FDTD update. The outer sponge raises
      // damping smoothly, so the fixed zero edge receives little energy.
      state.next[index] =
        (2 - dampingStep) * state.current[index] -
        (1 - dampingStep) * state.previous[index] +
        courantSquared * laplacian +
        config.timeStepSeconds ** 2 * (sourceTerm?.[index] ?? 0);
    }
  }

  applyMurAbsorbingBoundary(state, config, courantNumber);

  const previous = state.previous;
  state.previous = state.current;
  state.current = state.next;
  state.next = previous;
  state.simulationTimeSeconds += config.timeStepSeconds;
}

function applyMurAbsorbingBoundary(
  state: SolverState,
  config: SolverConfig,
  courantNumber: number,
): void {
  const coefficient = (courantNumber - 1) / (courantNumber + 1);
  const lastColumn = config.columns - 1;
  const lastRow = config.rows - 1;

  for (let row = 1; row < lastRow; row += 1) {
    const leftEdge = toIndex(config, 0, row);
    const leftNeighbor = toIndex(config, 1, row);
    state.next[leftEdge] =
      state.current[leftNeighbor] +
      coefficient * (state.next[leftNeighbor] - state.current[leftEdge]);

    const rightEdge = toIndex(config, lastColumn, row);
    const rightNeighbor = toIndex(config, lastColumn - 1, row);
    state.next[rightEdge] =
      state.current[rightNeighbor] +
      coefficient * (state.next[rightNeighbor] - state.current[rightEdge]);
  }

  for (let column = 1; column < lastColumn; column += 1) {
    const topEdge = toIndex(config, column, 0);
    const topNeighbor = toIndex(config, column, 1);
    state.next[topEdge] =
      state.current[topNeighbor] +
      coefficient * (state.next[topNeighbor] - state.current[topEdge]);

    const bottomEdge = toIndex(config, column, lastRow);
    const bottomNeighbor = toIndex(config, column, lastRow - 1);
    state.next[bottomEdge] =
      state.current[bottomNeighbor] +
      coefficient * (state.next[bottomNeighbor] - state.current[bottomEdge]);
  }

  state.next[toIndex(config, 0, 0)] =
    (state.next[toIndex(config, 1, 0)] + state.next[toIndex(config, 0, 1)]) / 2;
  state.next[toIndex(config, lastColumn, 0)] =
    (state.next[toIndex(config, lastColumn - 1, 0)] +
      state.next[toIndex(config, lastColumn, 1)]) /
    2;
  state.next[toIndex(config, 0, lastRow)] =
    (state.next[toIndex(config, 1, lastRow)] +
      state.next[toIndex(config, 0, lastRow - 1)]) /
    2;
  state.next[toIndex(config, lastColumn, lastRow)] =
    (state.next[toIndex(config, lastColumn - 1, lastRow)] +
      state.next[toIndex(config, lastColumn, lastRow - 1)]) /
    2;
}

export function calculateDampingPerSecond(
  config: SolverConfig,
  column: number,
  row: number,
): number {
  const distanceToEdge = Math.min(
    column,
    row,
    config.columns - 1 - column,
    config.rows - 1 - row,
  );
  const depthIntoAbsorptionLayer = Math.max(0, config.absorptionLayerCells - distanceToEdge);
  const normalizedDepth = depthIntoAbsorptionLayer / config.absorptionLayerCells;

  return config.dampingPerSecond + config.absorptionMaxDampingPerSecond * normalizedDepth ** 2;
}

function toIndex(config: SolverConfig, column: number, row: number): number {
  return row * config.columns + column;
}
