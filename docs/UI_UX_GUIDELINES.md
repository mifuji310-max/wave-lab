# UI/UX Guidelines

## 1. Primary principle

A new user should produce a visible wave within three seconds.

## 2. Interaction vocabulary

- Tap empty field: create a pulse in basic mode
- Long press: open source creation options
- Drag selected object: move it
- Tap object: select it
- Pinch: zoom where supported
- Two-finger drag or dedicated control: adjust 2.5D camera
- Swipe observation handle upward: open bottom sheet

Gestures must have visible alternatives for discoverability and accessibility.

### Wave height color scale

- Positive displacement is red.
- Negative displacement is blue.
- Zero displacement is green, negative intermediate values pass through cyan,
  and positive intermediate values pass through yellow. This contour-plot
  vocabulary makes more of the continuous height range visible.
- Colors between the five reference stops are interpolated continuously because wave
  displacement is a continuous quantity. Discrete color bands must not imply
  physical steps that are absent from the model.

Continuous-source and observation markers are vector overlays. They remain
sharp when the low-resolution simulation grid is enlarged on a phone or PC.
The source marker is a small, plain colored circle so it identifies position
without competing visually with the wave field.

## 3. Modes

Avoid one overloaded toolbar.

Use explicit modes:

- Interact
- Add source
- Draw wall
- Add slit
- Place observer
- Erase

The active mode must remain clearly visible.

## 4. Portrait layout

```text
Top bar
Simulation field
Floating context controls
Playback controls
Tool rail
Observation-sheet handle
```

## 5. Landscape layout

```text
Top/side controls | Large simulation field | Optional observation panel
```

Rotation must not reset the experiment.

## 6. Color and accessibility

- Do not rely on red/blue distinction alone.
- Provide a monochrome or contour cue.
- Display a zero-displacement reference.
- Use sufficient text contrast.
- Respect reduced-motion preferences where practical.
- Avoid flashing patterns.

No final palette is approved at this stage.

## 7. Language

Use concrete terms first:

- “wave height” before “displacement”
- “top of the wave” and “bottom of the wave” before “crest” and “trough”
- “time for one cycle” before “period”

Scientific terms are introduced immediately after the intuitive explanation.

## 8. Parameter controls

Each parameter includes:

- Plain-language label
- Current value
- Safe range
- Reset action
- One-sentence explanation

Sliders must not permit unstable or meaningless solver configurations.

## 9. Observation panel

Three panel heights:

1. Peek: current displacement and mini graph
2. Half: full waveform and core values
3. Full: explanation, measurements, and notes

The panel must not obscure the selected observer without offering a way to pan the field.

## 10. Feedback

Every user action should produce immediate feedback:

- Source placement ripple
- Wall preview
- Invalid placement explanation
- Quality reduction notice
- Save confirmation

Haptic feedback may be optional and must never be required.
