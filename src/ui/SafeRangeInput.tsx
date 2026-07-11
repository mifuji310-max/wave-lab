import { useRef } from "react";
import { classifyRangeGesture, type RangeGestureDirection } from "./rangeGesture";

interface SafeRangeInputProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
}

interface TouchGesture {
  startX: number;
  startY: number;
  initialValue: number;
  direction: RangeGestureDirection;
}

export function SafeRangeInput({
  min,
  max,
  step,
  value,
  onValueChange,
}: SafeRangeInputProps) {
  const touchGestureReference = useRef<TouchGesture | undefined>(undefined);

  const restoreInitialValue = () => {
    const gesture = touchGestureReference.current;

    if (gesture !== undefined) {
      onValueChange(gesture.initialValue);
    }
  };

  return (
    <input
      className="safe-range-input"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onPointerDown={(event) => {
        if (event.pointerType !== "touch") {
          return;
        }

        touchGestureReference.current = {
          startX: event.clientX,
          startY: event.clientY,
          initialValue: value,
          direction: "pending",
        };
      }}
      onPointerMove={(event) => {
        const gesture = touchGestureReference.current;

        if (event.pointerType !== "touch" || gesture === undefined) {
          return;
        }

        if (gesture.direction === "pending") {
          gesture.direction = classifyRangeGesture(
            event.clientX - gesture.startX,
            event.clientY - gesture.startY,
          );
        }

        if (gesture.direction === "vertical") {
          onValueChange(gesture.initialValue);
        }
      }}
      onPointerUp={() => {
        if (touchGestureReference.current?.direction === "vertical") {
          restoreInitialValue();
        }

        touchGestureReference.current = undefined;
      }}
      onPointerCancel={() => {
        restoreInitialValue();
        touchGestureReference.current = undefined;
      }}
      onChange={(event) => {
        const gesture = touchGestureReference.current;

        if (gesture?.direction === "vertical") {
          onValueChange(gesture.initialValue);
          return;
        }

        onValueChange(Number(event.target.value));
      }}
    />
  );
}
