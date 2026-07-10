export interface SolverConfig {
  columns: number;
  rows: number;
  waveSpeedCellsPerSecond: number;
  cellSize: number;
  timeStepSeconds: number;
  dampingPerSecond: number;
}

export interface SolverState {
  previous: Float32Array;
  current: Float32Array;
  next: Float32Array;
  simulationTimeSeconds: number;
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
  };
}

export function resetSolverState(state: SolverState): void {
  state.previous.fill(0);
  state.current.fill(0);
  state.next.fill(0);
  state.simulationTimeSeconds = 0;
}

export function injectGaussianPulse(
  state: SolverState,
  config: SolverConfig,
  column: number,
  row: number,
  amplitude: number,
): void {
  const radiusCells = 3;

  for (let offsetRow = -radiusCells; offsetRow <= radiusCells; offsetRow += 1) {
    for (let offsetColumn = -radiusCells; offsetColumn <= radiusCells; offsetColumn += 1) {
      const targetColumn = column + offsetColumn;
      const targetRow = row + offsetRow;

      if (targetColumn <= 0 || targetColumn >= config.columns - 1 || targetRow <= 0 || targetRow >= config.rows - 1) {
        continue;
      }

      const distanceSquared = offsetColumn ** 2 + offsetRow ** 2;
      const kernelWeight = Math.exp(-distanceSquared / 4);
      state.current[toIndex(config, targetColumn, targetRow)] += amplitude * kernelWeight;
    }
  }
}

export function stepSolver(state: SolverState, config: SolverConfig): void {
  const courantNumber = calculateCourantNumber(config);
  const courantSquared = courantNumber ** 2;
  const dampingStep = config.dampingPerSecond * config.timeStepSeconds;

  state.next.fill(0);

  for (let row = 1; row < config.rows - 1; row += 1) {
    for (let column = 1; column < config.columns - 1; column += 1) {
      const index = toIndex(config, column, row);
      const laplacian =
        state.current[toIndex(config, column - 1, row)] +
        state.current[toIndex(config, column + 1, row)] +
        state.current[toIndex(config, column, row - 1)] +
        state.current[toIndex(config, column, row + 1)] -
        4 * state.current[index];

      // This is the documented damped FDTD update. The fixed zero edge is a
      // temporary prototype boundary, not the absorbing v0.1 boundary.
      state.next[index] =
        (2 - dampingStep) * state.current[index] -
        (1 - dampingStep) * state.previous[index] +
        courantSquared * laplacian;
    }
  }

  const previous = state.previous;
  state.previous = state.current;
  state.current = state.next;
  state.next = previous;
  state.simulationTimeSeconds += config.timeStepSeconds;
}

function toIndex(config: SolverConfig, column: number, row: number): number {
  return row * config.columns + column;
}
