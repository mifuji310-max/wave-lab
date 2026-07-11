export type RangeGestureDirection = "pending" | "horizontal" | "vertical";

export function classifyRangeGesture(
  horizontalDistance: number,
  verticalDistance: number,
  thresholdPixels = 6,
): RangeGestureDirection {
  const horizontalMagnitude = Math.abs(horizontalDistance);
  const verticalMagnitude = Math.abs(verticalDistance);

  if (Math.max(horizontalMagnitude, verticalMagnitude) < thresholdPixels) {
    return "pending";
  }

  return verticalMagnitude > horizontalMagnitude ? "vertical" : "horizontal";
}
