# ADR-0001: Provisional web stack

- Status: Proposed
- Date: 2026-07-10

## Context

Wave Lab requires a responsive mobile UI, GPU-assisted visualization, and numerical computation separated from the main interaction thread.

## Decision

Prototype with:

- React
- TypeScript
- Vite
- Three.js on WebGL2
- Web Worker

## Consequences

Benefits:

- Clear UI composition
- Strong typing
- Established browser tooling
- Practical 2.5D rendering
- Worker separation

Risks:

- Three.js may be unnecessary overhead for the 2D view.
- Data transfer may become a bottleneck.
- Low-end mobile performance is not yet known.

## Validation required

This decision becomes accepted only after the Phase 1 performance prototype.
