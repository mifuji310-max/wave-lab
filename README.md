# Wave Lab

**Experiment. Observe. Understand.**

Wave Lab is a mobile-first educational wave simulator for middle-school learners.  
It aims to make reflection, diffraction, interference, phase, wavelength, and amplitude understandable through direct experimentation.

> Current status: planning and design. Application code has not yet been implemented.

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

## Documentation

| Document | Purpose |
|---|---|
| [Project Charter](docs/PROJECT_CHARTER.md) | Scope, purpose, and success criteria |
| [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) | Product requirements for v0.1 |
| [Architecture](docs/ARCHITECTURE.md) | System boundaries and module structure |
| [Physics Engine](docs/PHYSICS_ENGINE.md) | Numerical model and validation policy |
| [UI/UX Guidelines](docs/UI_UX_GUIDELINES.md) | Mobile interaction and accessibility |
| [Lesson Design](docs/LESSON_DESIGN.md) | Educational flow and lesson structure |
| [Roadmap](docs/ROADMAP.md) | Development phases |
| [Backlog](docs/BACKLOG.md) | Deferred ideas and future features |

## Development status

The next milestone is a minimal physics prototype containing:

1. One pulse source
2. A two-dimensional scalar wave field
3. A 2D color renderer
4. A pause control
5. One observation point
6. Basic performance measurements on Android

## Repository policy

Design decisions that materially affect physics accuracy, educational intent, or architecture must be documented before implementation.
