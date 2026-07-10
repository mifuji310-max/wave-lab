# Product Requirements — v0.1

## 1. Product modes

### 1.1 Guided learning

The home screen provides these lessons:

1. What is a wave?
2. Reflection
3. Diffraction
4. Interference

Each lesson includes:

- A short learning objective
- A prediction question
- A prepared experiment
- One or more editable parameters
- A result prompt
- A concise explanation
- An optional “Learn more” section

### 1.2 Free experiment

The user can place and edit:

- Point sources
- Line sources
- Pulse sources
- Continuous sources
- Walls
- A single slit
- One observation point

Arbitrary drawn waveforms are reserved behind an experimental feature flag until usability and numerical stability are verified.

## 2. Simulation controls

Required controls:

- Play
- Pause
- Advance one simulation step while paused
- Reset
- Simulation speed: 0.25×, 0.5×, 1×, 2×
- Display mode: color, monochrome, 2.5D
- Quality: automatic, low, standard, high

True reverse-time simulation is not required for v0.1. A history buffer may later provide visual rewind.

## 3. Observation panel

A tap on the field can place or move one observation point.

The bottom sheet displays:

- Current displacement
- Estimated phase, when meaningful
- Local amplitude estimate
- Time-history waveform
- Simulation time
- Source frequency and period when a periodic source is selected

The graph must distinguish measured values from derived estimates.

## 4. Display

### 4.1 Color view

- Positive displacement, equilibrium, and negative displacement use a diverging scale.
- A legend is always available.
- An alternative non-color cue is provided.

### 4.2 Monochrome view

A height-derived shading view approximates the visual impression of ripples without pretending to be a photorealistic fluid rendering.

### 4.3 2.5D view

The scalar wave field is rendered as a height surface.

Required:

- Fixed safe camera presets
- Limited orbit or tilt
- Reset camera
- No control that conflicts with page scrolling

## 5. Responsive behavior

### Portrait

- Simulation field occupies the main upper region.
- Primary tools remain reachable near the bottom.
- Observation data opens as a bottom sheet.

### Landscape

- Simulation field expands.
- Observation panel may use a side panel when space permits.
- The same experiment state is retained during rotation.

## 6. Experiment notes

Local-only notes for v0.1:

- Lesson or experiment name
- Prediction
- Selected parameter values
- Observation
- Conclusion
- Optional captured image

No cloud account is required.

## 7. Non-functional requirements

- No mandatory login
- No advertising
- No collection of personal data in v0.1
- Keyboard accessibility for desktop use
- Touch targets at least 44 CSS pixels where practical
- User-visible recovery from WebGL or Worker failure
- Clear warning when device performance forces a lower quality setting

## 8. Acceptance tests

Each requirement must have at least one documented acceptance test before v0.1 is tagged.
