# Wave Lab

**Experiment. Observe. Understand.**

Wave Lab is a mobile-first educational wave simulator for middle-school learners.  
It aims to make reflection, diffraction, interference, phase, wavelength, and amplitude understandable through direct experimentation.

> Current status: interactive Phase 1 browser prototype under active validation.

## Product direction

- Runs in a smartphone browser
- Supports portrait and landscape layouts
- Uses a numerical wave solver rather than pre-rendered animations
- Provides 2D and 2.5D visualization
- Offers guided lessons and a free-experiment mode
- Shows the waveform and phase at a selected observation point
- Is designed for later expansion to Doppler effect, sound, and light

## Planned technology

- React
- TypeScript
- Vite
- Three.js / WebGL2
- Web Worker
- Progressive Web App

The technology stack is provisional until the first performance prototype is validated.

## Development

The current application shell uses React, TypeScript, Vite, and pnpm.

Requirements:

- Node.js `^20.19.0` or `>=22.12.0`
- pnpm

```bash
pnpm install
pnpm dev
```

Run `pnpm typecheck` for TypeScript validation, `pnpm test` for unit tests, and `pnpm build` for a production build.

## Documentation

| Document | Purpose |
|---|---|
| [Project Charter](docs/PROJECT_CHARTER.md) | Scope, purpose, and success criteria |
| [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) | Product requirements for v0.1 |
| [Architecture](docs/ARCHITECTURE.md) | System boundaries and module structure |
| [Physics Engine](docs/PHYSICS_ENGINE.md) | Numerical model and validation policy |
| [UI/UX Guidelines](docs/UI_UX_GUIDELINES.md) | Mobile interaction and accessibility |
| [Lesson Design](docs/LESSON_DESIGN.md) | Educational flow and lesson structure |
| [Roadmap](docs/planning/ROADMAP.md) | Development phases |
| [Backlog](docs/planning/BACKLOG.md) | Deferred ideas and future features |

## Development status

The current prototype includes:

1. Worker-based two-dimensional scalar FDTD simulation
2. Finite-duration tap pulses and individually configurable continuous sources
3. Color and monochrome Canvas 2D rendering
4. Playback, step, reset, speed, and performance controls
5. One observation point with a fixed-scale history graph
6. Editable fixed walls and an adjustable single-slit experiment tool
7. A coherent two-source interference preset
8. Grouped mobile controls and an on-screen Android/rotation performance diagnostic
9. Crisp vector source markers, non-overlapping source settings, and improved outer absorption
10. A requestAnimationFrame renderer path and measured numerical validation tests

The browser-side Android and rotation diagnostic is implemented. Physical-device results still need to be recorded using the [Android validation checklist](docs/validation/ANDROID_PERFORMANCE_AND_ROTATION.md).

## Repository policy

Design decisions that materially affect physics accuracy, educational intent, or architecture must be documented before implementation.
