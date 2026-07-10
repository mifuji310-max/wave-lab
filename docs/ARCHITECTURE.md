# Architecture

## 1. Architectural goals

- Keep numerical simulation independent from React.
- Keep rendering independent from lesson logic.
- Make physical parameters serializable.
- Prevent heavy computation from blocking touch interaction.
- Permit later replacement of the solver or renderer.

## 2. Proposed stack

- React and TypeScript for application UI
- Vite for development and build tooling
- Three.js using WebGL2 for visualization
- Web Worker for numerical simulation
- IndexedDB for local experiments and notes
- PWA manifest and service worker after the core prototype is stable

This stack is provisional until a mobile performance spike is completed.

## 3. Module boundaries

```text
src/
├── app/            Application shell and routing
├── lessons/        Lesson definitions and progress
├── simulation/     Simulation controller and public types
├── physics/        Solver implementation; no React imports
├── renderer/       2D and 2.5D rendering
├── observation/    Sampling and waveform history
├── experiments/    Serialization and local persistence
├── ui/             Reusable UI components
├── workers/        Worker entry points and messages
└── shared/         Units, validation, and common utilities
```

## 4. Runtime data flow

```text
Touch/UI input
    ↓
Simulation controller
    ↓ command
Physics Worker
    ↓ snapshots / sampled data
Renderer + observation store
    ↓
React UI
```

## 5. Worker protocol

Messages must be versioned and typed.

Minimum commands:

- `INIT`
- `START`
- `PAUSE`
- `STEP`
- `RESET`
- `SET_PARAMETER`
- `SET_SOURCES`
- `SET_BOUNDARIES`
- `SET_OBSERVER`
- `DISPOSE`

Minimum events:

- `READY`
- `FRAME`
- `OBSERVATION_SAMPLE`
- `PERFORMANCE`
- `WARNING`
- `ERROR`

Large arrays should use transferable buffers or shared memory only after profiling demonstrates a need.

## 6. State ownership

- React owns navigation and UI state.
- Simulation controller owns experiment configuration.
- Worker owns current numerical arrays and simulation time.
- Renderer owns camera and graphics resources.
- Persistence owns saved experiment documents.

No module may maintain an undisclosed second copy of authoritative simulation configuration.

## 7. Error strategy

Recoverable failures:

- Lower simulation quality
- Restart Worker
- Recreate WebGL context
- Reset an invalid experiment parameter

Fatal failures show:

- What failed
- Whether work was saved
- A reset or reload action
- Diagnostic information suitable for an issue report

## 8. Architecture gates

Before full feature implementation:

1. Validate Worker round-trip cost.
2. Validate 128², 192², and 256² grids on Android.
3. Validate device rotation.
4. Validate Three.js context recovery.
5. Validate observation sampling without full-frame copying.
