# Wave Lab AI Development Guide

## Role and decision authority

- ChatGPT is the architecture and design authority.
- Codex and other coding agents implement approved work.
- The repository owner approves changes to scope, learning behavior, physics, public release, licensing, and user data handling.
- Do not change a requirement, physical model, or architecture without approval. Identify the concern and propose the smallest documented change instead.

## Product priorities

1. Physics first: wave behavior must come from the numerical solver, never from a visual animation substitute.
2. Education first: use language and interactions appropriate for middle-school learners.
3. Mobile first: preserve touch usability and portrait/landscape operation.

## Required reading before implementation

Read these documents before making an implementation change:

1. [Project Charter](docs/PROJECT_CHARTER.md)
2. [Product Requirements](docs/PRODUCT_REQUIREMENTS.md)
3. [Architecture](docs/ARCHITECTURE.md)
4. [Physics Engine](docs/PHYSICS_ENGINE.md)
5. [AI Development Guidelines](docs/AI_GUIDELINES.md)
6. [Coding Standards](docs/CODING_STANDARDS.md)

Read the relevant ADRs, UI guidance, testing guidance, and lesson design documents for the issue being implemented.

## Implementation rules

- Work on one approved issue at a time. Keep each change small and reviewable.
- Use React, TypeScript, and Vite for the application. Keep TypeScript strict.
- Do not put numerical simulation work in React components or render paths.
- Keep UI, simulation control, physics, rendering, observation, and persistence separate as defined in `docs/ARCHITECTURE.md`.
- Use a Web Worker for heavy numerical simulation work.
- Do not add a dependency, telemetry, account feature, network call, permission, or data collection without explaining why and receiving approval.
- Do not represent arbitrary grid units as real-world units without a documented mapping.
- Comments explain why, assumptions, units, or numerical constraints—not merely what code does.

## Physics and educational integrity

- Enforce solver stability constraints; user controls must not create an unstable state.
- Document and validate any change to equations, boundaries, sources, damping, units, or phase calculation.
- Do not claim physical accuracy without a recorded validation result.
- Label unavailable or approximate derived values honestly, especially phase during pulses or multi-frequency signals.
- Do not make essential learning depend only on color.

## Required handoff for every change

Report:

- Files changed
- Reason for the change
- Assumptions and open questions
- Impact on physics, learning behavior, mobile use, and architecture
- Tests or validation performed
- Known limitations and follow-up issue, when applicable
