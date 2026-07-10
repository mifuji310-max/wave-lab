# Data Model

## Experiment document

```ts
interface ExperimentDocument {
  schemaVersion: number;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  field: FieldConfiguration;
  sources: SourceConfiguration[];
  obstacles: ObstacleConfiguration[];
  observer?: ObserverConfiguration;
  display: DisplayConfiguration;
  notes?: ExperimentNotes;
}
```

## Design rules

- Persist configuration, not transient numerical arrays.
- Version every saved document.
- Validate all imported data.
- Define migrations before changing persisted fields.
- Use normalized physical coordinates independent of screen pixels.
- Do not persist personal data in v0.1.

## Core entities

### FieldConfiguration

- Width and height
- Wave speed
- Damping
- Boundary strategy
- Quality preset

### SourceConfiguration

- Stable ID
- Type
- Position or geometry
- Amplitude
- Frequency
- Phase
- Temporal envelope
- Enabled state

### ObstacleConfiguration

- Stable ID
- Geometry
- Boundary type
- Enabled state

### ObserverConfiguration

- Position
- Sampling interval
- History duration

### DisplayConfiguration

- 2D color, monochrome, or 2.5D
- Camera preset
- Gain
- Legend visibility

### ExperimentNotes

- Prediction
- Observation
- Conclusion
- Optional image reference
