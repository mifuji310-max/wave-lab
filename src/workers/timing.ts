export interface StepSchedule {
  steps: number;
  remainingAccumulator: number;
  droppedBacklog: boolean;
}

const baselineFrameMilliseconds = 16;

export function scheduleSimulationSteps(
  accumulatedSteps: number,
  elapsedMilliseconds: number,
  playbackSpeed: 0.25 | 0.5 | 1 | 2,
): StepSchedule {
  const nextAccumulator =
    accumulatedSteps + (Math.max(0, elapsedMilliseconds) / baselineFrameMilliseconds) * playbackSpeed;
  const requestedSteps = Math.floor(nextAccumulator);
  const maximumStepsPerTick = Math.max(1, Math.ceil(4 * playbackSpeed));

  if (requestedSteps > maximumStepsPerTick) {
    return {
      steps: maximumStepsPerTick,
      remainingAccumulator: 0,
      droppedBacklog: true,
    };
  }

  return {
    steps: requestedSteps,
    remainingAccumulator: nextAccumulator - requestedSteps,
    droppedBacklog: false,
  };
}
