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

      const dampingStep =
        calculateDampingPerSecond(config, column, row) * config.timeStepSeconds;

      // This is the documented damped FDTD update. The outer sponge raises
      // damping smoothly, so the fixed zero edge receives little energy.
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
