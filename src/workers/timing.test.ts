import { describe, expect, it } from "vitest";
import { scheduleSimulationSteps } from "./timing";

describe("simulation step scheduling", () => {
  it("accumulates fractional playback speeds", () => {
    let accumulator = 0;
    let totalSteps = 0;

    for (let tick = 0; tick < 4; tick += 1) {
      const schedule = scheduleSimulationSteps(accumulator, 16, 0.25);
      accumulator = schedule.remainingAccumulator;
      totalSteps += schedule.steps;
    }

    expect(totalSteps).toBe(1);
  });

  it("runs multiple steps while emitting only one tick result", () => {
    const schedule = scheduleSimulationSteps(0, 16, 2);
    expect(schedule.steps).toBe(2);
    expect(schedule.droppedBacklog).toBe(false);
  });

  it("drops excessive backlog instead of entering a catch-up spiral", () => {
    const schedule = scheduleSimulationSteps(0, 1000, 1);
    expect(schedule.steps).toBe(4);
    expect(schedule.remainingAccumulator).toBe(0);
    expect(schedule.droppedBacklog).toBe(true);
  });
});
