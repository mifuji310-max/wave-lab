# ADR-0002: Scalar FDTD wave model

- Status: Proposed
- Date: 2026-07-10

## Context

Reflection, diffraction, and interference must emerge from one coherent numerical model suitable for real-time mobile execution.

## Decision

Prototype a two-dimensional scalar damped wave equation using an explicit finite-difference time-domain scheme.

## Consequences

Benefits:

- Natural superposition
- Reflection and diffraction from boundaries
- Clear educational relationship to the wave equation
- Straightforward array implementation

Limitations:

- Not a full water-fluid model
- Numerical dispersion
- Stability constraints
- Idealized boundaries

## Validation required

The model must pass the validation suite in `PHYSICS_ENGINE.md` before it is used in lessons.
